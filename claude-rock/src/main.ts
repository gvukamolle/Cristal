import { Plugin, FileSystemAdapter } from "obsidian";
import { ClaudeChatView, CLAUDE_VIEW_TYPE } from "./ChatView";
import { ClaudeService } from "./ClaudeService";
import { ClaudeRockSettingTab } from "./settings";
import type { ClaudeRockSettings, ChatSession, PluginData } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const MAX_SESSIONS = 20;

export default class ClaudeRockPlugin extends Plugin {
	settings: ClaudeRockSettings;
	claudeService: ClaudeService;
	sessions: ChatSession[] = [];
	currentSessionId: string | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Initialize Claude service with vault path as working directory
		const vaultPath = this.app.vault.adapter instanceof FileSystemAdapter
			? this.app.vault.adapter.getBasePath()
			: process.cwd();
		this.claudeService = new ClaudeService(this.settings.cliPath, vaultPath);
		this.claudeService.setPermissions(this.settings.permissions);

		// Register the chat view
		this.registerView(
			CLAUDE_VIEW_TYPE,
			(leaf) => new ClaudeChatView(leaf, this)
		);

		// Add ribbon icon to open chat
		this.addRibbonIcon("message-square", "Open Claude Rock", () => {
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
				this.claudeService.clearSession();
				await this.activateView();
			}
		});

		// Add settings tab
		this.addSettingTab(new ClaudeRockSettingTab(this.app, this));

		console.log("Claude Rock plugin loaded");
	}

	onunload(): void {
		// Abort any running process
		this.claudeService.abort();
		console.log("Claude Rock plugin unloaded");
	}

	async activateView(): Promise<void> {
		const { workspace } = this.app;

		// Check if view already exists
		let leaf = workspace.getLeavesOfType(CLAUDE_VIEW_TYPE)[0];

		if (!leaf) {
			// Create new leaf in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: CLAUDE_VIEW_TYPE,
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

	async loadSettings(): Promise<void> {
		const data = await this.loadData() as PluginData | null;
		if (data) {
			this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
			this.sessions = data.sessions || [];
			this.currentSessionId = data.currentSessionId;
		} else {
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
			this.sessions = [];
			this.currentSessionId = null;
		}
	}

	async saveSettings(): Promise<void> {
		const data: PluginData = {
			settings: this.settings,
			sessions: this.sessions.slice(0, MAX_SESSIONS),
			currentSessionId: this.currentSessionId
		};
		await this.saveData(data);
		// Update service with new settings
		this.claudeService.setCliPath(this.settings.cliPath);
		this.claudeService.setPermissions(this.settings.permissions);
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
		this.claudeService.clearSession();
		this.saveSettings();
		return session;
	}

	getCurrentSession(): ChatSession | null {
		if (!this.currentSessionId) return null;
		return this.sessions.find(s => s.id === this.currentSessionId) || null;
	}

	switchToSession(sessionId: string): ChatSession | null {
		const session = this.sessions.find(s => s.id === sessionId);
		if (session) {
			this.currentSessionId = sessionId;
			// Restore CLI session if available
			if (session.cliSessionId) {
				// ClaudeService will use this for --resume
				this.claudeService.clearSession();
			}
			this.saveSettings();
		}
		return session || null;
	}

	updateCurrentSession(messages: import("./types").ChatMessage[], cliSessionId: string | null): void {
		const session = this.getCurrentSession();
		if (session) {
			session.messages = messages;
			session.cliSessionId = cliSessionId;
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
}
