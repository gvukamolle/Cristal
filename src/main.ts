import { Plugin, FileSystemAdapter, Menu, Editor, MarkdownView } from "obsidian";
import { execSync } from "child_process";
import { CrystalChatView, CRYSTAL_VIEW_TYPE } from "./ChatView";
import { ClaudeService } from "./ClaudeService";
import { CrystalSettingTab } from "./settings";
import type { CrystalSettings, ChatSession, PluginData, AgentConfig, CLIType } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_AGENTS } from "./types";
import { detectCLIPath } from "./cliDetector";
import { SkillLoader, CreateSkillModal, ValidateSkillModal, SkillSelectorModal } from "./skills";

const MAX_SESSIONS = 20;

export default class CrystalPlugin extends Plugin {
	settings: CrystalSettings;
	claudeService: ClaudeService;
	skillLoader: SkillLoader;
	sessions: ChatSession[] = [];
	currentSessionId: string | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize services with vault path as working directory
		const vaultPath = this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();

		// Get agent config
		const claudeAgent = this.getAgentByCliType("claude");

		// Claude service
		this.claudeService = new ClaudeService(claudeAgent?.cliPath || "claude", vaultPath);
		if (claudeAgent?.permissions) {
			this.claudeService.setPermissions(claudeAgent.permissions);
		}

		// Initialize skill loader
		this.skillLoader = new SkillLoader(this.app.vault);
		await this.skillLoader.initialize();
		console.log(`Crystal: Loaded ${this.skillLoader.getSkillReferences().length} skills`);

		// Sync skills for all agents on startup
		await this.syncAllAgentSkills();

		// Register the chat view (check if already registered for hot reload)
		// @ts-ignore - viewRegistry is not in public API but exists
		const viewRegistry = this.app.viewRegistry;
		if (!viewRegistry?.typeByExtension?.[CRYSTAL_VIEW_TYPE] && !viewRegistry?.viewByType?.[CRYSTAL_VIEW_TYPE]) {
			this.registerView(
				CRYSTAL_VIEW_TYPE,
				(leaf) => new CrystalChatView(leaf, this)
			);
		} else {
			console.log("Crystal: View type already registered (hot reload)");
		}

		// Add ribbon icon to open chat
		this.addRibbonIcon("gem", "Open Crystal", () => {
			this.activateView();
		});

		// Add command to open chat
		this.addCommand({
			id: "open-claude-rock-chat",
			name: "Open chat",
			callback: () => this.activateView()
		});

		// Add command to start new chat
		this.addCommand({
			id: "new-claude-rock-chat",
			name: "New chat",
			callback: async () => {
				await this.activateView();
			}
		});

		// ==================== Skills Commands ====================

		// Command: Create new skill
		this.addCommand({
			id: "create-new-skill",
			name: "Create new skill",
			callback: () => {
				new CreateSkillModal(
					this.app,
					this.skillLoader,
					this.settings.language,
					async (skillId: string) => {
						await this.skillLoader.refresh();
						await this.syncAllAgentSkills();
						new (await import("obsidian")).Notice(`Skill "${skillId}" created successfully`);
					}
				).open();
			}
		});

		// Command: Validate skill
		this.addCommand({
			id: "validate-skill",
			name: "Validate skill",
			callback: () => {
				const vaultSkills = this.skillLoader.getSkillReferences().filter(s => !s.isBuiltin);

				if (vaultSkills.length === 0) {
					new (require("obsidian")).Notice("No custom skills found in .crystal/skills/");
					return;
				}

				new SkillSelectorModal(
					this.app,
					vaultSkills,
					this.settings.language,
					(skillId: string) => {
						new ValidateSkillModal(this.app, this.skillLoader, skillId, this.settings.language).open();
					}
				).open();
			}
		});

		// Command: Refresh skills
		this.addCommand({
			id: "refresh-skills",
			name: "Refresh skills",
			callback: async () => {
				await this.skillLoader.refresh();
				await this.syncAllAgentSkills();
				const count = this.skillLoader.getSkillReferences().length;
				new (require("obsidian")).Notice(`Skills refreshed. Found ${count} skills.`);
			}
		});

		// Add settings tab
		this.addSettingTab(new CrystalSettingTab(this.app, this));

		// Add context menu item to mention selected text in chat
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection && selection.trim().length > 0) {
					menu.addItem((item) => {
						item.setTitle("Crystal: Упомянуть при запросе")
							.setIcon("text-cursor")
							.onClick(() => {
								// Get cursor positions for precise replacement later
								const from = editor.getCursor("from");
								const to = editor.getCursor("to");
								const filePath = view.file?.path || "";

								this.mentionSelectedText(selection, view.file?.basename || "Editor", {
									filePath,
									startLine: from.line,
									startCh: from.ch,
									endLine: to.line,
									endCh: to.ch
								});
							});
					});
				}
			})
		);

		console.log("Crystal plugin loaded");
	}

	// Add selected text to chat context with position info
	async mentionSelectedText(
		text: string,
		source: string,
		position?: {
			filePath: string;
			startLine: number;
			startCh: number;
			endLine: number;
			endCh: number;
		}
	): Promise<void> {
		await this.activateView();

		const leaves = this.app.workspace.getLeavesOfType(CRYSTAL_VIEW_TYPE);
		if (leaves.length === 0) return;

		const chatView = leaves[0]?.view as CrystalChatView;
		if (chatView && typeof chatView.addSelectedText === "function") {
			chatView.addSelectedText(text, source, position);
		}
	}

	onunload(): void {
		// Abort all running processes
		this.claudeService.abortAll();
		// Detach all leaves of this view type to avoid "existing view type" error on reload
		this.app.workspace.detachLeavesOfType(CRYSTAL_VIEW_TYPE);
		console.log("Crystal plugin unloaded");
	}

	// ==================== Agent Helper Methods ====================

	getAgentById(id: string): AgentConfig | undefined {
		return this.settings.agents.find(a => a.id === id);
	}

	getAgentByCliType(type: CLIType): AgentConfig | undefined {
		return this.settings.agents.find(a => a.cliType === type);
	}

	getDefaultAgent(): AgentConfig | undefined {
		if (this.settings.defaultAgentId) {
			return this.getAgentById(this.settings.defaultAgentId);
		}
		// Fallback to first enabled agent
		return this.settings.agents.find(a => a.enabled);
	}

	getEnabledAgents(): AgentConfig[] {
		return this.settings.agents.filter(a => a.enabled);
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		let leaf = workspace.getLeavesOfType(CRYSTAL_VIEW_TYPE)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: CRYSTAL_VIEW_TYPE,
					active: true
				});
				leaf = rightLeaf;
			}
		}

		// Reveal and focus the leaf
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * Open command in system terminal (Terminal.app on macOS)
	 * Opens a new native terminal window with the command
	 */
	openInSystemTerminal(command: string): boolean {
		const vaultPath = this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();
		const platform = process.platform;

		try {
			if (platform === "darwin") {
				// macOS: Use osascript to open Terminal.app
				const escapedCwd = vaultPath.replace(/"/g, '\\"');
				const escapedCommand = command.replace(/"/g, '\\"');

				// Add ~/.local/bin to PATH to avoid "not in PATH" warning
				const pathSetup = 'export PATH=\\"$HOME/.local/bin:$PATH\\"';

				const appleScript = `tell application "Terminal"
					activate
					do script "${pathSetup} && cd \\"${escapedCwd}\\" && ${escapedCommand}"
				end tell`;

				execSync(`osascript -e '${appleScript}'`, {
					encoding: "utf-8",
					timeout: 5000
				});

				return true;
			} else if (platform === "linux") {
				// Linux: Try common terminal emulators
				const terminals = ["gnome-terminal", "konsole", "xfce4-terminal", "xterm"];

				for (const term of terminals) {
					try {
						if (term === "gnome-terminal") {
							execSync(`${term} -- bash -c 'cd "${vaultPath}" && ${command}; exec bash'`, {
								encoding: "utf-8",
								timeout: 5000
							});
						} else if (term === "konsole") {
							execSync(`${term} --workdir "${vaultPath}" -e bash -c '${command}; exec bash'`, {
								encoding: "utf-8",
								timeout: 5000
							});
						} else {
							execSync(`${term} -e bash -c 'cd "${vaultPath}" && ${command}; exec bash'`, {
								encoding: "utf-8",
								timeout: 5000
							});
						}
						return true;
					} catch {
						continue;
					}
				}
				console.warn("[Crystal] No supported terminal emulator found on Linux");
				return false;
			} else if (platform === "win32") {
				// Windows: Use Windows Terminal or cmd
				try {
					execSync(`wt -d "${vaultPath}" cmd /k ${command}`, {
						encoding: "utf-8",
						timeout: 5000
					});
					return true;
				} catch {
					execSync(`cmd /c start cmd /k "cd /d "${vaultPath}" && ${command}"`, {
						encoding: "utf-8",
						timeout: 5000
					});
					return true;
				}
			}

			console.warn(`[Crystal] Unsupported platform: ${platform}`);
			return false;
		} catch (error) {
			console.error("[Crystal] Failed to open system terminal:", error);
			return false;
		}
	}

	async loadSettings(): Promise<void> {
		const data = await this.loadData() as PluginData | null;
		if (data) {
			this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
			this.sessions = data.sessions || [];
			this.currentSessionId = data.currentSessionId;

			// Migrate from old format if needed (no agents array)
			if (!this.settings.agents || this.settings.agents.length === 0) {
				console.log("Crystal: Migrating from old settings format to agents...");
				this.settings.agents = this.migrateOldSettings(data.settings);
				this.settings.defaultAgentId = "claude-default";
			}
		} else {
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
			this.sessions = [];
			this.currentSessionId = null;
		}

		// Auto-detect CLI paths for agents
		for (const agent of this.settings.agents) {
			if (agent.cliType === "claude" && (!agent.cliPath || agent.cliPath === "claude")) {
				const detected = detectCLIPath();
				if (detected.found) {
					agent.cliPath = detected.path;
					console.log(`Crystal: Auto-detected Claude CLI at ${detected.path}`);
				}
			}
		}
	}

	/**
	 * Migrates old settings format to new agents array
	 */
	private migrateOldSettings(oldSettings: Partial<CrystalSettings>): AgentConfig[] {
		const agents: AgentConfig[] = [];

		// Migrate Claude settings
		agents.push({
			id: "claude-default",
			cliType: "claude",
			name: "Claude",
			description: "Anthropic Claude Code CLI",
			enabled: true,
			cliPath: oldSettings.cliPath || "claude",
			model: oldSettings.defaultModel || "claude-haiku-4-5-20251001",
			thinkingEnabled: oldSettings.thinkingEnabled || false,
			permissions: oldSettings.permissions || {
				webSearch: false,
				webFetch: false,
				task: false,
				fileRead: true,
				fileWrite: true,
				fileEdit: true,
				extendedThinking: false
			}
		});

		return agents;
	}

	async saveSettings(): Promise<void> {
		const data: PluginData = {
			settings: this.settings,
			sessions: this.sessions.slice(0, MAX_SESSIONS),
			currentSessionId: this.currentSessionId
		};
		await this.saveData(data);

		// Update Claude service with agent settings
		const claudeAgent = this.getAgentByCliType("claude");
		if (claudeAgent) {
			this.claudeService.setCliPath(claudeAgent.cliPath);
			if (claudeAgent.permissions) {
				this.claudeService.setPermissions(claudeAgent.permissions);
			}
		}
	}

	// Session management
	createNewSession(): ChatSession {
		const session: ChatSession = {
			id: crypto.randomUUID(),
			cliSessionId: null,
			messages: [],
			createdAt: Date.now()
		};
		this.sessions.unshift(session);
		this.currentSessionId = session.id;
		this.saveSettings();
		return session;
	}

	getCurrentSession(): ChatSession | null {
		if (!this.currentSessionId) return null;
		return this.sessions.find(s => s.id === this.currentSessionId) || null;
	}

	getAllSessions(): ChatSession[] {
		return this.sessions;
	}

	switchToSession(sessionId: string): ChatSession | null {
		const session = this.sessions.find(s => s.id === sessionId);
		if (session) {
			this.currentSessionId = sessionId;
			this.saveSettings();
		}
		return session || null;
	}

	updateCurrentSession(
		messages: import("./types").ChatMessage[],
		cliSessionId: string | null,
		tokenStats?: import("./types").SessionTokenStats
	): void {
		const session = this.getCurrentSession();
		if (session) {
			session.messages = messages;
			session.cliSessionId = cliSessionId;
			if (tokenStats) {
				session.tokenStats = tokenStats;
			}
			// Auto-generate title from first user message
			if (!session.title && messages.length > 0) {
				const firstUserMsg = messages.find(m => m.role === "user");
				if (firstUserMsg) {
					session.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "..." : "");
				}
			}
			this.saveSettings();
		}
	}

	deleteSession(sessionId: string): void {
		this.sessions = this.sessions.filter(s => s.id !== sessionId);
		if (this.currentSessionId === sessionId) {
			this.currentSessionId = this.sessions[0]?.id || null;
		}
		this.saveSettings();
	}

	addTokensToHistory(tokens: number): void {
		if (tokens <= 0) return;

		const today = new Date().toISOString().split("T")[0] as string;
		if (!this.settings.tokenHistory) {
			this.settings.tokenHistory = {};
		}
		this.settings.tokenHistory[today] = (this.settings.tokenHistory[today] || 0) + tokens;
		this.saveSettings();
	}

	getTokenHistory(): Record<string, number> {
		return this.settings.tokenHistory || {};
	}

	getVaultPath(): string {
		return this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();
	}

	/**
	 * Sync skills for all Claude agents
	 */
	async syncAllAgentSkills(): Promise<void> {
		if (!this.skillLoader) return;

		for (const agent of this.settings.agents) {
			if (agent.cliType === "claude") {
				const enabledSkills = agent.enabledSkills || [];
				if (enabledSkills.length > 0) {
					await this.skillLoader.syncSkillsForAgent(agent.cliType, enabledSkills);
				}
			}
		}
	}
}
