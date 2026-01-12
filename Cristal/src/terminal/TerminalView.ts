/**
 * Terminal View for Obsidian
 *
 * ItemView implementation that displays an embedded terminal.
 */

import { ItemView, WorkspaceLeaf, setIcon } from "obsidian";
import type CristalPlugin from "../main";
import { XtermWrapper } from "./XtermWrapper";
import type { IPtyBackend, TerminalSession } from "./types";

export const TERMINAL_VIEW_TYPE = "cristal-terminal-view";

export class TerminalView extends ItemView {
	private plugin: CristalPlugin;
	private xterm: XtermWrapper | null = null;
	private sessionId: string;
	private backend: IPtyBackend | null = null;
	private session: TerminalSession | null = null;
	private pendingCommand: string | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: CristalPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.sessionId = crypto.randomUUID();
	}

	getViewType(): string {
		return TERMINAL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Cristal Terminal";
	}

	getIcon(): string {
		return "terminal";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("cristal-terminal-container");

		// Header with controls
		const header = container.createDiv({ cls: "cristal-terminal-header" });

		// Title
		const titleEl = header.createSpan({ cls: "cristal-terminal-title" });
		titleEl.setText("Cristal Terminal");

		// Actions
		const actions = header.createDiv({ cls: "cristal-terminal-actions" });

		// Restart button
		const restartBtn = actions.createEl("button", { cls: "cristal-terminal-action" });
		setIcon(restartBtn, "refresh-cw");
		restartBtn.setAttribute("aria-label", "Restart terminal");
		restartBtn.addEventListener("click", () => this.restartSession());

		// Close button (closes the entire view)
		const closeBtn = actions.createEl("button", { cls: "cristal-terminal-action" });
		setIcon(closeBtn, "x");
		closeBtn.setAttribute("aria-label", "Close terminal");
		closeBtn.addEventListener("click", () => {
			this.killProcess();
			this.leaf.detach();
		});

		// Terminal container
		const terminalContainer = container.createDiv({ cls: "cristal-terminal-xterm" });

		// Initialize xterm.js
		const termSettings = this.plugin.settings.terminal;
		this.xterm = new XtermWrapper(terminalContainer, {
			fontSize: termSettings?.fontSize ?? 14,
			fontFamily: termSettings?.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace',
			scrollback: termSettings?.scrollback ?? 1000,
			cursorStyle: termSettings?.cursorStyle ?? "block"
		});

		// Start terminal session
		await this.startSession();
	}

	/**
	 * Start a new terminal session
	 */
	async startSession(profileId?: string): Promise<void> {
		// Ensure terminal service exists
		if (!this.plugin.terminalService) {
			this.xterm?.write("\x1b[31mTerminal service not initialized\x1b[0m\r\n");
			return;
		}

		try {
			const { backend, session } = await this.plugin.terminalService.createSession(
				this.sessionId,
				profileId
			);

			this.backend = backend;
			this.session = session;

			// Attach to xterm
			this.xterm?.attach(backend);
			this.xterm?.focus();

			// Execute pending command if any
			if (this.pendingCommand) {
				// Small delay to let shell initialize
				setTimeout(() => {
					if (this.pendingCommand && this.backend) {
						this.backend.write(this.pendingCommand + "\n");
						this.pendingCommand = null;
					}
				}, 500);
			}

		} catch (error) {
			console.error("[TerminalView] Failed to create session:", error);
			this.xterm?.write(`\x1b[31mFailed to start terminal: ${error}\x1b[0m\r\n`);
		}
	}

	/**
	 * Restart the terminal session
	 */
	async restartSession(): Promise<void> {
		this.killProcess();
		this.sessionId = crypto.randomUUID();
		this.xterm?.clear();
		await this.startSession();
	}

	/**
	 * Kill the current process
	 */
	killProcess(): void {
		if (this.backend) {
			this.plugin.terminalService?.killSession(this.sessionId);
			this.backend = null;
			this.session = null;
		}
	}

	/**
	 * Execute a command in the terminal
	 * Used by "Start Integration" button in settings
	 */
	async executeCommand(command: string): Promise<void> {
		if (this.backend && this.backend.isRunning()) {
			// Terminal already running, send command
			this.backend.write(command + "\n");
		} else {
			// Store command to execute after session starts
			this.pendingCommand = command;

			// If session not started yet, start it
			if (!this.session) {
				await this.startSession();
			}
		}
	}

	/**
	 * Write directly to terminal output
	 */
	write(text: string): void {
		this.xterm?.write(text);
	}

	/**
	 * Focus the terminal
	 */
	focusTerminal(): void {
		this.xterm?.focus();
	}

	/**
	 * Check if terminal is active
	 */
	isActive(): boolean {
		return this.backend?.isRunning() ?? false;
	}

	onunload(): void {
		this.killProcess();
		this.xterm?.dispose();
	}

	async onClose(): Promise<void> {
		this.killProcess();
		this.xterm?.dispose();
	}
}
