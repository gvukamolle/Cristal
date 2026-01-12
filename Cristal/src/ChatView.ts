import { ItemView, WorkspaceLeaf, MarkdownRenderer, setIcon, TFile, Modal, TextComponent } from "obsidian";
import type CristalPlugin from "./main";
import type { ChatMessage, SlashCommand, StreamingEvent, CompleteEvent, ResultEvent, ErrorEvent, AssistantEvent, ClaudeModel, SessionTokenStats, ContextUsage, CompactEvent, ResultMessage, ToolUseEvent, ToolUseBlock, SelectionContext, AIProvider } from "./types";
import { CLAUDE_MODELS, CODEX_MODELS } from "./types";
import { getAvailableCommands, filterCommands, parseCommand, buildCommandPrompt } from "./commands";
import { getButtonLocale, type ButtonLocale } from "./buttonLocales";
import { setCodexReasoningLevel } from "./codexConfig";

export const CRISTAL_VIEW_TYPE = "cristal-cli-llm-chat-view";

export class CristalChatView extends ItemView {
	private plugin: CristalPlugin;
	private messagesContainer: HTMLElement;
	private inputEl: HTMLTextAreaElement;
	private sendButton: HTMLButtonElement;
	private statusEl: HTMLElement;
	private contextIndicatorEl: HTMLElement;
	private messages: ChatMessage[] = [];
	private currentAssistantMessage: HTMLElement | null = null;
	private currentAssistantContent: string = "";
	private isGenerating: boolean = false;
	private activeSessionId: string | null = null;  // ID of currently active session
	private contextDisabled: boolean = false;  // User manually removed context
	private modelIndicatorEl: HTMLElement;
	private currentModel: ClaudeModel | string;
	private currentProvider: AIProvider;
	private providerIndicatorEl: HTMLElement;
	private sessionStarted: boolean = false;  // Track if first message was sent
	private modelAutocompleteVisible: boolean = false;
	private thinkingEnabled: boolean = false;  // Extended thinking mode for Claude
	private codexReasoningEnabled: boolean = false;  // Deep reasoning for Codex (medium/xhigh)
	private difficultyAutocompleteVisible: boolean = false;
	private editingMessageId: string | null = null;

	// Custom session dropdown
	private sessionDropdownContainer: HTMLElement;
	private sessionTriggerEl: HTMLElement;
	private sessionListEl: HTMLElement;
	private isSessionDropdownOpen: boolean = false;

	// Slash command autocomplete
	private autocompleteEl: HTMLElement | null = null;
	private autocompleteVisible: boolean = false;
	private filteredCommands: SlashCommand[] = [];
	private selectedCommandIndex: number = 0;

	// @ mentions
	private mentionedFiles: TFile[] = [];
	private attachedFiles: { name: string; content: string; type: string }[] = [];
	private selectedText: SelectionContext | null = null;
	private lastSelectionContext: SelectionContext | null = null;  // Preserved for response buttons
	private mentionAutocompleteEl: HTMLElement | null = null;
	private mentionAutocompleteVisible: boolean = false;
	private filteredFiles: TFile[] = [];
	private selectedFileIndex: number = 0;
	private mentionStartIndex: number = -1;
	private highlightOverlayEl: HTMLElement | null = null;

	// Context indicator & popup
	private contextIndicatorBtnEl: HTMLElement;
	private contextRingEl: SVGSVGElement;
	private contextPercentEl: HTMLElement;
	private contextPopupEl: HTMLElement;
	private contextPopupInfoEl: HTMLElement;
	private isContextPopupOpen: boolean = false;

	// Context tracking (per session)
	private static readonly CONTEXT_LIMIT = 80000;  // Fixed limit for 100%
	private static readonly AUTO_COMPACT_THRESHOLD = 0.85;  // 85% triggers auto-compact
	private tokenStats: SessionTokenStats = this.initialTokenStats();
	private pendingAutoCompact: boolean = false;

	// Compact feature
	private compactOverlayEl: HTMLElement | null = null;
	private compactSummary: string | null = null;

	// Tool steps display - new architecture
	private currentThinkingBlock: HTMLElement | null = null;  // Current "Thinking..." block with steps
	private currentThinkingSteps: HTMLElement | null = null;  // Steps container inside thinking block
	private hasReceivedText: boolean = false;  // Track if we received any text in current response
	private currentMessageThinkingSteps: ToolUseBlock[] = [];  // Accumulated steps for saving to message history

	// Token tracking for history
	private lastRecordedTokens: number = 0;  // Track previously recorded total tokens

	// Tool grouping state (for consecutive same-type commands) - deprecated, kept for compatibility
	private currentToolGroup: { type: string; tools: ToolUseBlock[]; element: HTMLElement | null } | null = null;

	// Reasoning grouping state (for consecutive thinking blocks)
	private currentReasoningGroup: { tools: ToolUseBlock[]; element: HTMLElement | null } | null = null;

	// Tool steps group (all non-thinking tools in one collapsible container)
	private currentToolStepsGroup: { tools: ToolUseBlock[]; element: HTMLElement | null; contentEl: HTMLElement | null } | null = null;

	// Global expand/collapse state for all reasoning and tool groups
	private reasoningGroupsExpanded: boolean = true;

	private initialTokenStats(): SessionTokenStats {
		return {
			inputTokens: 0,
			outputTokens: 0,
			contextWindow: 200000,
			cacheReadTokens: 0,
			compactCount: 0,
			lastCompactPreTokens: null
		};
	}

	private calculateContextUsage(stats: SessionTokenStats): ContextUsage {
		const effectiveLimit = CristalChatView.CONTEXT_LIMIT;
		const usedTokens = stats.inputTokens + stats.outputTokens;
		const percentage = Math.min((usedTokens / effectiveLimit) * 100, 100);

		return {
			used: usedTokens,
			limit: effectiveLimit,
			nominal: stats.contextWindow,
			percentage: Math.round(percentage)
		};
	}

	constructor(leaf: WorkspaceLeaf, plugin: CristalPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return CRISTAL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return "Cristal";
	}

	getIcon(): string {
		return "message-square";
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("cristal-container");

		// Header with session dropdown and actions
		const header = container.createDiv({ cls: "cristal-header" });

		// Custom session dropdown
		this.sessionDropdownContainer = header.createDiv({ cls: "cristal-session-dropdown-custom" });

		this.sessionTriggerEl = this.sessionDropdownContainer.createDiv({ cls: "cristal-session-trigger" });
		this.sessionTriggerEl.addEventListener("click", () => this.toggleSessionDropdown());

		this.sessionListEl = this.sessionDropdownContainer.createDiv({ cls: "cristal-session-list" });

		// Close dropdown when clicking outside
		document.addEventListener("click", (e) => {
			if (!this.sessionDropdownContainer.contains(e.target as Node)) {
				this.closeSessionDropdown();
			}
		});

		const actions = header.createDiv({ cls: "cristal-actions" });
		const newChatBtn = actions.createEl("button", {
			cls: "cristal-action-btn",
			attr: { "aria-label": "New chat" }
		});
		setIcon(newChatBtn, "plus");
		newChatBtn.addEventListener("click", () => this.startNewChat());

		// Messages area
		this.messagesContainer = container.createDiv({ cls: "cristal-messages" });

		// Status bar
		this.statusEl = container.createDiv({ cls: "cristal-status" });

		// Input area
		const inputArea = container.createDiv({ cls: "cristal-input-area" });

		// Context indicator (shows attached file)
		this.contextIndicatorEl = inputArea.createDiv({ cls: "cristal-context-indicator" });

		// Input wrapper for positioning autocomplete
		const inputWrapper = inputArea.createDiv({ cls: "cristal-input-wrapper" });

		const btnLocale = getButtonLocale(this.plugin.settings.language);
		this.inputEl = inputWrapper.createEl("textarea", {
			cls: "cristal-input",
			attr: {
				placeholder: btnLocale.inputPlaceholder,
				rows: "1"
			}
		});

		// Autocomplete popup for slash commands
		this.autocompleteEl = inputWrapper.createDiv({ cls: "cristal-autocomplete" });

		// Autocomplete popup for @ mentions
		this.mentionAutocompleteEl = inputWrapper.createDiv({ cls: "cristal-mention-autocomplete" });

		const buttonContainer = inputArea.createDiv({ cls: "cristal-button-container" });

		// Left group: provider + model + context indicator
		const leftGroup = buttonContainer.createDiv({ cls: "cristal-button-group" });

		// Get default agent for initial state
		const defaultAgent = this.plugin.getDefaultAgent();

		// Provider indicator
		this.currentProvider = defaultAgent?.cliType === "codex" ? "codex" : "claude";
		this.providerIndicatorEl = leftGroup.createDiv({ cls: "cristal-provider-indicator" });
		this.updateProviderIndicator();
		this.providerIndicatorEl.addEventListener("click", () => {
			this.toggleProvider();
		});

		// Model indicator (replaces dropdown)
		this.currentModel = defaultAgent?.model || "claude-haiku-4-5-20251001";
		this.modelIndicatorEl = leftGroup.createDiv({ cls: "cristal-model-indicator" });
		const modelIcon = this.modelIndicatorEl.createSpan({ cls: "cristal-model-indicator-icon" });
		setIcon(modelIcon, "cpu");
		this.modelIndicatorEl.createSpan({
			cls: "cristal-model-indicator-name",
			text: this.getModelLabel(this.currentModel)
		});
		this.modelIndicatorEl.addEventListener("click", () => {
			this.showModelAutocomplete();
		});

		// Initialize thinking mode from agent settings
		this.thinkingEnabled = defaultAgent?.thinkingEnabled || false;
		// Initialize Codex reasoning mode from agent settings
		this.codexReasoningEnabled = defaultAgent?.reasoningEnabled || false;

		// Context indicator (right after model)
		this.contextIndicatorBtnEl = leftGroup.createDiv({ cls: "cristal-context-indicator-btn" });

		// SVG ring (starts at 0%)
		this.contextRingEl = this.createRingIndicator(0);
		this.contextIndicatorBtnEl.appendChild(this.contextRingEl);

		// Percentage text
		this.contextPercentEl = this.contextIndicatorBtnEl.createSpan({
			cls: "cristal-context-percent",
			text: "0%"
		});

		// Context popup (inside indicator for proper positioning)
		this.contextPopupEl = this.contextIndicatorBtnEl.createDiv({ cls: "cristal-context-popup" });
		this.setupContextPopup();

		// Click handler for popup (after popup is created)
		this.contextIndicatorBtnEl.addEventListener("click", (e) => {
			e.stopPropagation();
			this.toggleContextPopup();
		});

		// Close popup on click outside
		document.addEventListener("click", (e) => {
			if (!this.contextIndicatorBtnEl.contains(e.target as Node)) {
				this.closeContextPopup();
			}
			// Close model autocomplete on click outside (but not if difficulty autocomplete is showing)
			if (!this.difficultyAutocompleteVisible &&
				!this.modelIndicatorEl.contains(e.target as Node) &&
				!this.autocompleteEl?.contains(e.target as Node)) {
				this.hideModelAutocomplete();
			}
		});

		// Right group: attach + send
		const rightGroup = buttonContainer.createDiv({ cls: "cristal-button-group" });

		// Add file attachment button (left of send button)
		const attachBtn = rightGroup.createEl("button", {
			cls: "cristal-attach-btn",
			attr: { "aria-label": "Attach file" }
		});
		setIcon(attachBtn, "plus");

		const fileInput = rightGroup.createEl("input", {
			type: "file",
			cls: "cristal-file-input-hidden",
			attr: {
				accept: ".md,.txt,.json,.yaml,.yml,.js,.ts,.tsx,.jsx,.py,.java,.cpp,.c,.h,.go,.rs,.rb,.php,.html,.css,.xml,.csv,.pdf,.png,.jpg,.jpeg,.gif,.webp,.xlsx,.docx"
			}
		});
		fileInput.style.display = "none";

		attachBtn.addEventListener("click", () => fileInput.click());
		fileInput.addEventListener("change", async (e: Event) => {
			const target = e.target as HTMLInputElement;
			if (target.files && target.files.length > 0 && target.files[0]) {
				await this.handleFileAttachment(target.files[0]);
				target.value = "";
			}
		});

		this.sendButton = rightGroup.createEl("button", {
			cls: "cristal-send-btn",
			attr: { "aria-label": "Send message" }
		});
		setIcon(this.sendButton, "arrow-up");

		// Event handlers
		this.sendButton.addEventListener("click", () => this.handleSendButtonClick());

		// Input event for autocomplete and auto-resize
		this.inputEl.addEventListener("input", () => {
			this.handleInputChange();
			this.autoResizeInput();
		});

		// Keydown for navigation and submission
		this.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
			// Handle mention autocomplete navigation
			if (this.mentionAutocompleteVisible) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					this.selectNextFile();
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					this.selectPrevFile();
					return;
				}
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					this.selectFile(this.selectedFileIndex);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					this.hideMentionAutocomplete();
					return;
				}
				if (e.key === "Tab") {
					e.preventDefault();
					this.selectFile(this.selectedFileIndex);
					return;
				}
			}

			// Handle model autocomplete navigation
			if (this.modelAutocompleteVisible) {
				if (e.key === "Escape") {
					e.preventDefault();
					this.hideModelAutocomplete();
					return;
				}
				// Model selection is handled by click, just close on Escape
			}

			// Handle slash command autocomplete navigation
			if (this.autocompleteVisible) {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					this.selectNextCommand();
					return;
				}
				if (e.key === "ArrowUp") {
					e.preventDefault();
					this.selectPrevCommand();
					return;
				}
				if (e.key === "Enter" && !e.shiftKey) {
					e.preventDefault();
					this.selectCommand(this.selectedCommandIndex);
					return;
				}
				if (e.key === "Escape") {
					e.preventDefault();
					this.hideAutocomplete();
					return;
				}
				if (e.key === "Tab") {
					e.preventDefault();
					this.selectCommand(this.selectedCommandIndex);
					return;
				}
			}

			// Normal send
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				if (!this.isGenerating) {
					this.sendMessage();
				}
			}
		});

		// Setup service event listeners
		this.setupServiceListeners();

		// Update context indicator and note action buttons when active file changes
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				// Reset context disabled flag when switching files
				this.contextDisabled = false;
				this.updateFileContextIndicator();
				this.updateAllNoteActionButtons();
			})
		);

		// Initial context update
		this.updateFileContextIndicator();

		// Load current session or create new one
		this.loadCurrentSession();
	}

	async onClose(): Promise<void> {
		// Cleanup both services
		this.plugin.claudeService.removeAllListeners();
		this.plugin.codexService.removeAllListeners();
	}

	private setupServiceListeners(): void {
		// Subscribe to both services - they emit the same events
		this.attachServiceListeners(this.plugin.claudeService, "claude");
		this.attachServiceListeners(this.plugin.codexService, "codex");
	}

	private attachServiceListeners(service: import("./ClaudeService").ClaudeService | import("./CodexService").CodexService, provider: AIProvider): void {
		// Streaming updates - real-time text as it comes in (UI only for active session)
		service.on("streaming", (event: StreamingEvent) => {
			if (event.sessionId !== this.activeSessionId) return;
			this.updateAssistantMessage(event.text);
			this.setStatus("streaming");
		});

		service.on("assistant", (event: AssistantEvent) => {
			if (event.sessionId !== this.activeSessionId) return;
			// Final assistant message - update with complete text
			const textBlocks = event.message.message.content.filter(b => b.type === "text");
			const text = textBlocks.map(b => (b as { type: "text"; text: string }).text).join("");

			if (text) {
				this.updateAssistantMessage(text);
			}
		});

		// Result event - save to session (for any session, not just active)
		service.on("result", (event: ResultEvent) => {
			const isActiveSession = event.sessionId === this.activeSessionId;

			// Save result to the correct session (even if background)
			const session = this.plugin.sessions.find(s => s.id === event.sessionId);
			if (session) {
				// Use the correct service based on session provider
				const sessionService = this.plugin.getActiveService(session.provider);
				const pending = sessionService.getPendingMessage(event.sessionId);
				if (pending && pending.text) {
					const assistantMessage: ChatMessage = {
						id: crypto.randomUUID(),
						role: "assistant",
						content: pending.text,
						timestamp: Date.now(),
						thinkingSteps: pending.tools.length > 0 ? pending.tools : undefined,
						selectionContext: this.lastSelectionContext || undefined
					};
					session.messages.push(assistantMessage);

					// Update cliSessionId (for Claude) or threadId (for Codex)
					if (provider === "claude") {
						const cliSessionId = this.plugin.claudeService.getCliSessionId(event.sessionId);
						if (cliSessionId) {
							session.cliSessionId = cliSessionId;
						}
					} else {
						const threadId = this.plugin.codexService.getThreadId(event.sessionId);
						if (threadId) {
							session.cliSessionId = threadId;
						}
					}

					this.plugin.saveSettings();
					sessionService.clearPendingMessage(event.sessionId);
				}
			}

			// UI updates only for active session
			if (isActiveSession) {
				this.finalizeAssistantMessage();
				if (event.result.is_error) {
					this.setStatus("error", event.result.result);
				} else {
					this.setStatus("idle");
				}
			}

			// Update dropdown to refresh indicators
			this.updateSessionDropdown();
		});

		service.on("error", (event: ErrorEvent) => {
			if (event.sessionId !== this.activeSessionId) return;
			this.finalizeAssistantMessage();
			this.setStatus("error", event.error);
			this.addErrorMessage(event.error);
		});

		service.on("complete", (event: CompleteEvent) => {
			const isActiveSession = event.sessionId === this.activeSessionId;

			if (isActiveSession) {
				this.finalizeAssistantMessage();
				this.setInputEnabled(true);
				this.resetToolGrouping();  // Reset grouping state for next response

				// Execute pending auto-compact after response is complete (Claude only)
				if (this.pendingAutoCompact && this.currentProvider === "claude") {
					this.pendingAutoCompact = false;
					this.runCompact();
				}
			}

			// Update dropdown to refresh indicators
			this.updateSessionDropdown();
		});

		// Context tracking events - update for any session
		service.on("contextUpdate", (event: { sessionId: string; usage: ResultMessage["usage"] }) => {
			const isActiveSession = event.sessionId === this.activeSessionId;
			const session = this.plugin.sessions.find(s => s.id === event.sessionId);

			if (event.usage && session) {
				// Update session token stats
				if (!session.tokenStats) {
					session.tokenStats = this.initialTokenStats();
				}
				session.tokenStats.inputTokens = event.usage.input_tokens ?? 0;
				session.tokenStats.outputTokens = event.usage.output_tokens ?? 0;
				session.tokenStats.contextWindow = 200000;
				session.tokenStats.cacheReadTokens = event.usage.cache_read_input_tokens ?? 0;

				// Record token delta to history
				const currentTotal = session.tokenStats.inputTokens + session.tokenStats.outputTokens;
				const delta = currentTotal - this.lastRecordedTokens;
				if (isActiveSession && delta > 0) {
					this.plugin.addTokensToHistory(delta);
					this.lastRecordedTokens = currentTotal;
				}

				this.plugin.saveSettings();

				// UI updates only for active session
				if (isActiveSession) {
					this.tokenStats = session.tokenStats;
					this.updateTokenIndicator();

					// Check if we need to trigger auto-compact (Claude only)
					if (this.currentProvider === "claude") {
						const usage = this.calculateContextUsage(this.tokenStats);
						if (usage.percentage >= CristalChatView.AUTO_COMPACT_THRESHOLD * 100 && !this.pendingAutoCompact) {
							this.pendingAutoCompact = true;
						}
					}
				}
			}
		});

		service.on("compact", (event: CompactEvent) => {
			const isActiveSession = event.sessionId === this.activeSessionId;
			const session = this.plugin.sessions.find(s => s.id === event.sessionId);

			if (session) {
				if (!session.tokenStats) {
					session.tokenStats = this.initialTokenStats();
				}
				session.tokenStats.compactCount++;
				session.tokenStats.lastCompactPreTokens = event.preTokens;
				this.plugin.saveSettings();
			}

			if (isActiveSession) {
				this.tokenStats.compactCount++;
				this.tokenStats.lastCompactPreTokens = event.preTokens;
				this.addSystemMessage(`🔄 Context compacted (was ~${this.formatTokens(event.preTokens)})`);
			}
		});

		// Tool use events for agent steps display (UI only for active session)
		service.on("toolUse", (event: ToolUseEvent) => {
			if (event.sessionId !== this.activeSessionId) return;
			this.addToolStep(event.tool);
		});

		// Rate limit error handling (Claude only has this event)
		if (provider === "claude") {
			(service as import("./ClaudeService").ClaudeService).on("rateLimitError", (event: { sessionId: string; resetTime: string | null; message: string }) => {
				if (event.sessionId !== this.activeSessionId) return;
				this.handleRateLimitError(event.resetTime, event.message);
			});
		}
	}

	private createRingIndicator(percentage: number): SVGSVGElement {
		const size = 18;
		const strokeWidth = 2.5;
		const radius = (size - strokeWidth) / 2;
		const circumference = 2 * Math.PI * radius;
		const offset = circumference - (percentage / 100) * circumference;

		// Determine color based on percentage (hardcoded colors for SVG compatibility)
		const color =
			percentage < 50 ? "#22c55e" :   // green
			percentage < 75 ? "#eab308" :   // yellow
			percentage < 95 ? "#f97316" :   // orange
			"#ef4444";                       // red

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("width", String(size));
		svg.setAttribute("height", String(size));
		svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
		svg.classList.add("cristal-usage-ring");

		// Background ring (gray)
		const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		bgCircle.setAttribute("cx", String(size / 2));
		bgCircle.setAttribute("cy", String(size / 2));
		bgCircle.setAttribute("r", String(radius));
		bgCircle.setAttribute("fill", "none");
		bgCircle.setAttribute("stroke", "#4b5563");  // gray for background
		bgCircle.setAttribute("stroke-width", String(strokeWidth));
		svg.appendChild(bgCircle);

		// Progress ring
		const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		progressCircle.setAttribute("cx", String(size / 2));
		progressCircle.setAttribute("cy", String(size / 2));
		progressCircle.setAttribute("r", String(radius));
		progressCircle.setAttribute("fill", "none");
		progressCircle.setAttribute("stroke", color);
		progressCircle.setAttribute("stroke-width", String(strokeWidth));
		progressCircle.setAttribute("stroke-dasharray", String(circumference));
		progressCircle.setAttribute("stroke-dashoffset", String(offset));
		progressCircle.setAttribute("stroke-linecap", "round");
		progressCircle.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
		progressCircle.classList.add("cristal-usage-progress");
		svg.appendChild(progressCircle);

		return svg;
	}

	private updateTokenIndicator(): void {
		const usage = this.calculateContextUsage(this.tokenStats);

		// Update percentage text
		this.contextPercentEl.setText(`${usage.percentage}%`);

		// Recreate ring with new percentage
		const newRing = this.createRingIndicator(usage.percentage);
		this.contextRingEl.replaceWith(newRing);
		this.contextRingEl = newRing;

		// Update popup info if open
		if (this.isContextPopupOpen) {
			this.updateContextPopupInfo();
		}
	}

	// Context popup methods
	private setupContextPopup(): void {
		const locale = getButtonLocale(this.plugin.settings.language);

		// Stop propagation on popup itself to prevent closing when clicking inside
		this.contextPopupEl.addEventListener("click", (e) => {
			e.stopPropagation();
		});

		// Context info section
		this.contextPopupInfoEl = this.contextPopupEl.createDiv({ cls: "cristal-context-popup-info" });

		// Summary button
		const summaryBtn = this.contextPopupEl.createEl("button", {
			cls: "cristal-summary-btn",
			text: locale.summary
		});
		summaryBtn.addEventListener("click", () => this.runCompact());
	}

	private toggleContextPopup(): void {
		if (this.isContextPopupOpen) {
			this.closeContextPopup();
		} else {
			this.openContextPopup();
		}
	}

	private openContextPopup(): void {
		this.isContextPopupOpen = true;
		this.contextPopupEl.addClass("cristal-context-popup-open");
		this.contextIndicatorBtnEl.addClass("cristal-context-indicator-btn-active");
		this.updateContextPopupInfo();
	}

	private closeContextPopup(): void {
		this.isContextPopupOpen = false;
		this.contextPopupEl.removeClass("cristal-context-popup-open");
		this.contextIndicatorBtnEl.removeClass("cristal-context-indicator-btn-active");
	}

	// Provider indicator methods
	private updateProviderIndicator(): void {
		this.providerIndicatorEl.empty();
		const icon = this.providerIndicatorEl.createSpan({ cls: "cristal-provider-indicator-icon" });
		setIcon(icon, this.currentProvider === "claude" ? "sparkles" : "bot");
		this.providerIndicatorEl.createSpan({
			cls: "cristal-provider-indicator-name",
			text: this.currentProvider === "claude" ? "Claude" : "Codex"
		});
	}

	private toggleProvider(): void {
		// Can't switch provider after session started
		if (this.sessionStarted) return;

		this.currentProvider = this.currentProvider === "claude" ? "codex" : "claude";
		this.updateProviderIndicator();

		// Update model to default for new provider (get from agent)
		const agent = this.plugin.getAgentByCliType(this.currentProvider);
		this.currentModel = agent?.model || (this.currentProvider === "claude" ? "claude-haiku-4-5-20251001" : "gpt-5.2-codex");
		// Update thinking/reasoning state from agent
		this.thinkingEnabled = agent?.thinkingEnabled || false;
		this.codexReasoningEnabled = agent?.reasoningEnabled || false;
		this.updateModelIndicatorState();

		// Update placeholder text
		this.inputEl.placeholder = this.currentProvider === "claude"
			? "Ask Claude... (type / for commands)"
			: "Ask Codex... (type / for commands)";
	}

	// Model indicator methods
	private getModelLabel(model: ClaudeModel | string): string {
		// Check Claude models first
		const claudeFound = CLAUDE_MODELS.find(m => m.value === model);
		if (claudeFound) return claudeFound.label;

		// Check Codex models
		const codexFound = CODEX_MODELS.find(m => m.value === model);
		if (codexFound) return codexFound.label;

		return String(model);
	}

	private updateModelIndicatorState(): void {
		const nameEl = this.modelIndicatorEl.querySelector(".cristal-model-indicator-name");
		if (nameEl) {
			nameEl.textContent = this.getModelLabel(this.currentModel);
		}
	}

	private showModelAutocomplete(): void {
		// Toggle: if already visible, hide it
		if (this.modelAutocompleteVisible) {
			this.hideModelAutocomplete();
			return;
		}

		// Hide other autocompletes
		this.hideAutocomplete();
		this.hideMentionAutocomplete();

		// Show model selection in the autocomplete popup
		if (!this.autocompleteEl) return;

		this.autocompleteEl.empty();
		this.modelAutocompleteVisible = true;

		// Model metadata: icons and descriptions for both providers
		const modelMeta: Record<string, { icon: string; desc: string }> = {
			// Claude models
			"claude-haiku-4-5-20251001": { icon: "zap", desc: "Самая быстрая на диком западе" },
			"claude-sonnet-4-5-20250929": { icon: "sun", desc: "Для баланса сил во вселенной" },
			"claude-opus-4-5-20251101": { icon: "crown", desc: "Чтобы забивать кувалдой гвозди" },
			// Codex models
			"gpt-5.2-codex": { icon: "crown", desc: "Latest frontier agentic coding" },
			"gpt-5.1-codex-max": { icon: "sparkles", desc: "Deep and fast reasoning" },
			"gpt-5.1-codex-mini": { icon: "zap", desc: "Cheaper, faster" },
			"gpt-5.2": { icon: "cpu", desc: "Knowledge, reasoning, coding" }
		};

		// Select models based on current provider
		const models = this.currentProvider === "claude" ? CLAUDE_MODELS : CODEX_MODELS;

		for (const model of models) {
			const itemEl = this.autocompleteEl.createDiv({
				cls: `cristal-autocomplete-item${model.value === this.currentModel ? " cristal-autocomplete-item-selected" : ""}`
			});

			const meta = modelMeta[model.value] || { icon: "cpu", desc: model.value };
			const iconEl = itemEl.createDiv({ cls: "cristal-autocomplete-icon" });
			setIcon(iconEl, meta.icon);

			const textEl = itemEl.createDiv({ cls: "cristal-autocomplete-text" });
			textEl.createDiv({ cls: "cristal-autocomplete-name", text: model.label });
			textEl.createDiv({ cls: "cristal-autocomplete-desc", text: meta.desc });

			itemEl.addEventListener("click", () => {
				this.selectModel(model.value);
			});
		}

		// Separator and thinking toggle only for Claude
		if (this.currentProvider === "claude") {
			this.autocompleteEl.createDiv({ cls: "cristal-autocomplete-separator" });

			// Thinking toggle item
			const locale = getButtonLocale(this.plugin.settings.language);
			const thinkingItemEl = this.autocompleteEl.createDiv({
				cls: "cristal-autocomplete-item cristal-thinking-item"
			});

			const thinkingIconEl = thinkingItemEl.createDiv({ cls: "cristal-autocomplete-icon" });
			setIcon(thinkingIconEl, "brain");

			const thinkingTextEl = thinkingItemEl.createDiv({ cls: "cristal-autocomplete-text" });
			thinkingTextEl.createDiv({ cls: "cristal-autocomplete-name", text: locale.thinkingDeeper || "Think deeper" });
			thinkingTextEl.createDiv({ cls: "cristal-autocomplete-desc", text: "Extended thinking mode" });

			// Toggle switch
			const toggleEl = thinkingItemEl.createDiv({ cls: "cristal-thinking-switch" });
			const toggleTrack = toggleEl.createDiv({ cls: "cristal-thinking-switch-track" });
			toggleTrack.createDiv({ cls: "cristal-thinking-switch-thumb" });
			if (this.thinkingEnabled) {
				toggleTrack.addClass("cristal-thinking-switch-on");
			}

			thinkingItemEl.addEventListener("click", (e) => {
				e.stopPropagation();
				this.thinkingEnabled = !this.thinkingEnabled;
				toggleTrack.toggleClass("cristal-thinking-switch-on", this.thinkingEnabled);
			});
		}

		// Separator and deep reasoning toggle for Codex
		if (this.currentProvider === "codex") {
			this.autocompleteEl.createDiv({ cls: "cristal-autocomplete-separator" });

			// Deep reasoning toggle item
			const locale = getButtonLocale(this.plugin.settings.language);
			const reasoningItemEl = this.autocompleteEl.createDiv({
				cls: "cristal-autocomplete-item cristal-thinking-item"
			});

			const reasoningIconEl = reasoningItemEl.createDiv({ cls: "cristal-autocomplete-icon" });
			setIcon(reasoningIconEl, "brain-cog");

			const reasoningTextEl = reasoningItemEl.createDiv({ cls: "cristal-autocomplete-text" });
			reasoningTextEl.createDiv({ cls: "cristal-autocomplete-name", text: locale.deepReasoning || "Deep reasoning" });
			reasoningTextEl.createDiv({ cls: "cristal-autocomplete-desc", text: "Extra High reasoning mode" });

			// Toggle switch
			const toggleEl = reasoningItemEl.createDiv({ cls: "cristal-thinking-switch" });
			const toggleTrack = toggleEl.createDiv({ cls: "cristal-thinking-switch-track" });
			toggleTrack.createDiv({ cls: "cristal-thinking-switch-thumb" });
			if (this.codexReasoningEnabled) {
				toggleTrack.addClass("cristal-thinking-switch-on");
			}

			reasoningItemEl.addEventListener("click", (e) => {
				e.stopPropagation();
				this.codexReasoningEnabled = !this.codexReasoningEnabled;
				toggleTrack.toggleClass("cristal-thinking-switch-on", this.codexReasoningEnabled);
				// Sync to ~/.codex/config.toml
				setCodexReasoningLevel(this.codexReasoningEnabled ? "xhigh" : "medium");
			});
		}

		this.autocompleteEl.addClass("cristal-autocomplete-visible");
	}

	private selectModel(model: ClaudeModel | string): void {
		this.currentModel = model;
		this.updateModelIndicatorState();
		this.hideModelAutocomplete();
		// Не очищаем input - промпт должен сохраняться при смене модели
		this.inputEl.focus();
	}

	private hideModelAutocomplete(): void {
		this.modelAutocompleteVisible = false;
		if (this.autocompleteEl) {
			this.autocompleteEl.removeClass("cristal-autocomplete-visible");
			this.autocompleteEl.empty();
		}
	}

	// Difficulty autocomplete methods
	private showDifficultyAutocomplete(): void {
		// Hide other autocompletes
		this.hideAutocomplete();
		this.hideMentionAutocomplete();
		this.hideModelAutocomplete();

		if (!this.autocompleteEl) return;

		this.autocompleteEl.empty();
		this.difficultyAutocompleteVisible = true;

		const locale = getButtonLocale(this.plugin.settings.language);

		// Difficulty levels with icons and descriptions
		const difficultyLevels = [
			{
				id: "kids",
				icon: "baby",
				name: locale.difficultyKids || "For kids",
				desc: locale.difficultyKidsDesc || "Simple words and fun analogies"
			},
			{
				id: "student",
				icon: "graduation-cap",
				name: locale.difficultyStudent || "For student",
				desc: locale.difficultyStudentDesc || "Clear explanations with examples"
			},
			{
				id: "phd",
				icon: "award",
				name: locale.difficultyPhd || "For expert",
				desc: locale.difficultyPhdDesc || "Professional terminology"
			}
		];

		for (const level of difficultyLevels) {
			const itemEl = this.autocompleteEl.createDiv({
				cls: "cristal-autocomplete-item"
			});

			const iconEl = itemEl.createDiv({ cls: "cristal-autocomplete-icon" });
			setIcon(iconEl, level.icon);

			const textEl = itemEl.createDiv({ cls: "cristal-autocomplete-text" });
			textEl.createDiv({ cls: "cristal-autocomplete-name", text: level.name });
			textEl.createDiv({ cls: "cristal-autocomplete-desc", text: level.desc });

			itemEl.addEventListener("click", () => {
				this.selectDifficulty(level.id);
			});
		}

		this.autocompleteEl.addClass("cristal-autocomplete-visible");
	}

	private selectDifficulty(level: string): void {
		this.hideDifficultyAutocomplete();

		const locale = getButtonLocale(this.plugin.settings.language);

		// Localized prompts for each difficulty level with detailed rules
		const prompts: Record<string, Record<string, string>> = {
			kids: {
				en: "Rewrite this text so a 10-12 year old child would understand it.\n\nRules:\n- Replace complex terms with simple words or short explanations\n- Use everyday analogies (games, school, family)\n- Short sentences, simple grammar\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content",
				ru: "Перепиши текст так, чтобы его понял ребёнок 10-12 лет.\n\nПравила:\n- Заменяй сложные термины на простые слова или короткие объяснения\n- Используй бытовые аналогии и сравнения с понятными вещами (игры, школа, семья)\n- Короткие предложения, простая грамматика\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую",
				fr: "Réécris ce texte pour qu'un enfant de 10-12 ans puisse le comprendre.\n\nRègles:\n- Remplace les termes complexes par des mots simples ou de courtes explications\n- Utilise des analogies du quotidien (jeux, école, famille)\n- Phrases courtes, grammaire simple\n- Garde la longueur originale, tous les sujets et la structure générale\n- N'ajoute pas de nouvelles informations et ne supprime pas le contenu existant",
				de: "Schreibe diesen Text so um, dass ein 10-12-jähriges Kind ihn verstehen würde.\n\nRegeln:\n- Ersetze komplexe Begriffe durch einfache Wörter oder kurze Erklärungen\n- Verwende alltägliche Analogien (Spiele, Schule, Familie)\n- Kurze Sätze, einfache Grammatik\n- Behalte die ursprüngliche Länge, alle Themen und die Gesamtstruktur bei\n- Füge keine neuen Informationen hinzu und entferne keine vorhandenen Inhalte",
				es: "Reescribe este texto para que un niño de 10-12 años lo entienda.\n\nReglas:\n- Reemplaza términos complejos con palabras simples o explicaciones cortas\n- Usa analogías cotidianas (juegos, escuela, familia)\n- Oraciones cortas, gramática simple\n- Mantén la extensión original, todos los temas y la estructura general\n- No agregues información nueva ni elimines contenido existente",
				hi: "इस टेक्स्ट को ऐसे लिखो कि 10-12 साल का बच्चा समझ सके।\n\nनियम:\n- जटिल शब्दों को सरल शब्दों या छोटी व्याख्याओं से बदलो\n- रोजमर्रा की उपमाओं का उपयोग करो (खेल, स्कूल, परिवार)\n- छोटे वाक्य, सरल व्याकरण\n- मूल लंबाई, सभी विषय और समग्र संरचना बनाए रखो\n- नई जानकारी न जोड़ो और मौजूदा सामग्री न हटाओ",
				zh: "重写这段文字，让10-12岁的孩子能够理解。\n\n规则：\n- 用简单的词语或简短的解释替换复杂术语\n- 使用日常类比（游戏、学校、家庭）\n- 短句，简单语法\n- 保持原始长度、所有主题和整体结构\n- 不要添加新信息或删除现有内容",
				ja: "10〜12歳の子供が理解できるようにこのテキストを書き直してください。\n\nルール：\n- 複雑な用語を簡単な言葉や短い説明に置き換える\n- 日常的な例え（ゲーム、学校、家族）を使う\n- 短い文、簡単な文法\n- 元の長さ、すべてのトピック、全体的な構造を維持する\n- 新しい情報を追加したり、既存の内容を削除したりしない"
			},
			student: {
				en: "Rewrite this text at undergraduate student level.\n\nRules:\n- Use standard terminology, but avoid highly specialized jargon\n- Moderately complex constructions and common professional terms are acceptable\n- Analogies can be from textbooks and popular science\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content",
				ru: "Перепиши текст на уровне студента бакалавриата.\n\nПравила:\n- Используй стандартную терминологию, но избегай узкоспециализированного жаргона\n- Допустимы умеренно сложные конструкции и общепринятые профессиональные термины\n- Аналогии могут быть из учебников и популярной науки\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую",
				fr: "Réécris ce texte au niveau d'un étudiant de licence.\n\nRègles:\n- Utilise une terminologie standard, mais évite le jargon très spécialisé\n- Les constructions modérément complexes et les termes professionnels courants sont acceptables\n- Les analogies peuvent provenir de manuels et de vulgarisation scientifique\n- Garde la longueur originale, tous les sujets et la structure générale\n- N'ajoute pas de nouvelles informations et ne supprime pas le contenu existant",
				de: "Schreibe diesen Text auf Bachelor-Studenten-Niveau um.\n\nRegeln:\n- Verwende Standardterminologie, aber vermeide hochspezialisiertes Fachvokabular\n- Mäßig komplexe Konstruktionen und gängige Fachbegriffe sind akzeptabel\n- Analogien können aus Lehrbüchern und populärwissenschaftlichen Quellen stammen\n- Behalte die ursprüngliche Länge, alle Themen und die Gesamtstruktur bei\n- Füge keine neuen Informationen hinzu und entferne keine vorhandenen Inhalte",
				es: "Reescribe este texto a nivel de estudiante universitario.\n\nReglas:\n- Usa terminología estándar, pero evita jerga muy especializada\n- Son aceptables construcciones moderadamente complejas y términos profesionales comunes\n- Las analogías pueden ser de libros de texto y divulgación científica\n- Mantén la extensión original, todos los temas y la estructura general\n- No agregues información nueva ni elimines contenido existente",
				hi: "इस टेक्स्ट को स्नातक छात्र स्तर पर लिखो।\n\nनियम:\n- मानक शब्दावली का उपयोग करो, लेकिन अत्यधिक विशेष शब्दजाल से बचो\n- मध्यम जटिल संरचनाएं और सामान्य पेशेवर शब्द स्वीकार्य हैं\n- उपमाएं पाठ्यपुस्तकों और लोकप्रिय विज्ञान से हो सकती हैं\n- मूल लंबाई, सभी विषय और समग्र संरचना बनाए रखो\n- नई जानकारी न जोड़ो और मौजूदा सामग्री न हटाओ",
				zh: "将这段文字重写为本科生水平。\n\n规则：\n- 使用标准术语，但避免高度专业化的行话\n- 可以使用中等复杂的结构和常见的专业术语\n- 类比可以来自教科书和科普读物\n- 保持原始长度、所有主题和整体结构\n- 不要添加新信息或删除现有内容",
				ja: "このテキストを学部生レベルで書き直してください。\n\nルール：\n- 標準的な用語を使用し、高度に専門的な専門用語は避ける\n- 適度に複雑な構文と一般的な専門用語は許容される\n- 例えは教科書や一般向け科学書から引用可能\n- 元の長さ、すべてのトピック、全体的な構造を維持する\n- 新しい情報を追加したり、既存の内容を削除したりしない"
			},
			phd: {
				en: "Rewrite this text at specialist/researcher level.\n\nRules:\n- Use precise professional terminology without simplification\n- Complex grammatical constructions and academic style are acceptable\n- Analogies can draw from related scientific fields\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content",
				ru: "Перепиши текст на уровне специалиста/исследователя.\n\nПравила:\n- Используй точную профессиональную терминологию без упрощений\n- Допустимы сложные грамматические конструкции и академический стиль\n- Аналогии могут опираться на смежные научные области\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую",
				fr: "Réécris ce texte au niveau spécialiste/chercheur.\n\nRègles:\n- Utilise une terminologie professionnelle précise sans simplification\n- Les constructions grammaticales complexes et le style académique sont acceptables\n- Les analogies peuvent s'appuyer sur des domaines scientifiques connexes\n- Garde la longueur originale, tous les sujets et la structure générale\n- N'ajoute pas de nouvelles informations et ne supprime pas le contenu existant",
				de: "Schreibe diesen Text auf Spezialisten-/Forscherniveau um.\n\nRegeln:\n- Verwende präzise Fachterminologie ohne Vereinfachung\n- Komplexe grammatische Konstruktionen und akademischer Stil sind akzeptabel\n- Analogien können sich auf verwandte Wissenschaftsbereiche stützen\n- Behalte die ursprüngliche Länge, alle Themen und die Gesamtstruktur bei\n- Füge keine neuen Informationen hinzu und entferne keine vorhandenen Inhalte",
				es: "Reescribe este texto a nivel de especialista/investigador.\n\nReglas:\n- Usa terminología profesional precisa sin simplificación\n- Son aceptables construcciones gramaticales complejas y estilo académico\n- Las analogías pueden basarse en campos científicos relacionados\n- Mantén la extensión original, todos los temas y la estructura general\n- No agregues información nueva ni elimines contenido existente",
				hi: "इस टेक्स्ट को विशेषज्ञ/शोधकर्ता स्तर पर लिखो।\n\nनियम:\n- सटीक पेशेवर शब्दावली का उपयोग करो बिना सरलीकरण के\n- जटिल व्याकरणिक संरचनाएं और अकादमिक शैली स्वीकार्य हैं\n- उपमाएं संबंधित वैज्ञानिक क्षेत्रों पर आधारित हो सकती हैं\n- मूल लंबाई, सभी विषय और समग्र संरचना बनाए रखो\n- नई जानकारी न जोड़ो और मौजूदा सामग्री न हटाओ",
				zh: "将这段文字重写为专家/研究人员水平。\n\n规则：\n- 使用精确的专业术语，不做简化\n- 可以使用复杂的语法结构和学术风格\n- 类比可以借鉴相关科学领域\n- 保持原始长度、所有主题和整体结构\n- 不要添加新信息或删除现有内容",
				ja: "このテキストを専門家/研究者レベルで書き直してください。\n\nルール：\n- 簡略化せずに正確な専門用語を使用する\n- 複雑な文法構造とアカデミックなスタイルは許容される\n- 例えは関連する科学分野から引用可能\n- 元の長さ、すべてのトピック、全体的な構造を維持する\n- 新しい情報を追加したり、既存の内容を削除したりしない"
			}
		};

		const lang = this.plugin.settings.language;
		const prompt = prompts[level]?.[lang] || prompts[level]?.en || "";

		this.inputEl.value = prompt;
		this.sendMessage();
	}

	private hideDifficultyAutocomplete(): void {
		this.difficultyAutocompleteVisible = false;
		if (this.autocompleteEl) {
			this.autocompleteEl.removeClass("cristal-autocomplete-visible");
			this.autocompleteEl.empty();
		}
	}

	// Public method for context menu - send with command prompt
	public sendWithCommand(text: string, prompt: string): void {
		const fullMessage = `${prompt}\n\n${text}`;
		this.inputEl.value = fullMessage;
		this.sendMessage();
	}

	// Public method for context menu - send with difficulty level
	public sendWithDifficulty(text: string, level: "kids" | "student" | "phd"): void {
		const lang = this.plugin.settings.language;

		// Localized prompts for each difficulty level with detailed rules
		const prompts: Record<string, Record<string, string>> = {
			kids: {
				en: "Rewrite this text so a 10-12 year old child would understand it.\n\nRules:\n- Replace complex terms with simple words or short explanations\n- Use everyday analogies (games, school, family)\n- Short sentences, simple grammar\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content\n\nText:",
				ru: "Перепиши текст так, чтобы его понял ребёнок 10-12 лет.\n\nПравила:\n- Заменяй сложные термины на простые слова или короткие объяснения\n- Используй бытовые аналогии (игры, школа, семья)\n- Короткие предложения, простая грамматика\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую\n\nТекст:",
				fr: "Réécris ce texte pour qu'un enfant de 10-12 ans puisse le comprendre.\n\nRègles:\n- Remplace les termes complexes par des mots simples\n- Utilise des analogies du quotidien (jeux, école, famille)\n- Phrases courtes, grammaire simple\n- Garde la longueur originale et la structure\n- N'ajoute pas de nouvelles informations\n\nTexte:",
				de: "Schreibe diesen Text so um, dass ein 10-12-jähriges Kind ihn verstehen würde.\n\nRegeln:\n- Ersetze komplexe Begriffe durch einfache Wörter\n- Verwende alltägliche Analogien (Spiele, Schule, Familie)\n- Kurze Sätze, einfache Grammatik\n- Behalte die ursprüngliche Länge und Struktur bei\n- Füge keine neuen Informationen hinzu\n\nText:",
				es: "Reescribe este texto para que un niño de 10-12 años lo entienda.\n\nReglas:\n- Reemplaza términos complejos con palabras simples\n- Usa analogías cotidianas (juegos, escuela, familia)\n- Oraciones cortas, gramática simple\n- Mantén la extensión original y la estructura\n- No agregues información nueva\n\nTexto:",
				hi: "इस टेक्स्ट को ऐसे लिखो कि 10-12 साल का बच्चा समझ सके।\n\nनियम:\n- जटिल शब्दों को सरल शब्दों से बदलो\n- रोजमर्रा की उपमाओं का उपयोग करो\n- छोटे वाक्य, सरल व्याकरण\n- मूल लंबाई और संरचना बनाए रखो\n- नई जानकारी न जोड़ो\n\nटेक्स्ट:",
				zh: "重写这段文字，让10-12岁的孩子能够理解。\n\n规则：\n- 用简单的词语替换复杂术语\n- 使用日常类比（游戏、学校、家庭）\n- 短句，简单语法\n- 保持原始长度和结构\n- 不要添加新信息\n\n文字：",
				ja: "10〜12歳の子供が理解できるように書き直してください。\n\nルール：\n- 複雑な用語を簡単な言葉に置き換える\n- 日常的な例え（ゲーム、学校、家族）を使う\n- 短い文、簡単な文法\n- 元の長さと構造を維持する\n- 新しい情報を追加しない\n\nテキスト："
			},
			student: {
				en: "Rewrite this text at undergraduate student level.\n\nRules:\n- Use standard terminology, avoid highly specialized jargon\n- Moderately complex constructions are acceptable\n- Analogies can be from textbooks and popular science\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content\n\nText:",
				ru: "Перепиши текст на уровне студента бакалавриата.\n\nПравила:\n- Используй стандартную терминологию, избегай узкоспециализированного жаргона\n- Допустимы умеренно сложные конструкции\n- Аналогии могут быть из учебников и популярной науки\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую\n\nТекст:",
				fr: "Réécris ce texte au niveau d'un étudiant de licence.\n\nRègles:\n- Utilise une terminologie standard, évite le jargon spécialisé\n- Les constructions modérément complexes sont acceptables\n- Les analogies peuvent provenir de manuels\n- Garde la longueur originale et la structure\n- N'ajoute pas de nouvelles informations\n\nTexte:",
				de: "Schreibe diesen Text auf Bachelor-Studenten-Niveau um.\n\nRegeln:\n- Verwende Standardterminologie, vermeide Fachvokabular\n- Mäßig komplexe Konstruktionen sind akzeptabel\n- Analogien können aus Lehrbüchern stammen\n- Behalte die ursprüngliche Länge und Struktur bei\n- Füge keine neuen Informationen hinzu\n\nText:",
				es: "Reescribe este texto a nivel de estudiante universitario.\n\nReglas:\n- Usa terminología estándar, evita jerga especializada\n- Son aceptables construcciones moderadamente complejas\n- Las analogías pueden ser de libros de texto\n- Mantén la extensión original y la estructura\n- No agregues información nueva\n\nTexto:",
				hi: "इस टेक्स्ट को स्नातक छात्र स्तर पर लिखो।\n\nनियम:\n- मानक शब्दावली का उपयोग करो, विशेष शब्दजाल से बचो\n- मध्यम जटिल संरचनाएं स्वीकार्य हैं\n- उपमाएं पाठ्यपुस्तकों से हो सकती हैं\n- मूल लंबाई और संरचना बनाए रखो\n- नई जानकारी न जोड़ो\n\nटेक्स्ट:",
				zh: "将这段文字重写为本科生水平。\n\n规则：\n- 使用标准术语，避免专业行话\n- 可以使用中等复杂的结构\n- 类比可以来自教科书\n- 保持原始长度和结构\n- 不要添加新信息\n\n文字：",
				ja: "このテキストを学部生レベルで書き直してください。\n\nルール：\n- 標準的な用語を使用し、専門用語は避ける\n- 適度に複雑な構文は許容される\n- 例えは教科書から引用可能\n- 元の長さと構造を維持する\n- 新しい情報を追加しない\n\nテキスト："
			},
			phd: {
				en: "Rewrite this text at specialist/researcher level.\n\nRules:\n- Use precise professional terminology without simplification\n- Complex grammatical constructions and academic style are acceptable\n- Analogies can draw from related scientific fields\n- Keep the original length, all topics, and overall structure\n- Do not add new information or remove existing content\n\nText:",
				ru: "Перепиши текст на уровне специалиста/исследователя.\n\nПравила:\n- Используй точную профессиональную терминологию без упрощений\n- Допустимы сложные грамматические конструкции и академический стиль\n- Аналогии могут опираться на смежные научные области\n- Сохраняй исходный объём, все темы и общую структуру\n- Не добавляй новую информацию и не удаляй существующую\n\nТекст:",
				fr: "Réécris ce texte au niveau spécialiste/chercheur.\n\nRègles:\n- Utilise une terminologie précise sans simplification\n- Les constructions complexes et le style académique sont acceptables\n- Les analogies peuvent s'appuyer sur des domaines connexes\n- Garde la longueur originale et la structure\n- N'ajoute pas de nouvelles informations\n\nTexte:",
				de: "Schreibe diesen Text auf Spezialisten-/Forscherniveau um.\n\nRegeln:\n- Verwende präzise Fachterminologie ohne Vereinfachung\n- Komplexe Konstruktionen und akademischer Stil sind akzeptabel\n- Analogien können sich auf verwandte Bereiche stützen\n- Behalte die ursprüngliche Länge und Struktur bei\n- Füge keine neuen Informationen hinzu\n\nText:",
				es: "Reescribe este texto a nivel de especialista/investigador.\n\nReglas:\n- Usa terminología precisa sin simplificación\n- Son aceptables construcciones complejas y estilo académico\n- Las analogías pueden basarse en campos relacionados\n- Mantén la extensión original y la estructura\n- No agregues información nueva\n\nTexto:",
				hi: "इस टेक्स्ट को विशेषज्ञ/शोधकर्ता स्तर पर लिखो।\n\nनियम:\n- सटीक पेशेवर शब्दावली का उपयोग करो बिना सरलीकरण के\n- जटिल संरचनाएं और अकादमिक शैली स्वीकार्य हैं\n- उपमाएं संबंधित क्षेत्रों से हो सकती हैं\n- मूल लंबाई और संरचना बनाए रखो\n- नई जानकारी न जोड़ो\n\nटेक्स्ट:",
				zh: "将这段文字重写为专家/研究人员水平。\n\n规则：\n- 使用精确的专业术语，不做简化\n- 可以使用复杂的结构和学术风格\n- 类比可以借鉴相关领域\n- 保持原始长度和结构\n- 不要添加新信息\n\n文字：",
				ja: "このテキストを専門家/研究者レベルで書き直してください。\n\nルール：\n- 簡略化せずに正確な専門用語を使用する\n- 複雑な構造とアカデミックなスタイルは許容される\n- 例えは関連分野から引用可能\n- 元の長さと構造を維持する\n- 新しい情報を追加しない\n\nテキスト："
			}
		};

		const prompt = prompts[level]?.[lang] || prompts[level]?.en || "";
		const fullMessage = `${prompt}\n\n${text}`;

		this.inputEl.value = fullMessage;
		this.sendMessage();
	}

	private updateContextPopupInfo(): void {
		const locale = getButtonLocale(this.plugin.settings.language);
		const usage = this.calculateContextUsage(this.tokenStats);

		this.contextPopupInfoEl.empty();

		// Main usage line
		this.contextPopupInfoEl.createDiv({
			cls: "cristal-context-row cristal-context-row-main",
			text: `${this.formatTokens(usage.used)} / ${this.formatTokens(usage.limit)}`
		});

		// Details
		this.contextPopupInfoEl.createDiv({
			cls: "cristal-context-row",
			text: `${locale.inputTokens || "Input"}: ${this.formatTokens(this.tokenStats.inputTokens)}`
		});
		this.contextPopupInfoEl.createDiv({
			cls: "cristal-context-row",
			text: `${locale.outputTokens || "Output"}: ${this.formatTokens(this.tokenStats.outputTokens)}`
		});

		if (this.tokenStats.cacheReadTokens > 0) {
			this.contextPopupInfoEl.createDiv({
				cls: "cristal-context-row",
				text: `${locale.cacheTokens || "Cache"}: ${this.formatTokens(this.tokenStats.cacheReadTokens)}`
			});
		}

		// Info about context limit and auto-compact
		this.contextPopupInfoEl.createDiv({
			cls: "cristal-context-row cristal-context-row-info",
			text: `${locale.contextLimit || "Limit"}: ${this.formatTokens(CristalChatView.CONTEXT_LIMIT)}`
		});
		this.contextPopupInfoEl.createDiv({
			cls: "cristal-context-row cristal-context-row-info",
			text: `${locale.autoCompactAt || "Auto-compact at"} 85%`
		});

		if (this.tokenStats.compactCount > 0) {
			this.contextPopupInfoEl.createDiv({
				cls: "cristal-context-row cristal-context-row-info",
				text: `${locale.compactions || "Compactions"}: ${this.tokenStats.compactCount}`
			});
		}
	}

	private formatTokens(n: number): string {
		if (n === undefined || n === null || isNaN(n)) return "0";
		if (n < 1000) return `${n}`;
		if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
		return `${Math.round(n / 1000)}k`;
	}

	// Compact feature methods
	private async runCompact(): Promise<void> {
		// Close popup
		this.closeContextPopup();

		// Check if there are messages to summarize
		if (this.messages.length === 0) {
			return;
		}

		// Show animation
		this.showCompactAnimation();

		try {
			// 1. Collect current messages for summary
			const messagesToSummarize = this.messages.map(m =>
				`${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
			).join("\n\n");

			// 2. Request summary from Claude
			const summaryPrompt = `Please provide a concise summary of this conversation that captures the key context, decisions made, and current state. This summary will be used to continue the conversation in a new session.

Conversation:
${messagesToSummarize}

Provide only the summary, no additional commentary.`;

			// Create temporary sessionId for summary request
			const summarySessionId = `summary-${crypto.randomUUID()}`;
			let summary = "";

			// Subscribe to streaming
			const onStreaming = (event: StreamingEvent) => {
				if (event.sessionId === summarySessionId) {
					summary += event.text;
				}
			};

			const onComplete = (event: CompleteEvent) => {
				if (event.sessionId === summarySessionId) {
					// Remove listeners
					this.plugin.claudeService.off("streaming", onStreaming);
					// Finish compact process
					this.finishCompact(summary);
				}
			};

			this.plugin.claudeService.on("streaming", onStreaming);
			this.plugin.claudeService.on("complete", onComplete);

			// Send summary request (new session, no resume)
			await this.plugin.claudeService.sendMessage(
				summaryPrompt,
				summarySessionId,
				undefined, // New session
				this.currentModel
			);

		} catch (error) {
			console.error("Compact error:", error);
			this.hideCompactAnimation();
		}
	}

	private finishCompact(summary: string): void {
		// Hide animation
		this.hideCompactAnimation();

		// Keep visual messages but reset CLI session
		const currentSession = this.plugin.getCurrentSession();
		if (currentSession) {
			// Reset CLI session ID - next message will start new session
			currentSession.cliSessionId = null;
			this.plugin.claudeService.clearSession(currentSession.id);

			// Save summary for next message
			this.compactSummary = summary;

			// Unlock model selector
			this.sessionStarted = false;
			this.updateModelIndicatorState();

			this.plugin.saveSettings();
		}

		// Reset token stats (keep compactCount incremented)
		const prevCompactCount = this.tokenStats.compactCount + 1;
		this.tokenStats = this.initialTokenStats();
		this.tokenStats.compactCount = prevCompactCount;
		this.updateTokenIndicator();

		// Add system message about compact
		this.addSystemMessage("--- Context compacted ---");
	}

	private showCompactAnimation(): void {
		const locale = getButtonLocale(this.plugin.settings.language);

		this.compactOverlayEl = this.messagesContainer.createDiv({
			cls: "cristal-compact-overlay"
		});

		this.compactOverlayEl.createDiv({ cls: "cristal-compact-spinner" });
		this.compactOverlayEl.createDiv({
			cls: "cristal-compact-text",
			text: locale.creatingSummary
		});

		// Disable input
		this.setInputEnabled(false);
	}

	private hideCompactAnimation(): void {
		if (this.compactOverlayEl) {
			this.compactOverlayEl.remove();
			this.compactOverlayEl = null;
		}
		this.setInputEnabled(true);
	}

	private addSystemMessage(text: string): void {
		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-system"
		});
		msgEl.createDiv({ cls: "cristal-message-content", text });
		this.scrollToBottom();
	}

	private handleSendButtonClick(): void {
		if (this.isGenerating) {
			// Stop generation for current session on the active service
			const currentSession = this.plugin.getCurrentSession();
			if (currentSession) {
				const service = this.plugin.getActiveService(this.currentProvider);
				service.abort(currentSession.id);
			}
		} else {
			this.sendMessage();
		}
	}

	// Session management
	private loadCurrentSession(): void {
		let session = this.plugin.getCurrentSession();
		if (!session) {
			session = this.plugin.createNewSession();
		}
		this.loadSession(session);
		this.updateSessionDropdown();
	}

	private loadSession(session: import("./types").ChatSession): void {
		// Set active session ID for event filtering
		this.activeSessionId = session.id;

		this.messages = [...session.messages];
		this.messagesContainer.empty();

		// Load token stats from session (or reset if not available)
		this.tokenStats = session.tokenStats || this.initialTokenStats();
		// Initialize lastRecordedTokens to avoid double-counting on session reload
		this.lastRecordedTokens = this.tokenStats.inputTokens + this.tokenStats.outputTokens;
		this.updateTokenIndicator();

		if (this.messages.length === 0) {
			this.showWelcome();
		} else {
			// Render existing messages
			for (const msg of this.messages) {
				if (msg.role === "user") {
					this.renderUserMessage(msg.content, msg.id);
				} else {
					this.renderAssistantMessage(msg.content, msg.id, msg.thinkingSteps, msg.selectionContext);
				}
			}
		}

		// Restore model state
		this.sessionStarted = session.messages.length > 0;
		if (session.model) {
			this.currentModel = session.model;
		} else {
			// Get model from default agent
			const defaultAgent = this.plugin.getDefaultAgent();
			this.currentModel = defaultAgent?.model || "claude-haiku-4-5-20251001";
		}
		this.updateModelIndicatorState();

		this.setStatus("idle");
	}

	private renderUserMessage(content: string, id: string): void {
		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-user"
		});
		msgEl.dataset.id = id;
		const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
		contentEl.setText(content);
	}

	private renderAssistantMessage(content: string, id: string, thinkingSteps?: ToolUseBlock[], selectionContext?: SelectionContext): void {
		// Render thinking block if we have saved steps
		if (thinkingSteps && thinkingSteps.length > 0) {
			this.renderThinkingBlock(thinkingSteps);
		}

		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-assistant"
		});
		msgEl.dataset.id = id;
		const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
		MarkdownRenderer.render(this.app, content, contentEl, "", this);
		this.removeEditableAttributes(contentEl);
		this.addCopyButton(msgEl, content, selectionContext);
	}

	private renderThinkingBlock(steps: ToolUseBlock[]): void {
		const locale = getButtonLocale(this.plugin.settings.language);

		const thinkingBlock = this.messagesContainer.createDiv({
			cls: "cristal-thinking-block cristal-thinking-done"
		});

		const header = thinkingBlock.createDiv({ cls: "cristal-thinking-header" });
		const iconEl = header.createSpan({ cls: "cristal-thinking-icon" });
		setIcon(iconEl, "brain");
		header.createSpan({ cls: "cristal-thinking-text", text: locale.thinking });

		const stepsContainer = thinkingBlock.createDiv({ cls: "cristal-thinking-steps" });

		// Separate thinking steps from tool steps
		const thinkingSteps = steps.filter(t => t.name === "thinking");
		const toolSteps = steps.filter(t => t.name !== "thinking");

		// Determine if this was a Codex session (has reasoning blocks)
		const isCodexSession = thinkingSteps.length > 0;

		// Render Codex reasoning steps in collapsible group
		if (thinkingSteps.length > 0) {
			this.renderHistoricReasoningGroup(stepsContainer, thinkingSteps, locale);
		}

		// Render tool steps:
		// - Codex: simple list (original behavior)
		// - Claude: collapsible group
		if (toolSteps.length > 0) {
			if (isCodexSession) {
				// Codex: simple tool steps list
				this.renderHistoricToolStepsSimple(stepsContainer, toolSteps, locale);
			} else {
				// Claude: collapsible group
				this.renderHistoricToolStepsGroup(stepsContainer, toolSteps, locale);
			}
		}
	}

	/**
	 * Renders a collapsible reasoning group for historic messages
	 */
	private renderHistoricReasoningGroup(container: HTMLElement, steps: ToolUseBlock[], locale: ButtonLocale): void {
		const groupEl = container.createDiv({ cls: "cristal-reasoning-group" });

		// Header
		const headerEl = groupEl.createDiv({ cls: "cristal-reasoning-group-header" });
		const iconEl = headerEl.createSpan({ cls: "cristal-reasoning-icon" });
		setIcon(iconEl, "brain");

		const titleEl = headerEl.createSpan({ cls: "cristal-reasoning-group-title" });
		titleEl.setText(locale.thinking || "Думает...");

		if (steps.length > 1) {
			const counterEl = headerEl.createSpan({ cls: "cristal-reasoning-group-counter" });
			counterEl.setText(`(${steps.length})`);
		}

		const expandEl = headerEl.createSpan({ cls: "cristal-reasoning-group-expand" });

		// Content
		const contentEl = groupEl.createDiv({ cls: "cristal-reasoning-group-content" });

		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			if (!step) continue;
			if (i > 0) {
				contentEl.createEl("br");
				contentEl.createEl("br");
			}
			this.renderReasoningStep(contentEl, step, locale);
		}

		// Click handler for expand/collapse
		headerEl.addEventListener("click", () => {
			const isExpanded = contentEl.style.display !== "none";
			this.reasoningGroupsExpanded = !isExpanded;

			if (this.reasoningGroupsExpanded) {
				this.expandAllReasoningGroups();
			} else {
				this.collapseAllReasoningGroups();
			}
		});

		// Apply global state
		if (this.reasoningGroupsExpanded) {
			groupEl.addClass("expanded");
			contentEl.style.display = "block";
			setIcon(expandEl, "chevron-up");
		} else {
			contentEl.style.display = "none";
			setIcon(expandEl, "chevron-down");
		}
	}

	/**
	 * Renders a collapsible tool steps group for historic messages
	 */
	private renderHistoricToolStepsGroup(container: HTMLElement, steps: ToolUseBlock[], locale: ButtonLocale): void {
		const groupEl = container.createDiv({ cls: "cristal-reasoning-group cristal-tool-steps-group" });

		// Header
		const headerEl = groupEl.createDiv({ cls: "cristal-reasoning-group-header" });
		const iconEl = headerEl.createSpan({ cls: "cristal-reasoning-icon" });
		setIcon(iconEl, "brain");

		const titleEl = headerEl.createSpan({ cls: "cristal-reasoning-group-title" });
		titleEl.setText(locale.thinking || "Думает...");

		if (steps.length > 1) {
			const counterEl = headerEl.createSpan({ cls: "cristal-reasoning-group-counter" });
			counterEl.setText(`(${steps.length})`);
		}

		const expandEl = headerEl.createSpan({ cls: "cristal-reasoning-group-expand" });

		// Content
		const contentEl = groupEl.createDiv({ cls: "cristal-reasoning-group-content cristal-tool-steps-content" });

		for (const tool of steps) {
			const stepEl = contentEl.createDiv({ cls: "cristal-tool-step-item" });
			const stepIconEl = stepEl.createSpan({ cls: "cristal-tool-step-icon" });
			setIcon(stepIconEl, this.getToolIcon(tool.name));
			const textEl = stepEl.createSpan({ cls: "cristal-tool-step-text" });
			textEl.setText(this.formatToolStep(tool, locale));
		}

		// Click handler for expand/collapse
		headerEl.addEventListener("click", () => {
			const isExpanded = contentEl.style.display !== "none";
			this.reasoningGroupsExpanded = !isExpanded;

			if (this.reasoningGroupsExpanded) {
				this.expandAllReasoningGroups();
			} else {
				this.collapseAllReasoningGroups();
			}
		});

		// Apply global state
		if (this.reasoningGroupsExpanded) {
			groupEl.addClass("expanded");
			contentEl.style.display = "block";
			setIcon(expandEl, "chevron-up");
		} else {
			contentEl.style.display = "none";
			setIcon(expandEl, "chevron-down");
		}
	}

	/**
	 * Renders tool steps as simple list for Codex (original behavior)
	 */
	private renderHistoricToolStepsSimple(container: HTMLElement, steps: ToolUseBlock[], locale: ButtonLocale): void {
		for (const tool of steps) {
			const stepEl = container.createDiv({ cls: "cristal-tool-step" });
			const stepIconEl = stepEl.createSpan({ cls: "cristal-tool-step-icon" });
			setIcon(stepIconEl, this.getToolIcon(tool.name));
			const textEl = stepEl.createSpan({ cls: "cristal-tool-step-text" });
			textEl.setText(this.formatToolStep(tool, locale));
		}
	}

	/**
	 * Parse reasoning text from JSON or string format
	 */
	private parseReasoningText(input: unknown): string {
		if (typeof input === "string") {
			return input;
		}
		if (typeof input === "object" && input !== null) {
			const obj = input as Record<string, unknown>;
			// Try to extract "text" field from JSON
			if (typeof obj.text === "string") {
				return obj.text;
			}
			// Fallback: stringify JSON nicely
			return JSON.stringify(input, null, 2);
		}
		return String(input || "");
	}

	/**
	 * Extract title and body from reasoning text
	 * Title is usually wrapped in **asterisks** on the first line
	 */
	private parseReasoningTitle(text: string): { title: string; body: string } {
		const lines = text.split("\n");
		const firstLine = lines[0] || "";

		// Extract title from **Title** format
		const titleMatch = firstLine.match(/^\*\*(.+?)\*\*$/);
		if (titleMatch && titleMatch[1]) {
			return {
				title: titleMatch[1],
				body: lines.slice(1).join("\n").trim()
			};
		}

		// No markdown title — use first line as title
		return {
			title: firstLine.substring(0, 60) + (firstLine.length > 60 ? "..." : ""),
			body: lines.slice(1).join("\n").trim()
		};
	}

	/**
	 * Renders a Codex reasoning step - simple text with **bold** support
	 */
	private renderReasoningStep(container: HTMLElement, tool: ToolUseBlock, _locale: ButtonLocale): void {
		const input = tool.input as { text?: unknown; summary?: string[]; content?: string[] };

		// Parse the text from JSON if needed
		const rawText = this.parseReasoningText(input.text);

		// Create text block (no separate header/body, just text)
		const textEl = container.createDiv({ cls: "cristal-reasoning-text" });

		// Render text with **bold** support
		this.renderMarkdownBold(textEl, rawText);
	}

	/**
	 * Renders text with **bold** markdown support
	 */
	private renderMarkdownBold(container: HTMLElement, text: string): void {
		// Split by **bold** patterns
		const parts = text.split(/(\*\*[^*]+\*\*)/g);

		for (const part of parts) {
			if (part.startsWith("**") && part.endsWith("**")) {
				// Bold text
				const boldText = part.slice(2, -2);
				container.createEl("strong", { text: boldText });
			} else if (part) {
				// Regular text - preserve newlines
				const lines = part.split("\n");
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					if (line) {
						container.appendText(line);
					}
					if (i < lines.length - 1) {
						container.createEl("br");
					}
				}
			}
		}
	}

	private updateSessionDropdown(): void {
		const sessions = this.plugin.sessions;
		const currentId = this.plugin.currentSessionId;

		// Update trigger text
		const currentSession = sessions.find(s => s.id === currentId);
		this.sessionTriggerEl.empty();

		// Show spinner if current session is running (check both services)
		const isCurrentRunning = currentSession && (
			this.plugin.claudeService.isRunning(currentSession.id) ||
			this.plugin.codexService.isRunning(currentSession.id)
		);
		if (isCurrentRunning) {
			const spinnerEl = this.sessionTriggerEl.createSpan({ cls: "cristal-session-spinner" });
			setIcon(spinnerEl, "loader-2");
		}

		const triggerText = this.sessionTriggerEl.createSpan({ cls: "cristal-session-trigger-text" });
		triggerText.setText(currentSession ? this.getSessionLabel(currentSession) : "Select chat");
		const triggerIcon = this.sessionTriggerEl.createSpan({ cls: "cristal-session-trigger-icon" });
		setIcon(triggerIcon, "chevron-down");

		// Update list
		this.sessionListEl.empty();
		for (const session of sessions) {
			// Check both services for running state
			const isRunning = this.plugin.claudeService.isRunning(session.id) ||
				this.plugin.codexService.isRunning(session.id);
			const item = this.sessionListEl.createDiv({
				cls: `cristal-session-item ${session.id === currentId ? "cristal-session-item-active" : ""} ${isRunning ? "cristal-session-item-running" : ""}`
			});
			item.dataset.id = session.id;

			// Show spinner for running sessions
			if (isRunning) {
				const spinnerEl = item.createSpan({ cls: "cristal-session-spinner" });
				setIcon(spinnerEl, "loader-2");
			}

			const titleEl = item.createSpan({ cls: "cristal-session-title" });
			titleEl.setText(this.getSessionLabel(session));

			const deleteBtn = item.createEl("button", {
				cls: "cristal-session-delete",
				attr: { "aria-label": "Delete session" }
			});
			setIcon(deleteBtn, "x");

			// Click on title to select session
			titleEl.addEventListener("click", (e) => {
				e.stopPropagation();
				this.selectSession(session.id);
			});

			// Click on delete to remove session
			deleteBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				this.deleteSessionWithConfirm(session.id);
			});
		}
	}

	private getSessionLabel(session: import("./types").ChatSession): string {
		if (session.title) {
			return session.title;
		}
		const date = new Date(session.createdAt);
		return `New chat - ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
	}

	private toggleSessionDropdown(): void {
		this.isSessionDropdownOpen = !this.isSessionDropdownOpen;
		if (this.isSessionDropdownOpen) {
			this.sessionListEl.addClass("cristal-session-list-open");
			this.sessionTriggerEl.addClass("cristal-session-trigger-open");
		} else {
			this.closeSessionDropdown();
		}
	}

	private closeSessionDropdown(): void {
		this.isSessionDropdownOpen = false;
		this.sessionListEl.removeClass("cristal-session-list-open");
		this.sessionTriggerEl.removeClass("cristal-session-trigger-open");
	}

	private selectSession(sessionId: string): void {
		const session = this.plugin.switchToSession(sessionId);
		if (session) {
			this.loadSession(session);
			this.updateSessionDropdown();
		}
		this.closeSessionDropdown();
	}

	private deleteSessionWithConfirm(sessionId: string): void {
		// If only one session, don't delete
		if (this.plugin.sessions.length <= 1) {
			return;
		}

		this.plugin.deleteSession(sessionId);
		this.updateSessionDropdown();

		// If deleted current session, load the new current one
		const currentSession = this.plugin.getCurrentSession();
		if (currentSession) {
			this.loadSession(currentSession);
		}
	}

	private startNewChat(): void {
		const session = this.plugin.createNewSession();
		// Reset token stats for new session
		this.tokenStats = this.initialTokenStats();
		this.updateTokenIndicator();
		this.loadSession(session);
		this.updateSessionDropdown();
		this.inputEl.focus();
	}

	private saveCurrentSession(): void {
		const currentSession = this.plugin.getCurrentSession();
		const cliSessionId = currentSession
			? this.plugin.claudeService.getCliSessionId(currentSession.id)
			: null;
		this.plugin.updateCurrentSession(
			this.messages,
			cliSessionId,
			this.tokenStats
		);
		this.updateSessionDropdown();
	}

	private updateFileContextIndicator(): void {
		this.contextIndicatorEl.empty();
		let hasContent = false;

		// 1. Selected text from editor (highest priority, icon: text-cursor)
		if (this.selectedText) {
			const label = this.selectedText.content.length > 30
				? this.selectedText.content.slice(0, 30) + "..."
				: this.selectedText.content;
			this.addContextChip("text-cursor", label, () => {
				this.selectedText = null;
				this.updateFileContextIndicator();
			});
			hasContent = true;
		}

		// 2. Mentioned pages via @ (icon: at-sign)
		for (const mention of this.mentionedFiles) {
			this.addContextChip("at-sign", mention.basename, () => {
				this.mentionedFiles = this.mentionedFiles.filter(f => f.path !== mention.path);
				this.updateFileContextIndicator();
			});
			hasContent = true;
		}

		// 3. Attached files (icon: file)
		for (const file of this.attachedFiles) {
			this.addContextChip("file", this.getFileBasename(file.name), () => {
				this.removeAttachedFile(file.name);
			});
			hasContent = true;
		}

		// Show/hide container
		if (hasContent) {
			this.contextIndicatorEl.addClass("cristal-context-active");
		} else {
			this.contextIndicatorEl.removeClass("cristal-context-active");
		}
	}

	private addContextChip(icon: string, label: string, onRemove: () => void): void {
		const chip = this.contextIndicatorEl.createDiv({ cls: "cristal-context-chip" });

		const iconEl = chip.createSpan({ cls: "cristal-context-icon" });
		setIcon(iconEl, icon);

		chip.createSpan({ cls: "cristal-context-name", text: label });

		const removeBtn = chip.createEl("button", {
			cls: "cristal-context-remove",
			attr: { "aria-label": "Remove" }
		});
		setIcon(removeBtn, "x");
		removeBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			onRemove();
		});
	}

	// Public method to add selected text from context menu with position info
	public addSelectedText(
		text: string,
		source: string,
		position?: {
			filePath: string;
			startLine: number;
			startCh: number;
			endLine: number;
			endCh: number;
		}
	): void {
		this.selectedText = {
			content: text,
			source,
			filePath: position?.filePath || "",
			startLine: position?.startLine || 0,
			startCh: position?.startCh || 0,
			endLine: position?.endLine || 0,
			endCh: position?.endCh || 0
		};
		this.updateFileContextIndicator();
	}

	private async getActiveFileContext(): Promise<{ name: string; content: string } | null> {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== "md") {
			return null;
		}

		try {
			const content = await this.app.vault.read(activeFile);
			return { name: activeFile.basename, content };
		} catch {
			return null;
		}
	}

	// Get localized instruction for selected text mode
	private getSelectionInstruction(): string {
		const lang = this.plugin.settings.language;

		const instructions: Record<string, string> = {
			en: "IMPORTANT: You are working with a SELECTED TEXT FRAGMENT only.\n" +
				"Rules:\n" +
				"- Work ONLY with the text between [Selected text] and [END OF SELECTED TEXT]\n" +
				"- Your response must contain ONLY the processed/modified text\n" +
				"- Do NOT add introductions, explanations, or conclusions outside the text\n" +
				"- Do NOT expand beyond the boundaries of the selected fragment\n" +
				"- Preserve the approximate length of the original text\n" +
				"- Return ONLY the result that can directly replace the selected text",

			ru: "ВАЖНО: Ты работаешь ТОЛЬКО с ВЫДЕЛЕННЫМ ФРАГМЕНТОМ текста.\n" +
				"Правила:\n" +
				"- Работай ТОЛЬКО с текстом между [Selected text] и [END OF SELECTED TEXT]\n" +
				"- Твой ответ должен содержать ТОЛЬКО обработанный/изменённый текст\n" +
				"- НЕ добавляй вступления, пояснения или заключения вне текста\n" +
				"- НЕ выходи за границы выделенного фрагмента\n" +
				"- Сохраняй примерный объём исходного текста\n" +
				"- Верни ТОЛЬКО результат, который можно напрямую заменить на место выделенного текста",

			fr: "IMPORTANT: Vous travaillez UNIQUEMENT avec un FRAGMENT DE TEXTE SÉLECTIONNÉ.\n" +
				"Règles:\n" +
				"- Travaillez UNIQUEMENT avec le texte entre [Selected text] et [END OF SELECTED TEXT]\n" +
				"- Votre réponse doit contenir UNIQUEMENT le texte traité/modifié\n" +
				"- N'ajoutez PAS d'introductions, d'explications ou de conclusions en dehors du texte\n" +
				"- Ne dépassez PAS les limites du fragment sélectionné\n" +
				"- Préservez la longueur approximative du texte original\n" +
				"- Retournez UNIQUEMENT le résultat qui peut remplacer directement le texte sélectionné",

			de: "WICHTIG: Sie arbeiten NUR mit einem AUSGEWÄHLTEN TEXTFRAGMENT.\n" +
				"Regeln:\n" +
				"- Arbeiten Sie NUR mit dem Text zwischen [Selected text] und [END OF SELECTED TEXT]\n" +
				"- Ihre Antwort muss NUR den verarbeiteten/geänderten Text enthalten\n" +
				"- Fügen Sie KEINE Einleitungen, Erklärungen oder Schlussfolgerungen außerhalb des Textes hinzu\n" +
				"- Überschreiten Sie NICHT die Grenzen des ausgewählten Fragments\n" +
				"- Behalten Sie die ungefähre Länge des Originaltextes bei\n" +
				"- Geben Sie NUR das Ergebnis zurück, das den ausgewählten Text direkt ersetzen kann",

			es: "IMPORTANTE: Estás trabajando SOLO con un FRAGMENTO DE TEXTO SELECCIONADO.\n" +
				"Reglas:\n" +
				"- Trabaja SOLO con el texto entre [Selected text] y [END OF SELECTED TEXT]\n" +
				"- Tu respuesta debe contener SOLO el texto procesado/modificado\n" +
				"- NO agregues introducciones, explicaciones o conclusiones fuera del texto\n" +
				"- NO te extiendas más allá de los límites del fragmento seleccionado\n" +
				"- Preserva la longitud aproximada del texto original\n" +
				"- Devuelve SOLO el resultado que puede reemplazar directamente el texto seleccionado",

			hi: "महत्वपूर्ण: आप केवल एक चयनित टेक्स्ट फ्रैगमेंट के साथ काम कर रहे हैं।\n" +
				"नियम:\n" +
				"- केवल [Selected text] और [END OF SELECTED TEXT] के बीच के टेक्स्ट के साथ काम करें\n" +
				"- आपके उत्तर में केवल संसाधित/संशोधित टेक्स्ट होना चाहिए\n" +
				"- टेक्स्ट के बाहर परिचय, स्पष्टीकरण या निष्कर्ष न जोड़ें\n" +
				"- चयनित फ्रैगमेंट की सीमाओं से बाहर न जाएं\n" +
				"- मूल टेक्स्ट की अनुमानित लंबाई बनाए रखें\n" +
				"- केवल वह परिणाम लौटाएं जो सीधे चयनित टेक्स्ट को बदल सकता है",

			zh: "重要：你只在处理一个选定的文本片段。\n" +
				"规则：\n" +
				"- 只处理 [Selected text] 和 [END OF SELECTED TEXT] 之间的文本\n" +
				"- 你的回复必须只包含处理/修改后的文本\n" +
				"- 不要在文本之外添加引言、解释或结论\n" +
				"- 不要超出选定片段的边界\n" +
				"- 保持原文的大致长度\n" +
				"- 只返回可以直接替换选定文本的结果",

			ja: "重要：選択されたテキストフラグメントのみで作業しています。\n" +
				"ルール：\n" +
				"- [Selected text] と [END OF SELECTED TEXT] の間のテキストのみで作業してください\n" +
				"- 回答には処理/変更されたテキストのみを含めてください\n" +
				"- テキスト外に序論、説明、結論を追加しないでください\n" +
				"- 選択されたフラグメントの境界を超えないでください\n" +
				"- 元のテキストのおおよその長さを保持してください\n" +
				"- 選択されたテキストを直接置き換えることができる結果のみを返してください"
		};

		return instructions[lang] ?? instructions["en"] ?? "Work only with the selected text fragment. Return only the result.";
	}

	private showWelcome(): void {
		if (this.messages.length === 0) {
			const locale = getButtonLocale(this.plugin.settings.language);
			const welcome = this.messagesContainer.createDiv({ cls: "cristal-welcome" });

			// Title
			welcome.createEl("h2", { cls: "cristal-welcome-title", text: locale.welcomeTitle });

			// Subtitle
			welcome.createEl("p", { cls: "cristal-welcome-subtitle", text: locale.welcomeSubtitle });

			// Features list
			const features = welcome.createDiv({ cls: "cristal-welcome-features" });
			const featureData = [
				{ icon: "message-circle", text: locale.welcomeFeature1 },
				{ icon: "paperclip", text: locale.welcomeFeature2 },
				{ icon: "at-sign", text: locale.welcomeFeature3 },
				{ icon: "globe", text: locale.welcomeFeature4 }
			];

			for (const feature of featureData) {
				const item = features.createDiv({ cls: "cristal-welcome-feature" });
				const icon = item.createSpan({ cls: "cristal-welcome-feature-icon" });
				setIcon(icon, feature.icon);
				item.createSpan({ text: feature.text });
			}

			// Tip
			welcome.createEl("p", { cls: "cristal-welcome-hint", text: locale.welcomeTip });

			// Joke
			welcome.createEl("p", { cls: "cristal-welcome-joke", text: locale.welcomeJoke });
		}
	}

	private clearWelcome(): void {
		const welcome = this.messagesContainer.querySelector(".cristal-welcome");
		if (welcome) {
			welcome.remove();
		}
	}

	private async sendMessage(): Promise<void> {
		const userInput = this.inputEl.value.trim();
		const currentSession = this.plugin.getCurrentSession();
		// Check if either service is running for this session
		const isAnyServiceRunning = currentSession && (
			this.plugin.claudeService.isRunning(currentSession.id) ||
			this.plugin.codexService.isRunning(currentSession.id)
		);
		if (!userInput || !currentSession || isAnyServiceRunning) {
			return;
		}

		// Hide autocomplete if visible
		this.hideAutocomplete();

		this.clearWelcome();
		this.inputEl.value = "";
		this.autoResizeInput();

		// Process slash command if present
		let userPrompt = userInput;
		let displayText = userInput;
		let expandedPrompt: string | null = null;

		if (userInput.startsWith("/")) {
			const commandPrompt = this.processSlashCommand(userInput);
			if (commandPrompt) {
				userPrompt = commandPrompt;
				expandedPrompt = commandPrompt;
				// Show the original command in chat
				displayText = userInput;
			}
		}

		// Check if this is the first message in session (for system prompt)
		const isFirstMessage = this.messages.length === 0;

		this.addUserMessage(displayText, expandedPrompt);
		this.setInputEnabled(false);
		this.setStatus("loading");

		// Prepare assistant message element
		this.prepareAssistantMessage();

		// Build prompt with file context (unless disabled by user)
		let fullPrompt = userPrompt;
		if (!this.contextDisabled) {
			const fileContext = await this.getActiveFileContext();
			if (fileContext) {
				fullPrompt = `[Context: ${fileContext.name}]\n${fileContext.content}\n\n---\n\n${userPrompt}`;
			}
		}

		// Add mentioned files context
		if (this.mentionedFiles.length > 0) {
			const mentionedContext = await this.getMentionedFilesContext();
			if (mentionedContext) {
				fullPrompt = `${mentionedContext}\n\n---\n\n${fullPrompt}`;
			}
			// Clear mentioned files after sending
			this.clearMentionedFiles();
		}

		// Add attached files context
		if (this.attachedFiles.length > 0) {
			const attachedContext = this.attachedFiles.map(file => {
				if (["png", "jpg", "jpeg", "gif", "webp"].includes(file.type)) {
					return `[Attached image: ${file.name}]\n${file.content}`;
				} else {
					return `[Attached file: ${file.name}]\n${file.content}`;
				}
			}).join("\n\n---\n\n");
			fullPrompt = `${attachedContext}\n\n---\n\n${fullPrompt}`;
			this.clearAttachedFiles();
		}

		// Add selected text from editor (highest priority)
		if (this.selectedText) {
			// Preserve selection context for response buttons (replace/append)
			this.lastSelectionContext = { ...this.selectedText };

			// Build selection context with strict instructions
			const selectionInstruction = this.getSelectionInstruction();
			fullPrompt = `[SELECTED TEXT MODE]\n${selectionInstruction}\n\n[Selected text from ${this.selectedText.source}]\n${this.selectedText.content}\n\n[END OF SELECTED TEXT]\n\n[User request]\n${fullPrompt}`;

			this.selectedText = null;
			this.updateFileContextIndicator();
		} else {
			// Clear last selection context if no selection was used
			this.lastSelectionContext = null;
		}

		// Add compact summary if exists (system prompt is now read from CLAUDE.md automatically)
		if (isFirstMessage && this.compactSummary) {
			fullPrompt = `[Previous conversation summary]:\n${this.compactSummary}\n\n---\n\n` + fullPrompt;
			this.compactSummary = null; // Clear after use
		}

		// Get the active service based on current provider
		const service = this.plugin.getActiveService(this.currentProvider);

		// Get CLI session ID - either from service (current) or from saved session
		let cliSessionId: string | undefined;
		if (this.currentProvider === "claude") {
			cliSessionId = this.plugin.claudeService.getCliSessionId(currentSession.id)
				?? currentSession.cliSessionId
				?? undefined;
		} else {
			cliSessionId = this.plugin.codexService.getThreadId(currentSession.id)
				?? currentSession.cliSessionId
				?? undefined;
		}

		// Lock model and provider after first message
		if (!this.sessionStarted) {
			this.sessionStarted = true;
			this.updateModelIndicatorState();
			// Save model and provider to session
			currentSession.model = this.currentModel;
			currentSession.provider = this.currentProvider;
			this.plugin.saveSettings();
		}

		// Add ultrathink prefix if thinking mode is enabled (Claude only)
		if (this.thinkingEnabled && this.currentProvider === "claude") {
			fullPrompt = `ultrathink: ${fullPrompt}`;
		}

		// Send to the active service with model and session ID
		await service.sendMessage(
			fullPrompt,
			currentSession.id,
			cliSessionId,
			this.currentModel
		);
	}

	private addUserMessage(content: string, expandedPrompt?: string | null): void {
		const msgId = crypto.randomUUID();
		const message: ChatMessage = {
			id: msgId,
			role: "user",
			content,
			timestamp: Date.now()
		};
		this.messages.push(message);

		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-user"
		});
		msgEl.dataset.id = msgId;

		const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
		contentEl.setText(content);

		// Show expanded prompt for slash commands
		if (expandedPrompt && content.startsWith("/")) {
			const expandedEl = msgEl.createDiv({ cls: "cristal-expanded-prompt" });
			expandedEl.setText(expandedPrompt);
		}

		// Add copy and edit buttons
		this.addUserMessageActions(msgEl, content, msgId);

		this.scrollToBottom();
	}

	private prepareAssistantMessage(): void {
		this.currentAssistantContent = "";
		this.hasReceivedText = false;
		this.currentThinkingBlock = null;
		this.currentThinkingSteps = null;
		this.currentAssistantMessage = null;
		this.currentMessageThinkingSteps = [];

		// Create initial thinking block with "Thinking..." header
		this.createThinkingBlock();

		this.scrollToBottom();
	}

	private createThinkingBlock(): void {
		const locale = getButtonLocale(this.plugin.settings.language);

		// Create thinking block container
		this.currentThinkingBlock = this.messagesContainer.createDiv({
			cls: "cristal-thinking-block"
		});

		// Header with "Thinking..." text
		const header = this.currentThinkingBlock.createDiv({ cls: "cristal-thinking-header" });
		const iconEl = header.createSpan({ cls: "cristal-thinking-icon" });
		setIcon(iconEl, "brain");
		header.createSpan({ cls: "cristal-thinking-text", text: locale.thinking });

		// Steps container
		this.currentThinkingSteps = this.currentThinkingBlock.createDiv({ cls: "cristal-thinking-steps" });
	}

	private updateAssistantMessage(fullText: string): void {
		// If we haven't received text yet, create the streaming text element inside thinking block
		if (!this.hasReceivedText && fullText.trim()) {
			// Save tool steps as separate message before starting text
			if (this.currentMessageThinkingSteps.length > 0) {
				this.saveToolStepsAsMessage();
			}
			this.hasReceivedText = true;
			this.createStreamingTextElement();
		}

		if (!this.currentAssistantMessage) return;

		this.currentAssistantContent = fullText;

		// During streaming: show plain text inside thinking block style
		this.currentAssistantMessage.setText(fullText);

		this.scrollToBottom();
	}

	// Save current tool steps as a separate message (for grouping)
	private saveToolStepsAsMessage(): void {
		if (this.currentMessageThinkingSteps.length === 0) return;

		const message: ChatMessage = {
			id: crypto.randomUUID(),
			role: "assistant",
			content: "",
			timestamp: Date.now(),
			thinkingSteps: [...this.currentMessageThinkingSteps]
		};
		this.messages.push(message);
		this.currentMessageThinkingSteps = [];
		this.saveCurrentSession();
	}

	// Save current text as a separate message (for grouping)
	private saveTextAsMessage(): void {
		if (!this.currentAssistantContent.trim()) return;

		// Remove streaming text element
		if (this.currentAssistantMessage) {
			this.currentAssistantMessage.remove();
			this.currentAssistantMessage = null;
		}

		// Capture selection context before it gets cleared
		const selectionContext = this.lastSelectionContext ? { ...this.lastSelectionContext } : undefined;

		// Create final message block
		const msgId = crypto.randomUUID();
		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-assistant"
		});
		msgEl.dataset.id = msgId;

		const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
		MarkdownRenderer.render(
			this.app,
			this.currentAssistantContent,
			contentEl,
			"",
			this
		);
		this.removeEditableAttributes(contentEl);
		this.addCopyButton(msgEl, this.currentAssistantContent, selectionContext);

		// Save to history with selection context
		const message: ChatMessage = {
			id: msgId,
			role: "assistant",
			content: this.currentAssistantContent,
			timestamp: Date.now(),
			selectionContext
		};
		this.messages.push(message);
		this.currentAssistantContent = "";
		this.hasReceivedText = false;
		this.saveCurrentSession();
	}

	private createStreamingTextElement(): void {
		// Mark current thinking block as done (stop animation)
		this.markThinkingDone();

		// Create streaming text element directly without "Response" header
		// This makes output consistent between Claude Code and Codex
		this.currentAssistantMessage = this.messagesContainer.createDiv({
			cls: "cristal-streaming-text"
		});
	}

	private removeEditableAttributes(el: HTMLElement): void {
		// Remove contenteditable from all child elements
		el.querySelectorAll("[contenteditable]").forEach((child) => {
			child.removeAttribute("contenteditable");
		});
		// Remove tabindex to prevent focus
		el.querySelectorAll("[tabindex]").forEach((child) => {
			child.setAttribute("tabindex", "-1");
		});
	}

	private markThinkingDone(): void {
		if (this.currentThinkingBlock) {
			this.currentThinkingBlock.addClass("cristal-thinking-done");
		}
	}

	private finalizeAssistantMessage(): void {
		// Remove streaming text element (it was temporary)
		if (this.currentAssistantMessage) {
			this.currentAssistantMessage.remove();
			this.currentAssistantMessage = null;
		}

		// Mark thinking block as done and clean up empty steps
		if (this.currentThinkingBlock && this.currentThinkingSteps) {
			if (this.currentThinkingSteps.children.length === 0) {
				this.currentThinkingBlock.remove();
			} else {
				this.markThinkingDone();
			}
		}

		// Save message if we have content OR tool steps
		const hasContent = this.currentAssistantContent.trim().length > 0;
		const hasToolSteps = this.currentMessageThinkingSteps.length > 0;

		// Capture selection context before it gets cleared
		const selectionContext = this.lastSelectionContext ? { ...this.lastSelectionContext } : undefined;

		if (hasContent || hasToolSteps) {
			const msgId = crypto.randomUUID();

			// Create message block only if there's text content
			if (hasContent) {
				const msgEl = this.messagesContainer.createDiv({
					cls: "cristal-message cristal-message-assistant"
				});
				msgEl.dataset.id = msgId;

				const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
				MarkdownRenderer.render(
					this.app,
					this.currentAssistantContent,
					contentEl,
					"",
					this
				);
				this.removeEditableAttributes(contentEl);
				this.addCopyButton(msgEl, this.currentAssistantContent, selectionContext);
			}

			// Save message to history with selection context
			const message: ChatMessage = {
				id: msgId,
				role: "assistant",
				content: this.currentAssistantContent,
				timestamp: Date.now(),
				thinkingSteps: hasToolSteps
					? [...this.currentMessageThinkingSteps]
					: undefined,
				selectionContext
			};
			this.messages.push(message);
			this.saveCurrentSession();
		}

		// Reset all state
		this.currentAssistantMessage = null;
		this.currentAssistantContent = "";
		this.currentThinkingBlock = null;
		this.currentThinkingSteps = null;
		this.hasReceivedText = false;
		this.currentMessageThinkingSteps = [];
	}

	private addCopyButton(messageEl: HTMLElement, content: string, selectionContext?: SelectionContext): void {
		const locale = getButtonLocale(this.plugin.settings.language);
		const actionsEl = messageEl.createDiv({ cls: "cristal-message-actions" });

		// Copy button (icon-only)
		const copyBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon",
			attr: { "aria-label": locale.copy, "title": locale.copy }
		});
		setIcon(copyBtn, "copy");

		copyBtn.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(content);
				// Show success feedback
				copyBtn.empty();
				setIcon(copyBtn, "check");
				copyBtn.setAttribute("title", locale.copySuccess);
				copyBtn.addClass("cristal-action-btn-success");

				// Reset after 2 seconds
				setTimeout(() => {
					copyBtn.empty();
					setIcon(copyBtn, "copy");
					copyBtn.setAttribute("title", locale.copy);
					copyBtn.removeClass("cristal-action-btn-success");
				}, 2000);
			} catch (err) {
				console.error("Failed to copy:", err);
			}
		});

		// Replace button (icon-only)
		const replaceBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon cristal-note-action",
			attr: { "aria-label": locale.replace, "title": locale.replace }
		});
		setIcon(replaceBtn, "replace");

		replaceBtn.addEventListener("click", async () => {
			await this.replaceNoteContent(content, replaceBtn, locale, selectionContext);
		});

		// Append button (icon-only)
		const appendBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon cristal-note-action",
			attr: { "aria-label": locale.append, "title": locale.append }
		});
		setIcon(appendBtn, "file-plus");

		appendBtn.addEventListener("click", async () => {
			await this.appendToNote(content, appendBtn, locale, selectionContext);
		});

		// New Page button (icon-only)
		const newPageBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon",
			attr: { "aria-label": locale.newPage, "title": locale.newPage }
		});
		setIcon(newPageBtn, "file-plus-2");

		newPageBtn.addEventListener("click", async () => {
			await this.createNewPageWithContent(content, newPageBtn, locale);
		});

		// Update visibility based on active file
		this.updateNoteActionButtons(actionsEl);
	}

	private updateNoteActionButtons(actionsEl: HTMLElement): void {
		const activeFile = this.app.workspace.getActiveFile();
		const noteButtons = actionsEl.querySelectorAll(".cristal-note-action");

		noteButtons.forEach(btn => {
			if (activeFile && activeFile.extension === "md") {
				(btn as HTMLElement).style.display = "flex";
			} else {
				(btn as HTMLElement).style.display = "none";
			}
		});
	}

	private updateAllNoteActionButtons(): void {
		const allActions = this.messagesContainer.querySelectorAll(".cristal-message-actions");
		allActions.forEach(actionsEl => {
			this.updateNoteActionButtons(actionsEl as HTMLElement);
		});
	}

	private async replaceNoteContent(content: string, btn: HTMLElement, locale: ButtonLocale, selectionContext?: SelectionContext): Promise<void> {
		try {
			// If we have selection context with position, replace only the selected text
			if (selectionContext && selectionContext.filePath) {
				const file = this.app.vault.getAbstractFileByPath(selectionContext.filePath);
				if (file instanceof TFile && file.extension === "md") {
					const currentContent = await this.app.vault.read(file);
					const lines = currentContent.split("\n");

					// Build content before selection
					let before = lines.slice(0, selectionContext.startLine).join("\n");
					if (before) before += "\n";
					before += lines[selectionContext.startLine]?.slice(0, selectionContext.startCh) || "";

					// Build content after selection
					let after = lines[selectionContext.endLine]?.slice(selectionContext.endCh) || "";
					if (selectionContext.endLine < lines.length - 1) {
						after += "\n" + lines.slice(selectionContext.endLine + 1).join("\n");
					}

					// Replace only the selected fragment
					const newContent = before + content + after;
					await this.app.vault.modify(file, newContent);

					// Show success feedback
					this.showButtonSuccess(btn, "check", locale.replaceSuccess, "replace", locale.replace);
					return;
				}
			}

			// Fallback: replace entire active file
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile || activeFile.extension !== "md") {
				return;
			}

			await this.app.vault.modify(activeFile, content);
			this.showButtonSuccess(btn, "check", locale.replaceSuccess, "replace", locale.replace);
		} catch (err) {
			console.error("Failed to replace note content:", err);
		}
	}

	private async appendToNote(content: string, btn: HTMLElement, locale: ButtonLocale, selectionContext?: SelectionContext): Promise<void> {
		try {
			// If we have selection context with position, insert after the selected text
			if (selectionContext && selectionContext.filePath) {
				const file = this.app.vault.getAbstractFileByPath(selectionContext.filePath);
				if (file instanceof TFile && file.extension === "md") {
					const currentContent = await this.app.vault.read(file);
					const lines = currentContent.split("\n");

					// Build content up to end of selection
					let before = lines.slice(0, selectionContext.endLine).join("\n");
					if (before) before += "\n";
					before += lines[selectionContext.endLine]?.slice(0, selectionContext.endCh) || "";

					// Build content after selection
					let after = lines[selectionContext.endLine]?.slice(selectionContext.endCh) || "";
					if (selectionContext.endLine < lines.length - 1) {
						after += "\n" + lines.slice(selectionContext.endLine + 1).join("\n");
					}

					// Insert content right after the selection
					const newContent = before + "\n\n" + content + after;
					await this.app.vault.modify(file, newContent);

					// Show success feedback
					this.showButtonSuccess(btn, "check", locale.appendSuccess, "file-plus", locale.append);
					return;
				}
			}

			// Fallback: append to end of active file
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile || activeFile.extension !== "md") {
				return;
			}

			const currentContent = await this.app.vault.read(activeFile);
			const newContent = currentContent + "\n\n---\n\n" + content;
			await this.app.vault.modify(activeFile, newContent);
			this.showButtonSuccess(btn, "check", locale.appendSuccess, "file-plus", locale.append);
		} catch (err) {
			console.error("Failed to append to note:", err);
		}
	}

	private showButtonSuccess(btn: HTMLElement, successIcon: string, successTitle: string, defaultIcon: string, defaultTitle: string): void {
		btn.empty();
		setIcon(btn, successIcon);
		btn.setAttribute("title", successTitle);
		btn.addClass("cristal-action-btn-success");

		setTimeout(() => {
			btn.empty();
			setIcon(btn, defaultIcon);
			btn.setAttribute("title", defaultTitle);
			btn.removeClass("cristal-action-btn-success");
		}, 2000);
	}

	/**
	 * Determines the grouping type for a tool (for consecutive command grouping)
	 */
	private getToolGroupType(tool: ToolUseBlock): string {
		// Reasoning/thinking is a special group
		if (tool.name === "thinking") {
			return "thinking";
		}

		// Command execution - group by command type
		if (tool.name === "command_execution") {
			const cmd = ((tool.input as { command?: string })?.command || "").toLowerCase();
			if (cmd.includes("rg ") || cmd.includes("ripgrep")) return "search";
			if (cmd.includes("find ")) return "find";
			if (cmd.includes("sed ") || cmd.includes("cat ") || cmd.includes("head ") || cmd.includes("tail ")) return "read";
			if (cmd.includes("python") || cmd.includes("node") || cmd.includes("npm") || cmd.includes("npx")) return "script";
			return "command";
		}

		// File operations group together
		if (tool.name === "file_read" || tool.name === "Read") return "file_read";
		if (tool.name === "file_write" || tool.name === "Write" || tool.name === "Edit") return "file_write";

		// Other tools by name
		return tool.name;
	}

	/**
	 * Resets grouping state (call when response finishes or context changes)
	 */
	private resetToolGrouping(): void {
		this.currentToolGroup = null;
		this.currentReasoningGroup = null;
		this.currentToolStepsGroup = null;
	}

	private addToolStep(tool: ToolUseBlock): void {
		const locale = getButtonLocale(this.plugin.settings.language);
		const toolType = this.getToolGroupType(tool);

		// If we already received text, save it as separate message before new tools
		if (this.hasReceivedText) {
			this.saveTextAsMessage();      // Save current text as separate message
			this.hasReceivedText = false;  // Reset so next text creates new response block
			this.createThinkingBlock();    // Create new thinking block after previous response
			this.resetToolGrouping();      // Reset grouping on context change
		}

		// Ensure we have a thinking block
		if (!this.currentThinkingSteps) {
			this.createThinkingBlock();
		}

		if (!this.currentThinkingSteps) return;

		// Handle reasoning/thinking blocks separately - merge into one group
		if (toolType === "thinking") {
			this.addReasoningToGroup(tool, locale);
			this.currentToolStepsGroup = null; // Reset tool steps group when reasoning comes
			this.currentToolGroup = null; // Reset old tool grouping
			this.currentMessageThinkingSteps.push(tool);
			this.scrollToBottom();
			return;
		}

		// For non-thinking tools, finalize reasoning group if active
		if (this.currentReasoningGroup) {
			this.currentReasoningGroup = null;
		}

		// Different display for Claude vs Codex:
		// - Claude: tool steps in collapsible group (like Codex reasoning)
		// - Codex: tool steps as simple list (original behavior)
		if (this.currentProvider === "claude") {
			// Claude: unified collapsible group for tool steps
			this.addToolToStepsGroup(tool, locale);
		} else {
			// Codex: original behavior - grouped by tool type
			if (this.currentToolGroup && this.currentToolGroup.type === toolType && this.currentToolGroup.element) {
				this.currentToolGroup.tools.push(tool);
				this.updateToolGroupUI(this.currentToolGroup, locale);
			} else {
				this.currentToolGroup = { type: toolType, tools: [tool], element: null };
				const stepEl = this.createToolStepElement(tool, locale);
				this.currentToolGroup.element = stepEl;
			}
		}

		// Accumulate step for saving to message history
		this.currentMessageThinkingSteps.push(tool);

		this.scrollToBottom();
	}

	/**
	 * Adds a tool step to the unified collapsible group (unified with Codex reasoning style)
	 */
	private addToolToStepsGroup(tool: ToolUseBlock, locale: ButtonLocale): void {
		if (!this.currentThinkingSteps) return;

		// Create new group if needed
		if (!this.currentToolStepsGroup) {
			// Create the group container (same style as reasoning groups)
			const groupEl = this.currentThinkingSteps.createDiv({ cls: "cristal-reasoning-group cristal-tool-steps-group" });

			// Group header (clickable to expand/collapse)
			const headerEl = groupEl.createDiv({ cls: "cristal-reasoning-group-header" });
			const iconEl = headerEl.createSpan({ cls: "cristal-reasoning-icon" });
			setIcon(iconEl, "brain");

			const titleEl = headerEl.createSpan({ cls: "cristal-reasoning-group-title" });
			titleEl.setText(locale.thinking || "Думает...");

			const counterEl = headerEl.createSpan({ cls: "cristal-reasoning-group-counter" });
			counterEl.style.display = "none";

			const expandEl = headerEl.createSpan({ cls: "cristal-reasoning-group-expand" });

			// Content area for tool steps
			const contentEl = groupEl.createDiv({ cls: "cristal-reasoning-group-content cristal-tool-steps-content" });

			// Click header to expand/collapse (synced across all groups)
			headerEl.addEventListener("click", () => {
				const isExpanded = contentEl.style.display !== "none";

				// Update global state
				this.reasoningGroupsExpanded = !isExpanded;

				// Synchronized expand/collapse all groups
				if (this.reasoningGroupsExpanded) {
					this.expandAllReasoningGroups();
				} else {
					this.collapseAllReasoningGroups();
				}
			});

			// Start with global state
			if (this.reasoningGroupsExpanded) {
				groupEl.addClass("expanded");
				contentEl.style.display = "block";
				setIcon(expandEl, "chevron-up");
			} else {
				contentEl.style.display = "none";
				setIcon(expandEl, "chevron-down");
			}

			this.currentToolStepsGroup = { tools: [tool], element: groupEl, contentEl };

			// Add first tool step
			this.addToolStepToContent(contentEl, tool, locale);
			return;
		}

		// Add to existing group
		this.currentToolStepsGroup.tools.push(tool);
		const count = this.currentToolStepsGroup.tools.length;

		// Update counter
		const counterEl = this.currentToolStepsGroup.element?.querySelector(".cristal-reasoning-group-counter") as HTMLElement;
		if (counterEl && count > 1) {
			counterEl.style.display = "inline";
			counterEl.setText(`(${count})`);
		}

		// Add tool step to content
		if (this.currentToolStepsGroup.contentEl) {
			this.addToolStepToContent(this.currentToolStepsGroup.contentEl, tool, locale);
		}
	}

	/**
	 * Adds a single tool step item inside the collapsible content area
	 */
	private addToolStepToContent(container: HTMLElement, tool: ToolUseBlock, locale: ButtonLocale): void {
		const stepEl = container.createDiv({ cls: "cristal-tool-step-item" });

		const iconEl = stepEl.createSpan({ cls: "cristal-tool-step-icon" });
		setIcon(iconEl, this.getToolIcon(tool.name));

		const textEl = stepEl.createSpan({ cls: "cristal-tool-step-text" });
		textEl.setText(this.formatToolStep(tool, locale));
	}

	/**
	 * Creates a single tool step UI element
	 */
	private createToolStepElement(tool: ToolUseBlock, locale: ButtonLocale): HTMLElement {
		if (!this.currentThinkingSteps) return document.createElement("div");

		const stepEl = this.currentThinkingSteps.createDiv({ cls: "cristal-tool-step" });

		// Header with icon, text, counter, and expand arrow
		const stepHeader = stepEl.createDiv({ cls: "cristal-tool-step-header" });

		const iconEl = stepHeader.createSpan({ cls: "cristal-tool-step-icon" });
		setIcon(iconEl, this.getToolIcon(tool.name));

		const textEl = stepHeader.createSpan({ cls: "cristal-tool-step-text" });
		textEl.setText(this.formatToolStep(tool, locale));

		// Counter badge (initially hidden, shown when group has >1 items)
		const counterEl = stepHeader.createSpan({ cls: "cristal-tool-step-counter" });
		counterEl.style.display = "none";

		// Details block (use simple format without JSON wrapper)
		const detailsEl = stepEl.createDiv({ cls: "cristal-tool-step-details" });
		this.renderToolDetailsSimple(detailsEl, tool);

		// Special handling for todo_list: always expanded, no collapse
		const isTodoList = tool.name === "todo_list";
		if (isTodoList) {
			detailsEl.style.display = "block";
			stepEl.addClass("expanded");
			stepEl.addClass("cristal-tool-step-no-collapse");
		} else {
			// Expand arrow (not for todo_list)
			const expandEl = stepHeader.createSpan({ cls: "cristal-tool-step-expand" });
			setIcon(expandEl, "chevron-down");
			detailsEl.style.display = "none";

			// Click handler for expand/collapse
			stepHeader.addEventListener("click", () => {
				const isExpanded = detailsEl.style.display !== "none";
				detailsEl.style.display = isExpanded ? "none" : "block";
				stepEl.toggleClass("expanded", !isExpanded);
				expandEl.empty();
				setIcon(expandEl, isExpanded ? "chevron-down" : "chevron-up");
			});
		}

		return stepEl;
	}

	/**
	 * Updates the UI of a tool group when new tools are added
	 */
	private updateToolGroupUI(group: { type: string; tools: ToolUseBlock[]; element: HTMLElement | null }, locale: ButtonLocale): void {
		if (!group.element) return;

		const count = group.tools.length;
		const lastTool = group.tools[count - 1];
		if (!lastTool) return;

		// Update the header text to show last tool action
		const textEl = group.element.querySelector(".cristal-tool-step-text");
		if (textEl) {
			textEl.setText(this.formatToolStep(lastTool, locale));
		}

		// Show and update counter
		const counterEl = group.element.querySelector(".cristal-tool-step-counter") as HTMLElement;
		if (counterEl && count > 1) {
			counterEl.style.display = "inline";
			counterEl.setText(`(${count})`);
		}

		// Add new tool details to the details section (no separator, just new line)
		const detailsEl = group.element.querySelector(".cristal-tool-step-details");
		if (detailsEl) {
			this.renderToolDetailsSimple(detailsEl as HTMLElement, lastTool);
		}
	}

	/**
	 * Renders tool details in simple format (no JSON wrapper, just key info)
	 */
	private renderToolDetailsSimple(container: HTMLElement, tool: ToolUseBlock): void {
		const input = tool.input as Record<string, unknown>;
		const line = container.createDiv({ cls: "cristal-tool-detail-line" });

		switch (tool.name) {
			case "command_execution":
				// Extract the actual command, not bash wrapper
				const cmd = (input.command as string) || "";
				const match = cmd.match(/^(?:\/bin\/)?bash\s+-lc\s+['"]([\s\S]*)['"]$/);
				const inner = (match && match[1]) ? match[1] : cmd;
				line.setText(inner.substring(0, 100) + (inner.length > 100 ? "..." : ""));
				break;
			case "Read":
			case "file_read":
				line.setText(String(input.file_path || ""));
				break;
			case "Grep":
				line.setText(`${input.pattern} ${input.path ? "в " + input.path : ""}`);
				break;
			case "Glob":
				line.setText(`${input.pattern}`);
				break;
			case "todo_list":
				// Remove default line, render checkboxes instead
				line.remove();
				const items = input.items as Array<{ text: string; completed: boolean }> | undefined;
				if (items && Array.isArray(items)) {
					for (const item of items) {
						const itemEl = container.createDiv({ cls: "cristal-todo-item" });
						const checkbox = itemEl.createEl("input", { type: "checkbox" });
						checkbox.checked = item.completed;
						checkbox.disabled = true;  // Read-only display
						itemEl.createSpan({ cls: "cristal-todo-text", text: item.text });
					}
				}
				break;
			default:
				// For other tools, show first meaningful value
				const firstValue = Object.values(input).find(v => typeof v === "string" && v.length > 0);
				if (firstValue) {
					const val = String(firstValue);
					line.setText(val.substring(0, 80) + (val.length > 80 ? "..." : ""));
				}
		}
	}

	/**
	 * Adds a reasoning block to the current reasoning group (merges consecutive thinking)
	 * All text is shown inline, no collapsible sections
	 */
	private addReasoningToGroup(tool: ToolUseBlock, locale: ButtonLocale): void {
		if (!this.currentThinkingSteps) return;

		// If no active reasoning group, create one
		if (!this.currentReasoningGroup) {
			this.currentReasoningGroup = { tools: [tool], element: null };

			// Create the group container
			const groupEl = this.currentThinkingSteps.createDiv({ cls: "cristal-reasoning-group" });
			this.currentReasoningGroup.element = groupEl;

			// Group header (clickable to expand/collapse)
			const headerEl = groupEl.createDiv({ cls: "cristal-reasoning-group-header" });
			const iconEl = headerEl.createSpan({ cls: "cristal-reasoning-icon" });
			setIcon(iconEl, "brain");

			const titleEl = headerEl.createSpan({ cls: "cristal-reasoning-group-title" });
			titleEl.setText(locale.thinking || "Думает...");

			const counterEl = headerEl.createSpan({ cls: "cristal-reasoning-group-counter" });
			counterEl.style.display = "none";

			const expandEl = headerEl.createSpan({ cls: "cristal-reasoning-group-expand" });
			setIcon(expandEl, "chevron-down");

			// Content area - always visible, click header to collapse
			const contentEl = groupEl.createDiv({ cls: "cristal-reasoning-group-content" });
			contentEl.dataset.reasoningGroup = "true";

			// Render the first reasoning item
			this.renderReasoningStep(contentEl, tool, locale);

			// Click header to expand/collapse (synced across all groups)
			headerEl.addEventListener("click", () => {
				const isExpanded = contentEl.style.display !== "none";

				// Update global state
				this.reasoningGroupsExpanded = !isExpanded;

				// Synchronized expand/collapse all groups
				if (this.reasoningGroupsExpanded) {
					this.expandAllReasoningGroups();
				} else {
					this.collapseAllReasoningGroups();
				}
			});

			// Start with global state (not always expanded)
			if (this.reasoningGroupsExpanded) {
				groupEl.addClass("expanded");
				contentEl.style.display = "block";
				setIcon(expandEl, "chevron-up");
			} else {
				contentEl.style.display = "none";
				setIcon(expandEl, "chevron-down");
			}

			return;
		}

		// Add to existing group - just append text with line break
		this.currentReasoningGroup.tools.push(tool);
		const count = this.currentReasoningGroup.tools.length;

		// Update counter
		const counterEl = this.currentReasoningGroup.element?.querySelector(".cristal-reasoning-group-counter") as HTMLElement;
		if (counterEl && count > 1) {
			counterEl.style.display = "inline";
			counterEl.setText(`(${count})`);
		}

		// Add new reasoning content (on new line)
		const contentEl = this.currentReasoningGroup.element?.querySelector(".cristal-reasoning-group-content") as HTMLElement;
		if (contentEl) {
			// Add line break before new thought
			contentEl.createEl("br");
			contentEl.createEl("br");
			this.renderReasoningStep(contentEl, tool, locale);
		}
	}

	/**
	 * Expands all reasoning groups in the current view (synchronized expand)
	 */
	private expandAllReasoningGroups(): void {
		const groups = this.messagesContainer.querySelectorAll(".cristal-reasoning-group");
		groups.forEach(group => {
			const content = group.querySelector(".cristal-reasoning-group-content") as HTMLElement;
			const expand = group.querySelector(".cristal-reasoning-group-expand");
			if (content && content.style.display === "none") {
				content.style.display = "block";
				group.addClass("expanded");
				if (expand) {
					expand.empty();
					setIcon(expand as HTMLElement, "chevron-up");
				}
			}
		});
	}

	/**
	 * Collapses all reasoning groups in the current view (synchronized collapse)
	 */
	private collapseAllReasoningGroups(): void {
		const groups = this.messagesContainer.querySelectorAll(".cristal-reasoning-group");
		groups.forEach(group => {
			const content = group.querySelector(".cristal-reasoning-group-content") as HTMLElement;
			const expand = group.querySelector(".cristal-reasoning-group-expand");
			if (content && content.style.display !== "none") {
				content.style.display = "none";
				group.removeClass("expanded");
				if (expand) {
					expand.empty();
					setIcon(expand as HTMLElement, "chevron-down");
				}
			}
		});
	}

	private renderToolDetails(container: HTMLElement, tool: ToolUseBlock): void {
		const input = tool.input as Record<string, unknown>;

		switch (tool.name) {
			case "Read":
				container.createDiv({ text: `Path: ${input.file_path}` });
				if (input.offset) container.createDiv({ text: `Offset: ${input.offset}` });
				if (input.limit) container.createDiv({ text: `Limit: ${input.limit}` });
				break;

			case "Grep":
				container.createDiv({ text: `Pattern: ${input.pattern}` });
				if (input.path) container.createDiv({ text: `Path: ${input.path}` });
				if (input.glob) container.createDiv({ text: `Glob: ${input.glob}` });
				break;

			case "Glob":
				container.createDiv({ text: `Pattern: ${input.pattern}` });
				if (input.path) container.createDiv({ text: `Path: ${input.path}` });
				break;

			case "Edit":
				container.createDiv({ text: `File: ${input.file_path}` });
				break;

			case "Write":
				container.createDiv({ text: `File: ${input.file_path}` });
				break;

			case "Delete":
				container.createDiv({ text: `File: ${input.file_path}` });
				break;

			case "WebSearch":
				container.createDiv({ text: `Query: ${input.query}` });
				break;

			case "WebFetch":
				container.createDiv({ text: `URL: ${input.url}` });
				break;

			default:
				const pre = container.createEl("pre");
				pre.setText(JSON.stringify(input, null, 2));
		}
	}

	/**
	 * Converts bash commands to human-readable descriptions
	 */
	private humanizeBashCommand(cmd: string, locale: ButtonLocale): { action: string; details: string } {
		// Extract inner command from bash wrapper: /bin/bash -lc 'command'
		// Use [\s\S] instead of . with /s flag for compatibility
		const match = cmd.match(/^(?:\/bin\/)?bash\s+-lc\s+['"]([\s\S]*)['"]$/);
		const inner = (match && match[1]) ? match[1] : cmd;

		// ripgrep (rg) — search in files
		if (inner.startsWith("rg ")) {
			const patternMatch = inner.match(/rg\s+(?:-[a-zA-Z]+\s+)*["']?([^"'\s]+)["']?/);
			const pathMatch = inner.match(/["']([^"']+)["']\s*$/);
			const pattern = patternMatch?.[1] || "";
			const path = pathMatch?.[1]?.split("/").pop() || "";
			return {
				action: locale.searching || "Ищет",
				details: path ? `"${pattern}" в ${path}` : `"${pattern}"`
			};
		}

		// find — find files
		if (inner.startsWith("find ")) {
			const nameMatch = inner.match(/-name\s+["']([^"']+)["']/);
			const pathMatch = inner.match(/find\s+["']?([^"'\s]+)["']?\s/);
			return {
				action: locale.findingFiles || "Ищет файлы",
				details: nameMatch?.[1] || pathMatch?.[1] || ""
			};
		}

		// sed — read lines from file
		if (inner.startsWith("sed ")) {
			const fileMatch = inner.match(/["']([^"']+)["']\s*$/);
			const rangeMatch = inner.match(/-n\s+['"]?(\d+,\d+)p['"]?/);
			const fileName = fileMatch?.[1]?.split("/").pop() || "";
			const range = rangeMatch?.[1] || "";
			return {
				action: locale.readingFile || "Читает",
				details: range ? `${fileName} (строки ${range})` : fileName
			};
		}

		// python scripts
		if (inner.includes("python")) {
			return { action: "Python скрипт", details: "" };
		}

		// ls — list directory
		if (inner.startsWith("ls ")) {
			const pathMatch = inner.match(/ls\s+(?:-[a-zA-Z]+\s+)*["']?([^"'\s]+)["']?/);
			const path = pathMatch?.[1]?.split("/").pop() || ".";
			return { action: "Просматривает", details: path };
		}

		// cat — read file
		if (inner.startsWith("cat ")) {
			const fileMatch = inner.match(/cat\s+["']?([^"'\s|>]+)["']?/);
			const fileName = fileMatch?.[1]?.split("/").pop() || "";
			return { action: locale.readingFile || "Читает", details: fileName };
		}

		// head/tail — read part of file
		if (inner.startsWith("head ") || inner.startsWith("tail ")) {
			const fileMatch = inner.match(/(?:head|tail)\s+(?:-[a-zA-Z0-9]+\s+)*["']?([^"'\s|]+)["']?/);
			const fileName = fileMatch?.[1]?.split("/").pop() || "";
			return { action: locale.readingFile || "Читает", details: fileName };
		}

		// Default: truncate command
		const truncated = inner.substring(0, 50);
		return {
			action: locale.usingTool || "Выполняет",
			details: truncated + (inner.length > 50 ? "..." : "")
		};
	}

	private formatToolStep(tool: ToolUseBlock, locale: ButtonLocale): string {
		const input = tool.input as Record<string, unknown>;

		switch (tool.name) {
			case "Read":
				const filePath = input.file_path as string || "";
				const fileName = filePath.split("/").pop() || filePath;
				return `${locale.readingFile}: ${fileName}`;

			case "Edit":
			case "Write":
				const editPath = input.file_path as string || "";
				const editName = editPath.split("/").pop() || editPath;
				return tool.name === "Edit"
					? `${locale.editingFile}: ${editName}`
					: `${locale.writingFile}: ${editName}`;

			case "Delete":
				const deletePath = input.file_path as string || "";
				const deleteName = deletePath.split("/").pop() || deletePath;
				return `${locale.deletingFile}: ${deleteName}`;

			case "Grep":
				const pattern = input.pattern as string || "";
				return `${locale.searching}: "${pattern.substring(0, 30)}${pattern.length > 30 ? "..." : ""}"`;

			case "Glob":
				const globPattern = input.pattern as string || "";
				return `${locale.findingFiles}: ${globPattern}`;

			case "WebSearch":
			case "web_search":
				const query = input.query as string || "";
				return `${locale.webSearch}: "${query.substring(0, 30)}${query.length > 30 ? "..." : ""}"`;

			case "WebFetch":
				const url = input.url as string || "";
				return `${locale.fetchingUrl}: ${url.substring(0, 40)}${url.length > 40 ? "..." : ""}`;

			// Codex-specific tools
			case "thinking":
				const summary = input.summary as string[] || [];
				const firstSummary = summary[0];
				if (firstSummary) {
					return firstSummary.substring(0, 50) + (firstSummary.length > 50 ? "..." : "");
				}
				return locale.thinking || "Reasoning...";

			case "file_change":
				const changes = input.changes as Array<{ path: string; kind: string }> || [];
				if (changes.length === 1 && changes[0]) {
					const change = changes[0];
					const name = change.path.split("/").pop() || change.path;
					return `${change.kind}: ${name}`;
				}
				return `${changes.length} file changes`;

			case "command_execution":
				const bashCmd = input.command as string || "";
				const { action, details } = this.humanizeBashCommand(bashCmd, locale);
				return details ? `${action}: ${details}` : action;

			case "file_read":
				const readPath = input.command as string || input.path as string || "";
				const readName = readPath.split("/").pop() || readPath;
				return `${locale.readingFile}: ${readName}`;

			case "file_write":
				const writePath = input.command as string || input.path as string || "";
				const writeName = writePath.split("/").pop() || writePath;
				return `${locale.writingFile}: ${writeName}`;

			case "todo_list":
				const items = input.items as Array<{ text: string; completed: boolean }> || [];
				return `Todo: ${items.length} items`;

			default:
				// Handle MCP tools (format: mcp:server:tool)
				if (tool.name.startsWith("mcp:")) {
					const parts = tool.name.split(":");
					const server = parts[1] || "server";
					const toolName = parts[2] || "tool";
					return `MCP: ${server}/${toolName}`;
				}
				return `${locale.usingTool} ${tool.name}`;
		}
	}

	private getToolIcon(toolName: string): string {
		switch (toolName) {
			case "Read":
			case "file_read":
				return "file-text";
			case "Edit":
				return "edit";
			case "Write":
			case "file_write":
				return "file-plus";
			case "Delete":
				return "trash";
			case "Grep":
				return "search";
			case "Glob":
				return "folder-search";
			case "WebSearch":
			case "web_search":
				return "globe";
			case "WebFetch":
				return "download";
			case "Bash":
			case "command_execution":
				return "terminal";
			case "Task":
			case "todo_list":
				return "list-todo";
			// Codex-specific
			case "thinking":
				return "brain";
			case "file_change":
				return "file-diff";
			default:
				// Handle MCP tools
				if (toolName.startsWith("mcp:")) {
					return "plug";
				}
				return "wrench";
		}
	}

	private clearToolSteps(): void {
		// Legacy method - no longer needed with new architecture
		if (this.currentThinkingBlock) {
			this.currentThinkingBlock.remove();
			this.currentThinkingBlock = null;
			this.currentThinkingSteps = null;
		}
	}

	private addErrorMessage(error: string): void {
		const msgEl = this.messagesContainer.createDiv({
			cls: "cristal-message cristal-message-error"
		});

		const contentEl = msgEl.createDiv({ cls: "cristal-message-content" });
		contentEl.setText(error);

		this.scrollToBottom();
	}

	private handleRateLimitError(_resetTime: string | null, _originalMessage: string): void {
		// Finalize any pending message (the error message from Claude is already shown in chat)
		this.finalizeAssistantMessage();
		this.setInputEnabled(true);
		this.setStatus("idle");
	}

	private setStatus(status: "idle" | "loading" | "streaming" | "error", message?: string): void {
		this.statusEl.empty();
		this.statusEl.removeClass("cristal-status-error", "cristal-status-loading", "cristal-status-streaming");

		// Only show status bar for errors
		if (status === "error") {
			this.statusEl.addClass("cristal-status-error");
			this.statusEl.setText(message || "An error occurred");
			this.statusEl.style.display = "block";
		} else {
			// Hide status bar for non-error states
			this.statusEl.style.display = "none";
		}
	}

	private setInputEnabled(enabled: boolean): void {
		this.isGenerating = !enabled;
		this.sendButton.empty();

		if (this.isGenerating) {
			// Loading state: grey background with spinner
			setIcon(this.sendButton, "loader-2");
			this.sendButton.setAttribute("aria-label", "Stop generation");
			this.sendButton.addClass("cristal-send-btn-loading");
			this.sendButton.removeClass("cristal-send-btn-stop");

			// Hover listeners: show stop icon on hover
			this.sendButton.addEventListener("mouseenter", this.showStopIcon);
			this.sendButton.addEventListener("mouseleave", this.showLoaderIcon);
		} else {
			// Idle state: purple background with arrow
			setIcon(this.sendButton, "arrow-up");
			this.sendButton.setAttribute("aria-label", "Send message");
			this.sendButton.removeClass("cristal-send-btn-loading");
			this.sendButton.removeClass("cristal-send-btn-stop");

			// Remove hover listeners
			this.sendButton.removeEventListener("mouseenter", this.showStopIcon);
			this.sendButton.removeEventListener("mouseleave", this.showLoaderIcon);
		}

		// Focus input when generation completes
		if (enabled) {
			this.inputEl.focus();
		}
	}

	private showStopIcon = (): void => {
		if (this.isGenerating) {
			this.sendButton.empty();
			setIcon(this.sendButton, "square");
		}
	};

	private showLoaderIcon = (): void => {
		if (this.isGenerating) {
			this.sendButton.empty();
			setIcon(this.sendButton, "loader-2");
		}
	};

	private scrollToBottom(): void {
		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	// =========================================================================
	// Slash Command Autocomplete
	// =========================================================================

	private autoResizeInput(): void {
		// Reset height to auto to get correct scrollHeight
		this.inputEl.style.height = "auto";
		// Set height based on content, respecting max-height from CSS
		const maxHeight = 200;
		const newHeight = Math.min(this.inputEl.scrollHeight, maxHeight);
		this.inputEl.style.height = newHeight + "px";
		// Show scrollbar if content exceeds max height
		this.inputEl.style.overflowY = this.inputEl.scrollHeight > maxHeight ? "auto" : "hidden";
	}

	private handleInputChange(): void {
		const value = this.inputEl.value;
		const cursorPos = this.inputEl.selectionStart ?? 0;

		// Check for @ mention
		const textBeforeCursor = value.slice(0, cursorPos);
		const atIndex = textBeforeCursor.lastIndexOf("@");

		if (atIndex !== -1) {
			const query = textBeforeCursor.slice(atIndex + 1);
			// Only show autocomplete if no space after @ (still typing file name)
			if (!query.includes(" ") && !query.includes("\n")) {
				this.mentionStartIndex = atIndex;
				this.showMentionAutocomplete(query);
				this.hideAutocomplete();
				return;
			}
		}

		this.hideMentionAutocomplete();

		// Check if input starts with /
		if (value.startsWith("/")) {
			const commands = getAvailableCommands(
				this.plugin.settings.customCommands,
				this.plugin.settings.disabledBuiltinCommands,
				this.plugin.settings.language
			);

			// Extract command part (before any space)
			const commandPart = value.split(" ")[0] ?? "/";
			this.filteredCommands = filterCommands(commands, commandPart);

			// Hide /model command if session has started (model is locked)
			if (this.sessionStarted) {
				this.filteredCommands = this.filteredCommands.filter(cmd => cmd.command !== "/model");
			}

			if (this.filteredCommands.length > 0) {
				this.showAutocomplete();
			} else {
				this.hideAutocomplete();
			}
		} else {
			// Don't hide if difficulty autocomplete is visible
			if (!this.difficultyAutocompleteVisible) {
				this.hideAutocomplete();
			}
		}
	}

	private showAutocomplete(): void {
		if (!this.autocompleteEl) return;

		this.autocompleteEl.empty();
		this.autocompleteVisible = true;
		this.selectedCommandIndex = 0;

		for (const cmd of this.filteredCommands) {
			const item = this.autocompleteEl.createDiv({
				cls: "cristal-autocomplete-item"
			});

			const iconEl = item.createSpan({ cls: "cristal-autocomplete-icon" });
			setIcon(iconEl, cmd.icon);

			const textEl = item.createDiv({ cls: "cristal-autocomplete-text" });
			textEl.createSpan({ cls: "cristal-autocomplete-name", text: cmd.command });
			textEl.createSpan({ cls: "cristal-autocomplete-desc", text: cmd.description });

			const index = this.filteredCommands.indexOf(cmd);
			item.addEventListener("click", () => this.selectCommand(index));
			item.addEventListener("mouseenter", () => this.highlightCommand(index));
		}

		// Highlight first item
		const firstItem = this.autocompleteEl.querySelector(".cristal-autocomplete-item");
		if (firstItem) {
			firstItem.addClass("cristal-autocomplete-item-selected");
		}

		this.autocompleteEl.addClass("cristal-autocomplete-visible");
	}

	private hideAutocomplete(): void {
		if (!this.autocompleteEl) return;

		this.autocompleteVisible = false;
		this.autocompleteEl.removeClass("cristal-autocomplete-visible");
		this.autocompleteEl.empty();
	}

	private highlightCommand(index: number): void {
		if (!this.autocompleteEl) return;

		const items = this.autocompleteEl.querySelectorAll(".cristal-autocomplete-item");
		items.forEach((item, i) => {
			if (i === index) {
				item.addClass("cristal-autocomplete-item-selected");
			} else {
				item.removeClass("cristal-autocomplete-item-selected");
			}
		});
		this.selectedCommandIndex = index;
	}

	private selectNextCommand(): void {
		const nextIndex = (this.selectedCommandIndex + 1) % this.filteredCommands.length;
		this.highlightCommand(nextIndex);
		this.scrollAutocompleteToSelected();
	}

	private selectPrevCommand(): void {
		const prevIndex = this.selectedCommandIndex === 0
			? this.filteredCommands.length - 1
			: this.selectedCommandIndex - 1;
		this.highlightCommand(prevIndex);
		this.scrollAutocompleteToSelected();
	}

	private scrollAutocompleteToSelected(): void {
		if (!this.autocompleteEl) return;

		const selected = this.autocompleteEl.querySelector(".cristal-autocomplete-item-selected");
		if (selected) {
			selected.scrollIntoView({ block: "nearest" });
		}
	}

	private selectCommand(index: number): void {
		const command = this.filteredCommands[index];
		if (!command) return;

		// Special handling for /difficulty command
		if (command.command === "/difficulty") {
			this.inputEl.value = "";
			this.hideAutocomplete();
			this.showDifficultyAutocomplete();
			return;
		}

		// Check if command needs an argument
		const needsArg = command.prompt.includes("{arg}");
		if (needsArg) {
			// Set input to command + space for user to type argument
			this.inputEl.value = command.command + " ";
			this.hideAutocomplete();
			this.inputEl.focus();

			// Move cursor to end
			this.inputEl.selectionStart = this.inputEl.value.length;
			this.inputEl.selectionEnd = this.inputEl.value.length;
		} else {
			// Auto-send command that doesn't need arguments
			this.inputEl.value = command.command;
			this.hideAutocomplete();
			this.sendMessage();
		}
	}

	private processSlashCommand(input: string): string | null {
		const parsed = parseCommand(input);
		if (!parsed) return null;

		const commands = getAvailableCommands(
			this.plugin.settings.customCommands,
			this.plugin.settings.disabledBuiltinCommands,
			this.plugin.settings.language
		);

		const command = commands.find(cmd => cmd.command === parsed.command);
		if (!command) return null;

		return buildCommandPrompt(command, parsed.arg);
	}

	// =========================================================================
	// @ Mention Autocomplete
	// =========================================================================

	private searchFiles(query: string): TFile[] {
		const files = this.app.vault.getMarkdownFiles();
		const lowerQuery = query.toLowerCase();
		return files
			.filter(f => f.basename.toLowerCase().includes(lowerQuery))
			.sort((a, b) => {
				// Prioritize files that start with the query
				const aStarts = a.basename.toLowerCase().startsWith(lowerQuery);
				const bStarts = b.basename.toLowerCase().startsWith(lowerQuery);
				if (aStarts && !bStarts) return -1;
				if (!aStarts && bStarts) return 1;
				return a.basename.localeCompare(b.basename);
			})
			.slice(0, 10);
	}

	private showMentionAutocomplete(query: string): void {
		if (!this.mentionAutocompleteEl) return;

		this.filteredFiles = this.searchFiles(query);
		if (this.filteredFiles.length === 0) {
			this.hideMentionAutocomplete();
			return;
		}

		this.mentionAutocompleteEl.empty();
		this.mentionAutocompleteVisible = true;
		this.selectedFileIndex = 0;

		for (const file of this.filteredFiles) {
			const item = this.mentionAutocompleteEl.createDiv({
				cls: "cristal-autocomplete-item"
			});

			const iconEl = item.createSpan({ cls: "cristal-autocomplete-icon" });
			setIcon(iconEl, "file-text");

			const textEl = item.createDiv({ cls: "cristal-autocomplete-text" });
			textEl.createSpan({ cls: "cristal-autocomplete-name", text: file.basename });
			textEl.createSpan({ cls: "cristal-autocomplete-desc", text: file.path });

			const index = this.filteredFiles.indexOf(file);
			item.addEventListener("click", () => this.selectFile(index));
			item.addEventListener("mouseenter", () => this.highlightFile(index));
		}

		// Highlight first item
		const firstItem = this.mentionAutocompleteEl.querySelector(".cristal-autocomplete-item");
		if (firstItem) {
			firstItem.addClass("cristal-autocomplete-item-selected");
		}

		this.mentionAutocompleteEl.addClass("cristal-autocomplete-visible");
	}

	private hideMentionAutocomplete(): void {
		if (!this.mentionAutocompleteEl) return;

		this.mentionAutocompleteVisible = false;
		this.mentionAutocompleteEl.removeClass("cristal-autocomplete-visible");
		this.mentionAutocompleteEl.empty();
		this.mentionStartIndex = -1;
	}

	private highlightFile(index: number): void {
		if (!this.mentionAutocompleteEl) return;

		const items = this.mentionAutocompleteEl.querySelectorAll(".cristal-autocomplete-item");
		items.forEach((item, i) => {
			if (i === index) {
				item.addClass("cristal-autocomplete-item-selected");
			} else {
				item.removeClass("cristal-autocomplete-item-selected");
			}
		});
		this.selectedFileIndex = index;
	}

	private selectNextFile(): void {
		const nextIndex = (this.selectedFileIndex + 1) % this.filteredFiles.length;
		this.highlightFile(nextIndex);
		this.scrollMentionAutocompleteToSelected();
	}

	private selectPrevFile(): void {
		const prevIndex = this.selectedFileIndex === 0
			? this.filteredFiles.length - 1
			: this.selectedFileIndex - 1;
		this.highlightFile(prevIndex);
		this.scrollMentionAutocompleteToSelected();
	}

	private scrollMentionAutocompleteToSelected(): void {
		if (!this.mentionAutocompleteEl) return;

		const selected = this.mentionAutocompleteEl.querySelector(".cristal-autocomplete-item-selected");
		if (selected) {
			selected.scrollIntoView({ block: "nearest" });
		}
	}

	private selectFile(index: number): void {
		const file = this.filteredFiles[index];
		if (!file || this.mentionStartIndex === -1) return;

		// Replace @query with @filename
		const text = this.inputEl.value;
		const before = text.slice(0, this.mentionStartIndex);
		const cursorPos = this.inputEl.selectionStart ?? text.length;
		const after = text.slice(cursorPos);

		this.inputEl.value = before + "@" + file.basename + " " + after;

		// Add to mentioned files if not already there
		if (!this.mentionedFiles.find(f => f.path === file.path)) {
			this.mentionedFiles.push(file);
		}

		this.hideMentionAutocomplete();
		this.inputEl.focus();

		// Move cursor after the inserted mention
		const newCursorPos = before.length + 1 + file.basename.length + 1;
		this.inputEl.selectionStart = newCursorPos;
		this.inputEl.selectionEnd = newCursorPos;
	}

	private async getMentionedFilesContext(): Promise<string> {
		const contexts: string[] = [];

		for (const file of this.mentionedFiles) {
			try {
				const content = await this.app.vault.read(file);
				contexts.push(`[File: ${file.basename}]\n${content}`);
			} catch {
				// File might have been deleted
			}
		}

		return contexts.join("\n\n---\n\n");
	}

	private clearMentionedFiles(): void {
		this.mentionedFiles = [];
	}

	private async createNewPageWithContent(content: string, btn: HTMLElement, locale: ButtonLocale): Promise<void> {
		// Generate default filename: "Ответ агента, YYYY-MM-DD HH:mm"
		const now = new Date();
		const dateStr = now.toLocaleString(this.plugin.settings.language === "ru" ? "ru-RU" : "en-US", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		}).replace(/[/:]/g, "-");
		const defaultName = `${locale.agentResponse}, ${dateStr}`;

		// Show modal to get filename
		new FileNameModal(this.app, defaultName, locale.createNewPage, async (filename) => {
			if (!filename) return;

			// Ensure .md extension
			const finalName = filename.endsWith(".md") ? filename : filename + ".md";

			try {
				// Create file in vault root
				const file = await this.app.vault.create(finalName, content);

				// Open the created file
				await this.app.workspace.getLeaf(false).openFile(file);

				// Show success feedback
				btn.empty();
				setIcon(btn, "check");
				btn.setAttribute("title", locale.newPageSuccess);
				btn.addClass("cristal-action-btn-success");

				setTimeout(() => {
					btn.empty();
					setIcon(btn, "file-plus-2");
					btn.setAttribute("title", locale.newPage);
					btn.removeClass("cristal-action-btn-success");
				}, 2000);
			} catch (err) {
				console.error("Failed to create new page:", err);
			}
		}).open();
	}

	private async handleFileAttachment(file: File): Promise<void> {
		const locale = getButtonLocale(this.plugin.settings.language);

		try {
			const maxSize = 10 * 1024 * 1024; // 10MB
			if (file.size > maxSize) {
				this.addErrorMessage(`${locale.fileTooLarge || "File too large"}: ${file.name}`);
				return;
			}

			const ext = file.name.split(".").pop()?.toLowerCase() || "";
			const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
			const isText = ["md", "txt", "json", "yaml", "yml", "js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "h", "go", "rs", "rb", "php", "html", "css", "xml", "csv"].includes(ext);
			const isBinary = ["pdf", "xlsx", "docx"].includes(ext);

			let content = "";

			if (isImage) {
				const reader = new FileReader();
				content = await new Promise<string>((resolve, reject) => {
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(file);
				});
			} else if (isText) {
				const reader = new FileReader();
				content = await new Promise<string>((resolve, reject) => {
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsText(file);
				});
			} else if (isBinary) {
				content = `[Binary file: ${file.name}]`;
			} else {
				this.addErrorMessage(`${locale.unsupportedFileType || "Unsupported file type"}: ${ext}`);
				return;
			}

			this.attachedFiles.push({ name: file.name, content, type: ext });
			this.updateFileContextIndicator();

		} catch (err) {
			console.error("Failed to attach file:", err);
			this.addErrorMessage(`${locale.fileAttachError || "Failed to attach file"}: ${file.name}`);
		}
	}

	private getFileBasename(filename: string): string {
		return filename.replace(/\.[^/.]+$/, "");
	}

	private getFileIcon(type: string): string {
		const imageTypes = ["png", "jpg", "jpeg", "gif", "webp"];
		const codeTypes = ["js", "ts", "tsx", "jsx", "py", "java", "cpp", "c", "h", "go", "rs", "rb", "php"];
		const docTypes = ["md", "txt", "pdf", "docx"];
		const configTypes = ["json", "yaml", "yml", "xml"];

		if (imageTypes.includes(type)) return "image";
		if (codeTypes.includes(type)) return "code";
		if (docTypes.includes(type)) return "file-text";
		if (configTypes.includes(type)) return "settings";
		return "file";
	}

	private removeAttachedFile(fileName: string): void {
		this.attachedFiles = this.attachedFiles.filter(f => f.name !== fileName);
		this.updateFileContextIndicator();
	}

	private clearAttachedFiles(): void {
		this.attachedFiles = [];
		this.updateFileContextIndicator();
	}

	// ============================================================================
	// User Message Actions (Copy, Edit)
	// ============================================================================

	private addUserMessageActions(messageEl: HTMLElement, content: string, messageId: string): void {
		const locale = getButtonLocale(this.plugin.settings.language);
		const actionsEl = messageEl.createDiv({ cls: "cristal-message-actions" });

		// Copy button
		const copyBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon",
			attr: { "aria-label": locale.copy, "title": locale.copy }
		});
		setIcon(copyBtn, "copy");
		copyBtn.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(content);
				copyBtn.empty();
				setIcon(copyBtn, "check");
				copyBtn.setAttribute("title", locale.copySuccess);
				copyBtn.addClass("cristal-action-btn-success");
				setTimeout(() => {
					copyBtn.empty();
					setIcon(copyBtn, "copy");
					copyBtn.setAttribute("title", locale.copy);
					copyBtn.removeClass("cristal-action-btn-success");
				}, 2000);
			} catch (err) {
				console.error("Failed to copy:", err);
			}
		});

		// Edit button
		const editBtn = actionsEl.createEl("button", {
			cls: "cristal-action-btn-icon",
			attr: { "aria-label": locale.edit, "title": locale.edit }
		});
		setIcon(editBtn, "pencil");
		editBtn.addEventListener("click", () => {
			this.startEditingMessage(messageEl, content, messageId);
		});
	}

	private startEditingMessage(messageEl: HTMLElement, content: string, messageId: string): void {
		// Cancel any existing editing
		if (this.editingMessageId) {
			this.cancelEditing();
		}
		this.editingMessageId = messageId;

		const locale = getButtonLocale(this.plugin.settings.language);
		const contentEl = messageEl.querySelector(".cristal-message-content") as HTMLElement;
		const actionsEl = messageEl.querySelector(".cristal-message-actions") as HTMLElement;

		if (!contentEl || !actionsEl) return;

		// Hide original content and actions
		contentEl.style.display = "none";
		actionsEl.style.display = "none";

		// Create edit container
		const editContainer = messageEl.createDiv({ cls: "cristal-edit-container" });
		editContainer.dataset.editContainer = "true";

		const textarea = editContainer.createEl("textarea", {
			cls: "cristal-edit-textarea"
		});
		textarea.value = content;

		// Auto-resize
		textarea.style.height = "auto";
		textarea.style.height = textarea.scrollHeight + "px";
		textarea.addEventListener("input", () => {
			textarea.style.height = "auto";
			textarea.style.height = textarea.scrollHeight + "px";
		});

		// Action buttons
		const editActionsEl = editContainer.createDiv({ cls: "cristal-edit-actions" });

		const cancelBtn = editActionsEl.createEl("button", {
			cls: "cristal-edit-cancel-btn",
			text: locale.cancelEdit
		});
		cancelBtn.addEventListener("click", () => this.cancelEditing());

		const submitBtn = editActionsEl.createEl("button", {
			cls: "cristal-edit-submit-btn mod-cta",
			text: locale.resend
		});
		submitBtn.addEventListener("click", () => {
			this.submitEditedMessage(messageEl, textarea.value, messageId);
		});

		// Focus textarea
		textarea.focus();
		textarea.setSelectionRange(textarea.value.length, textarea.value.length);
	}

	private cancelEditing(): void {
		if (!this.editingMessageId) return;

		const messageEl = this.messagesContainer.querySelector(`[data-id="${this.editingMessageId}"]`) as HTMLElement;
		if (messageEl) {
			// Remove edit container
			const editContainer = messageEl.querySelector("[data-edit-container]");
			if (editContainer) editContainer.remove();

			// Show original content and actions
			const contentEl = messageEl.querySelector(".cristal-message-content") as HTMLElement;
			const actionsEl = messageEl.querySelector(".cristal-message-actions") as HTMLElement;
			if (contentEl) contentEl.style.display = "block";
			if (actionsEl) actionsEl.style.display = "flex";
		}

		this.editingMessageId = null;
	}

	private async submitEditedMessage(messageEl: HTMLElement, newContent: string, messageId: string): Promise<void> {
		const trimmedContent = newContent.trim();
		if (!trimmedContent) {
			this.cancelEditing();
			return;
		}

		// 1. Stop generation if in progress
		if (this.isGenerating) {
			const currentSession = this.plugin.getCurrentSession();
			if (currentSession) {
				const service = this.plugin.getActiveService(this.currentProvider);
				service.abort(currentSession.id);
			}
		}

		// 2. Remove all messages after the edited one
		const allMessages = Array.from(this.messagesContainer.querySelectorAll(".cristal-message"));
		const currentIndex = allMessages.findIndex(el => el.getAttribute("data-id") === messageId);

		if (currentIndex !== -1) {
			for (let i = allMessages.length - 1; i > currentIndex; i--) {
				const msg = allMessages[i];
				if (msg) msg.remove();
			}
		}

		// Also remove thinking blocks after edited message
		const thinkingBlocks = this.messagesContainer.querySelectorAll(".cristal-thinking-block");
		thinkingBlocks.forEach(block => {
			if (block.compareDocumentPosition(messageEl) & Node.DOCUMENT_POSITION_PRECEDING) {
				block.remove();
			}
		});

		// 3. Update UI
		this.cancelEditing();
		const contentEl = messageEl.querySelector(".cristal-message-content") as HTMLElement;
		if (contentEl) {
			contentEl.setText(trimmedContent);
		}

		// 4. Update messages array
		const msgIndex = this.messages.findIndex(m => m.id === messageId);
		if (msgIndex !== -1) {
			const msgToUpdate = this.messages[msgIndex];
			if (msgToUpdate) {
				msgToUpdate.content = trimmedContent;
				this.messages = this.messages.slice(0, msgIndex + 1);
			}
		}

		// 5. Save session
		this.saveCurrentSession();

		// 6. Set input and send
		this.inputEl.value = trimmedContent;
		await this.sendMessage();
	}
}

/**
 * Modal for entering filename when creating new page
 */
class FileNameModal extends Modal {
	private defaultName: string;
	private title: string;
	private onSubmit: (result: string | null) => void;
	private inputEl!: TextComponent;

	constructor(app: import("obsidian").App, defaultName: string, title: string, onSubmit: (result: string | null) => void) {
		super(app);
		this.defaultName = defaultName;
		this.title = title;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("cristal-filename-modal");

		contentEl.createEl("h3", { text: this.title });

		const inputContainer = contentEl.createDiv({ cls: "cristal-filename-input-container" });
		this.inputEl = new TextComponent(inputContainer);
		this.inputEl.inputEl.addClass("cristal-filename-input");
		this.inputEl.setValue(this.defaultName);
		this.inputEl.inputEl.select();

		// Handle Enter key
		this.inputEl.inputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.submit();
			}
		});

		const buttonContainer = contentEl.createDiv({ cls: "cristal-modal-buttons" });

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.onSubmit(null);
			this.close();
		});

		const createBtn = buttonContainer.createEl("button", {
			text: "Create",
			cls: "mod-cta"
		});
		createBtn.addEventListener("click", () => this.submit());

		// Focus input after modal opens
		setTimeout(() => this.inputEl.inputEl.focus(), 50);
	}

	private submit(): void {
		const value = this.inputEl.getValue().trim();
		if (value) {
			this.onSubmit(value);
		}
		this.close();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
