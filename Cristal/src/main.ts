import { Plugin, FileSystemAdapter, Menu, Editor, MarkdownView } from "obsidian";
import { CristalChatView, CRISTAL_VIEW_TYPE } from "./ChatView";
import { ClaudeService } from "./ClaudeService";
import { CodexService } from "./CodexService";
import { CristalSettingTab } from "./settings";
import type { CristalSettings, ChatSession, PluginData, AIProvider, AgentConfig, CLIType } from "./types";
import { DEFAULT_SETTINGS, DEFAULT_AGENTS } from "./types";
import { SYSTEM_PROMPTS, type LanguageCode } from "./systemPrompts";
import { detectCLIPath, detectCodexCLIPath } from "./cliDetector";
import { setCodexReasoningLevel } from "./codexConfig";
import { TerminalService, TerminalView, TERMINAL_VIEW_TYPE } from "./terminal";

const MAX_SESSIONS = 20;

export default class CristalPlugin extends Plugin {
	settings: CristalSettings;
	claudeService: ClaudeService;
	codexService: CodexService;
	terminalService: TerminalService;
	sessions: ChatSession[] = [];
	currentSessionId: string | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize services with vault path as working directory
		const vaultPath = this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();

		// Get agent configs
		const claudeAgent = this.getAgentByCliType("claude");
		const codexAgent = this.getAgentByCliType("codex");

		// Claude service
		this.claudeService = new ClaudeService(claudeAgent?.cliPath || "claude", vaultPath);
		if (claudeAgent?.permissions) {
			this.claudeService.setPermissions(claudeAgent.permissions);
		}

		// Codex service (full-access mode is hardcoded)
		this.codexService = new CodexService(codexAgent?.cliPath || "codex", vaultPath);

		// Sync Codex reasoning level to ~/.codex/config.toml on startup
		if (codexAgent) {
			const level = codexAgent.reasoningEnabled ? "xhigh" : "medium";
			setCodexReasoningLevel(level);
		}

		// Initialize terminal service
		this.terminalService = new TerminalService(vaultPath, this.settings.terminal);

		// Register terminal view
		this.registerView(
			TERMINAL_VIEW_TYPE,
			(leaf) => new TerminalView(leaf, this)
		);

		// Add command to open terminal
		this.addCommand({
			id: "open-terminal",
			name: "Open terminal",
			callback: () => this.openTerminal()
		});

		// Ensure agent instructions exist in Cristal Rules folder
		await this.ensureAgentMd("claude");
		await this.ensureAgentMd("codex");

		// Register the chat view (check if already registered for hot reload)
		// @ts-ignore - viewRegistry is not in public API but exists
		const viewRegistry = this.app.viewRegistry;
		if (!viewRegistry?.typeByExtension?.[CRISTAL_VIEW_TYPE] && !viewRegistry?.viewByType?.[CRISTAL_VIEW_TYPE]) {
			this.registerView(
				CRISTAL_VIEW_TYPE,
				(leaf) => new CristalChatView(leaf, this)
			);
		} else {
			console.log("Cristal: View type already registered (hot reload)");
		}

		// Add ribbon icon to open chat
		this.addRibbonIcon("gem", "Open Cristal", () => {
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

		// Add settings tab
		this.addSettingTab(new CristalSettingTab(this.app, this));

		// Add context menu item to mention selected text in chat
		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				if (selection && selection.trim().length > 0) {
					menu.addItem((item) => {
						item.setTitle("Cristal: Упомянуть при запросе")
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

		console.log("Cristal plugin loaded");
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

		const leaves = this.app.workspace.getLeavesOfType(CRISTAL_VIEW_TYPE);
		if (leaves.length === 0) return;

		const chatView = leaves[0]?.view as CristalChatView;
		if (chatView && typeof chatView.addSelectedText === "function") {
			chatView.addSelectedText(text, source, position);
		}
	}

	onunload(): void {
		// Abort all running processes
		this.claudeService.abortAll();
		this.codexService.abortAll();
		// Kill all terminal sessions
		this.terminalService?.killAll();
		// Detach all leaves of this view type to avoid "existing view type" error on reload
		this.app.workspace.detachLeavesOfType(CRISTAL_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(TERMINAL_VIEW_TYPE);
		console.log("Cristal plugin unloaded");
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

	// Get active service based on agent or provider
	getActiveService(provider?: AIProvider): ClaudeService | CodexService {
		// If provider specified, use it directly
		if (provider) {
			return provider === "codex" ? this.codexService : this.claudeService;
		}
		// Otherwise use default agent's CLI type
		const defaultAgent = this.getDefaultAgent();
		if (defaultAgent?.cliType === "codex") {
			return this.codexService;
		}
		return this.claudeService;
	}

	getServiceForAgent(agent: AgentConfig): ClaudeService | CodexService {
		return agent.cliType === "codex" ? this.codexService : this.claudeService;
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		let leaf = workspace.getLeavesOfType(CRISTAL_VIEW_TYPE)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: CRISTAL_VIEW_TYPE,
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
	 * Open the terminal view
	 */
	async openTerminal(): Promise<TerminalView | null> {
		const { workspace } = this.app;

		// Check if terminal view already exists
		let leaf = workspace.getLeavesOfType(TERMINAL_VIEW_TYPE)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: TERMINAL_VIEW_TYPE,
					active: true
				});
				leaf = rightLeaf;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
			return leaf.view as TerminalView;
		}

		return null;
	}

	/**
	 * Open terminal and execute a command
	 * Used by "Start Integration" button in settings
	 */
	async openTerminalWithCommand(command: string): Promise<void> {
		const terminalView = await this.openTerminal();
		if (terminalView) {
			await terminalView.executeCommand(command);
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
				console.log("Cristal: Migrating from old settings format to agents...");
				this.settings.agents = this.migrateOldSettings(data.settings);
				this.settings.defaultAgentId = data.settings.defaultProvider === "codex" ? "codex-default" : "claude-default";
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
					console.log(`Cristal: Auto-detected Claude CLI at ${detected.path}`);
				}
			}
			if (agent.cliType === "codex" && (!agent.cliPath || agent.cliPath === "codex")) {
				const detected = detectCodexCLIPath();
				if (detected.found) {
					agent.cliPath = detected.path;
					console.log(`Cristal: Auto-detected Codex CLI at ${detected.path}`);
				}
			}
		}
	}

	/**
	 * Migrates old settings format to new agents array
	 */
	private migrateOldSettings(oldSettings: Partial<CristalSettings>): AgentConfig[] {
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
			permissions: oldSettings.permissions || { webSearch: false, webFetch: false, task: false }
		});

		// Migrate Codex settings
		agents.push({
			id: "codex-default",
			cliType: "codex",
			name: "Codex",
			description: "OpenAI Codex CLI",
			enabled: oldSettings.defaultProvider === "codex",
			cliPath: oldSettings.codexCliPath || "codex",
			model: oldSettings.codexDefaultModel || "gpt-5.2-codex",
			reasoningEnabled: oldSettings.codexReasoningLevel === "xhigh"
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

		// Update services with agent settings
		const claudeAgent = this.getAgentByCliType("claude");
		const codexAgent = this.getAgentByCliType("codex");

		if (claudeAgent) {
			this.claudeService.setCliPath(claudeAgent.cliPath);
			if (claudeAgent.permissions) {
				this.claudeService.setPermissions(claudeAgent.permissions);
			}
		}

		if (codexAgent) {
			this.codexService.setCliPath(codexAgent.cliPath);
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

	// ==================== Agent Instructions Management ====================
	// All agent instructions are stored in "Cristal Rules" folder

	private readonly CRISTAL_RULES_FOLDER = "Cristal Rules";

	getVaultPath(): string {
		return this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();
	}

	/**
	 * Ensures the Cristal Rules folder exists
	 */
	async ensureCristalRulesFolder(): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(this.CRISTAL_RULES_FOLDER);
		if (!folder) {
			await this.app.vault.createFolder(this.CRISTAL_RULES_FOLDER);
			console.log(`Cristal: Created folder "${this.CRISTAL_RULES_FOLDER}"`);
		}
	}

	/**
	 * Gets the vault path for agent instructions file
	 */
	getAgentMdPath(agent: "claude" | "codex"): string {
		const filename = agent === "claude" ? "CLAUDE.md" : "AGENT.md";
		return `${this.CRISTAL_RULES_FOLDER}/${filename}`;
	}

	/**
	 * Reads agent instructions from Cristal Rules folder
	 */
	async readAgentMd(agent: "claude" | "codex"): Promise<string | null> {
		try {
			const filePath = this.getAgentMdPath(agent);
			const file = this.app.vault.getAbstractFileByPath(filePath);
			if (file && "extension" in file) {
				return await this.app.vault.read(file as import("obsidian").TFile);
			}
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Writes agent instructions to Cristal Rules folder
	 */
	async writeAgentMd(agent: "claude" | "codex", content: string): Promise<void> {
		await this.ensureCristalRulesFolder();
		const filePath = this.getAgentMdPath(agent);
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file && "extension" in file) {
			await this.app.vault.modify(file as import("obsidian").TFile, content);
		} else {
			await this.app.vault.create(filePath, content);
		}
	}

	/**
	 * Gets default content for agent instructions (same for both agents)
	 */
	getDefaultAgentMdContent(): string {
		const lang = this.settings.language as LanguageCode;
		return SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS.en;
	}

	/**
	 * Ensures agent instructions file exists, migrating from root if needed
	 */
	async ensureAgentMd(agent: "claude" | "codex"): Promise<void> {
		// For Claude: check if old CLAUDE.md exists in root and migrate
		if (agent === "claude") {
			const oldFile = this.app.vault.getAbstractFileByPath("CLAUDE.md");
			if (oldFile && "extension" in oldFile) {
				// Read old content
				const oldContent = await this.app.vault.read(oldFile as import("obsidian").TFile);
				// Write to new location
				await this.writeAgentMd("claude", oldContent);
				// Delete old file
				await this.app.vault.delete(oldFile);
				console.log(`Cristal: Migrated CLAUDE.md to ${this.CRISTAL_RULES_FOLDER}/`);
				return;
			}
		}

		// Check if file already exists in Cristal Rules
		const existing = await this.readAgentMd(agent);
		if (!existing) {
			await this.writeAgentMd(agent, this.getDefaultAgentMdContent());
			console.log(`Cristal: Created ${this.getAgentMdPath(agent)}`);
		}
	}

	/**
	 * Resets agent instructions to default
	 */
	async resetAgentMd(agent: "claude" | "codex"): Promise<void> {
		await this.writeAgentMd(agent, this.getDefaultAgentMdContent());
	}

	// Legacy methods for backwards compatibility
	async readClaudeMd(): Promise<string | null> {
		return this.readAgentMd("claude");
	}

	async writeClaudeMd(content: string): Promise<void> {
		return this.writeAgentMd("claude", content);
	}

	getDefaultClaudeMdContent(): string {
		return this.getDefaultAgentMdContent();
	}

	async ensureClaudeMd(): Promise<void> {
		return this.ensureAgentMd("claude");
	}

	async resetClaudeMd(): Promise<void> {
		return this.resetAgentMd("claude");
	}
}
