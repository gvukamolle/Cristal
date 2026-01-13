import { App, PluginSettingTab, Setting, Modal, TextComponent, setIcon } from "obsidian";
import type CristalPlugin from "./main";
import type { SlashCommand, LanguageCode, ClaudeModel, AgentConfig, CLIType, ClaudePermissions } from "./types";
import { CLAUDE_MODELS, CODEX_MODELS, CLI_INFO } from "./types";
import { getBuiltinCommands } from "./commands";
import { LANGUAGE_NAMES } from "./systemPrompts";
import { checkCLIInstalled, checkCodexInstalled, detectCLIPath, detectCodexCLIPath } from "./cliDetector";
import { setCodexReasoningLevel } from "./codexConfig";
import { getSettingsLocale, type SettingsLocale } from "./settingsLocales";

export class CristalSettingTab extends PluginSettingTab {
	plugin: CristalPlugin;
	private locale!: SettingsLocale;

	constructor(app: App, plugin: CristalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Update locale on each render
		this.locale = getSettingsLocale(this.plugin.settings.language);

		// 1. Usage Statistics
		this.displayUsageSection(containerEl);

		// 2. Language selection
		new Setting(containerEl)
			.setName(this.locale.assistantLanguage)
			.setDesc(this.locale.assistantLanguageDesc)
			.addDropdown(dropdown => {
				for (const [code, name] of Object.entries(LANGUAGE_NAMES)) {
					dropdown.addOption(code, name);
				}
				dropdown
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as LanguageCode;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 3. Cristal Agents section
		this.displayAgentsSection(containerEl);

		// 4. Default Agent selection
		this.displayDefaultAgentSection(containerEl);

		// 5. Slash Commands section
		this.displaySlashCommandsSection(containerEl);

		// Note: Getting Started section moved to AgentSettingsModal
	}

	private displayUsageSection(containerEl: HTMLElement): void {
		const usageSection = containerEl.createDiv({ cls: "cristal-usage-section" });
		usageSection.createEl("h3", { text: this.locale.usageStatistics });

		// Calculate stats from plugin sessions
		const stats = this.calculateUsageStats();

		// Inline compact format
		const inline = usageSection.createDiv({ cls: "cristal-stats-inline" });
		this.createStatInline(inline, this.locale.today, this.formatTokens(stats.todayTokens));
		this.createStatInline(inline, this.locale.week, this.formatTokens(stats.weekTokens));
		this.createStatInline(inline, this.locale.month, this.formatTokens(stats.monthTokens));

		// Account limits section
		this.displayAccountLimitsSection(usageSection);
	}

	private displayAccountLimitsSection(containerEl: HTMLElement): void {
		const limitsSection = containerEl.createDiv({ cls: "cristal-account-limits" });
		limitsSection.createEl("h4", { text: this.locale.accountLimits });

		// Container for limits data
		const limitsContainer = limitsSection.createDiv({ cls: "cristal-limits-data" });

		// Check limits button
		const btnContainer = limitsSection.createDiv({ cls: "cristal-limits-btn-container" });
		const checkBtn = btnContainer.createEl("button", {
			text: this.locale.checkLimits,
			cls: "cristal-check-limits-btn"
		});
		setIcon(checkBtn.createSpan({ cls: "cristal-btn-icon-left" }), "refresh-cw");

		checkBtn.addEventListener("click", async () => {
			await this.loadAccountLimits(limitsContainer);
		});
	}

	private async loadAccountLimits(container: HTMLElement): Promise<void> {
		container.empty();
		container.createEl("span", { cls: "cristal-limits-loading", text: this.locale.loadingLimits });

		const { UsageLimitsService } = await import("./UsageLimitsService");
		const service = new UsageLimitsService();

		container.empty();

		// Claude limits
		const claudeAgent = this.plugin.getAgentByCliType("claude");
		if (claudeAgent?.enabled) {
			const claudeLimits = await service.fetchClaudeUsage();
			this.renderClaudeLimits(container, claudeLimits);
		}

		// Codex limits (parsed from session files)
		const codexAgent = this.plugin.getAgentByCliType("codex");
		if (codexAgent?.enabled) {
			const codexLimits = await service.fetchCodexUsage();
			this.renderCodexLimits(container, codexLimits);
		}

		// If no agents enabled
		if (!claudeAgent?.enabled && !codexAgent?.enabled) {
			container.createEl("span", {
				cls: "cristal-limits-note",
				text: "No agents enabled"
			});
		}
	}

	private renderClaudeLimits(container: HTMLElement, limits: import("./UsageLimitsService").ClaudeUsageLimits): void {
		container.empty();

		if (limits.error) {
			const errorEl = container.createDiv({ cls: "cristal-limits-error" });
			if (limits.error === "not_authenticated") {
				errorEl.createEl("span", { text: this.locale.notAuthenticated });
				errorEl.createEl("br");
				errorEl.createEl("span", { cls: "cristal-limits-note", text: this.locale.notAuthenticatedDesc });
			} else {
				errorEl.createEl("span", { text: this.locale.limitsError });
			}
			return;
		}

		const claudeSection = container.createDiv({ cls: "cristal-agent-limits" });
		claudeSection.createEl("strong", { text: "Claude Code" });

		// 5-hour limit (API returns 0-100 percentage)
		this.createProgressBar(
			claudeSection,
			this.locale.fiveHourLimit,
			limits.fiveHour.utilization,
			limits.fiveHour.resetsAt
		);

		// Weekly limit
		this.createProgressBar(
			claudeSection,
			this.locale.weeklyLimit,
			limits.sevenDay.utilization,
			limits.sevenDay.resetsAt
		);

		// Opus limit (if present)
		if (limits.sevenDayOpus && limits.sevenDayOpus.utilization > 0) {
			this.createProgressBar(
				claudeSection,
				this.locale.opusLimit,
				limits.sevenDayOpus.utilization,
				limits.sevenDayOpus.resetsAt
			);
		}

		// Sonnet limit (if present)
		if (limits.sevenDaySonnet && limits.sevenDaySonnet.utilization > 0) {
			this.createProgressBar(
				claudeSection,
				this.locale.sonnetLimit,
				limits.sevenDaySonnet.utilization,
				limits.sevenDaySonnet.resetsAt
			);
		}
	}

	private renderCodexLimits(container: HTMLElement, limits: import("./UsageLimitsService").CodexUsageLimits): void {
		if (limits.error) {
			const errorEl = container.createDiv({ cls: "cristal-limits-error" });
			if (limits.error === "not_authenticated" || limits.error === "no_sessions") {
				errorEl.createEl("span", { text: this.locale.notAuthenticated });
				errorEl.createEl("br");
				errorEl.createEl("span", { cls: "cristal-limits-note", text: this.locale.notAuthenticatedDesc });
			} else {
				errorEl.createEl("span", { text: this.locale.limitsError });
			}
			return;
		}

		const codexSection = container.createDiv({ cls: "cristal-agent-limits" });
		codexSection.createEl("strong", { text: "Codex" });

		// 5-hour limit
		this.createProgressBar(
			codexSection,
			this.locale.fiveHourLimit,
			limits.fiveHour.utilization,
			limits.fiveHour.resetsAt
		);

		// Weekly limit
		this.createProgressBar(
			codexSection,
			this.locale.weeklyLimit,
			limits.sevenDay.utilization,
			limits.sevenDay.resetsAt
		);
	}

	private createProgressBar(
		container: HTMLElement,
		label: string,
		percent: number,
		resetsAt: string | null,
		showLeft: boolean = false
	): void {
		const row = container.createDiv({ cls: "cristal-progress-row" });

		// Top line: label + percent
		const topLine = row.createDiv({ cls: "cristal-progress-top" });
		topLine.createDiv({ cls: "cristal-progress-label", text: label });
		const percentText = showLeft ? `${Math.round(100 - percent)}% ${this.locale.left}` : `${Math.round(percent)}% ${this.locale.used}`;
		topLine.createDiv({ cls: "cristal-progress-percent", text: percentText });

		// Progress bar
		const barContainer = row.createDiv({ cls: "cristal-progress-bar" });
		const fill = barContainer.createDiv({ cls: "cristal-progress-fill" });
		fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;

		// Color based on usage
		if (percent >= 90) {
			fill.addClass("cristal-progress-danger");
		} else if (percent >= 70) {
			fill.addClass("cristal-progress-warning");
		}

		// Reset time
		if (resetsAt) {
			const resetText = this.formatResetTime(resetsAt);
			row.createDiv({ cls: "cristal-progress-reset", text: resetText });
		}
	}

	private formatResetTime(isoString: string): string {
		try {
			const date = new Date(isoString);
			if (isNaN(date.getTime())) {
				// Not a valid ISO date, return as-is (e.g., "18:00" from Codex)
				return `${this.locale.resetsAt} ${isoString}`;
			}

			// Format absolute date/time
			const absTime = date.toLocaleString([], {
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit"
			});

			// Calculate time remaining
			const now = new Date();
			const diffMs = date.getTime() - now.getTime();

			if (diffMs <= 0) {
				return `${this.locale.resetsAt} ${absTime}`;
			}

			const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
			const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

			// Build relative time string
			let relTime = this.locale.resetsIn + " ";
			if (days > 0) {
				relTime += `${days}${this.locale.days} ${hours}${this.locale.hours}`;
			} else if (hours > 0) {
				relTime += `${hours}${this.locale.hours} ${minutes}${this.locale.minutes}`;
			} else {
				relTime += `${minutes}${this.locale.minutes}`;
			}

			// Return both: "через 3д 10ч (15 янв. 22:00)"
			return `${relTime} (${absTime})`;
		} catch {
			return `${this.locale.resetsAt} ${isoString}`;
		}
	}

	private displayAgentsSection(containerEl: HTMLElement): void {
		// Header with add button
		const headerEl = containerEl.createDiv({ cls: "cristal-agents-header" });
		headerEl.createEl("h3", { text: this.locale.agentsSection || "Cristal Agents" });

		// Add agent button (text)
		const addBtnEl = headerEl.createEl("button", {
			cls: "cristal-add-agent-text-btn",
			text: this.locale.addAgent || "Add agent"
		});

		// Dropdown menu for adding agents
		const dropdownEl = headerEl.createDiv({ cls: "cristal-add-agent-dropdown" });
		dropdownEl.style.display = "none";

		for (const [cliType, info] of Object.entries(CLI_INFO)) {
			const itemEl = dropdownEl.createDiv({ cls: "cristal-add-agent-item" });

			if (!info.available) {
				itemEl.addClass("cristal-add-agent-item-disabled");
				itemEl.createSpan({ text: info.name });
				itemEl.createSpan({ cls: "cristal-coming-soon", text: this.locale.comingSoon || "Coming soon" });
			} else {
				// Check if agent of this type already exists
				const existing = this.plugin.getAgentByCliType(cliType as CLIType);
				if (existing) {
					itemEl.addClass("cristal-add-agent-item-disabled");
					itemEl.createSpan({ text: info.name });
					itemEl.createSpan({ cls: "cristal-already-added", text: this.locale.agentAlreadyExists || "Already added" });
				} else {
					itemEl.createSpan({ text: info.name });
					itemEl.addEventListener("click", async () => {
						await this.addAgent(cliType as CLIType);
						dropdownEl.style.display = "none";
					});
				}
			}
		}

		addBtnEl.addEventListener("click", (e) => {
			e.stopPropagation();
			dropdownEl.style.display = dropdownEl.style.display === "none" ? "block" : "none";
		});

		document.addEventListener("click", () => {
			dropdownEl.style.display = "none";
		});

		// Agent cards
		const cardsContainer = containerEl.createDiv({ cls: "cristal-agents-cards" });

		for (const agent of this.plugin.settings.agents) {
			this.renderAgentCard(cardsContainer, agent);
		}
	}

	private renderAgentCard(container: HTMLElement, agent: AgentConfig): void {
		const cardEl = container.createDiv({ cls: "cristal-agent-card" });
		if (!agent.enabled) {
			cardEl.addClass("cristal-agent-card-disabled");
		}

		// Header: [icon] [name + edit] ... [toggle] [settings]
		const headerEl = cardEl.createDiv({ cls: "cristal-agent-card-header" });

		// Icon based on CLI type
		const iconEl = headerEl.createSpan({ cls: "cristal-agent-card-icon" });
		setIcon(iconEl, agent.cliType === "claude" ? "sparkles" : "code");

		// Name wrapper (text + edit button OR input + save button)
		const nameWrapper = headerEl.createDiv({ cls: "cristal-agent-card-name-wrapper" });

		// Display mode elements
		const nameTextEl = nameWrapper.createSpan({ cls: "cristal-agent-card-name-text", text: agent.name });
		const editBtn = nameWrapper.createEl("button", { cls: "cristal-agent-card-edit-btn" });
		setIcon(editBtn, "pencil");

		// Edit mode elements (hidden by default)
		const nameInputEl = nameWrapper.createEl("input", {
			cls: "cristal-agent-card-name-input",
			attr: { type: "text", value: agent.name }
		});
		nameInputEl.style.display = "none";

		const saveBtn = nameWrapper.createEl("button", { cls: "cristal-agent-card-save-btn" });
		setIcon(saveBtn, "check");
		saveBtn.style.display = "none";

		// Edit button click - switch to edit mode
		editBtn.addEventListener("click", () => {
			nameTextEl.style.display = "none";
			editBtn.style.display = "none";
			nameInputEl.style.display = "block";
			nameInputEl.value = agent.name;
			saveBtn.style.display = "flex";
			nameInputEl.focus();
			nameInputEl.select();
		});

		// Save button click - save and switch back to display mode
		const saveName = async () => {
			const newName = nameInputEl.value.trim() || CLI_INFO[agent.cliType].name;
			agent.name = newName;
			await this.plugin.saveSettings();
			nameTextEl.setText(newName);
			nameTextEl.style.display = "inline";
			editBtn.style.display = "flex";
			nameInputEl.style.display = "none";
			saveBtn.style.display = "none";
		};

		saveBtn.addEventListener("click", saveName);
		nameInputEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				saveName();
			} else if (e.key === "Escape") {
				nameTextEl.style.display = "inline";
				editBtn.style.display = "flex";
				nameInputEl.style.display = "none";
				saveBtn.style.display = "none";
			}
		});

		// Right section: toggle + settings button
		const rightSection = headerEl.createDiv({ cls: "cristal-agent-card-right" });

		// Enable toggle
		const toggleContainer = rightSection.createDiv({ cls: "cristal-agent-card-toggle" });
		const toggle = toggleContainer.createEl("input", { attr: { type: "checkbox" } });
		toggle.checked = agent.enabled;
		toggle.addEventListener("change", async () => {
			agent.enabled = toggle.checked;
			await this.plugin.saveSettings();
			this.display();
		});

		// Settings button (text)
		const settingsBtn = rightSection.createEl("button", {
			cls: "cristal-agent-settings-text-btn",
			text: this.locale.settingsButton || "Settings"
		});
		settingsBtn.addEventListener("click", () => {
			new AgentSettingsModal(this.app, this.plugin, agent, () => this.display()).open();
		});

		// Description below header
		const descEl = cardEl.createDiv({ cls: "cristal-agent-card-desc" });
		descEl.setText(agent.description);
	}

	private async addAgent(cliType: CLIType): Promise<void> {
		const info = CLI_INFO[cliType];
		const newAgent: AgentConfig = {
			id: `${cliType}-${Date.now()}`,
			cliType,
			name: info.name,
			description: info.description,
			enabled: false,
			cliPath: cliType === "claude" ? "claude" : "codex",
			model: cliType === "claude" ? "claude-haiku-4-5-20251001" : "gpt-5.2-codex",
		};

		if (cliType === "claude") {
			newAgent.thinkingEnabled = false;
			newAgent.permissions = { webSearch: false, webFetch: false, task: false };
			// Try to detect CLI path
			const detected = detectCLIPath();
			if (detected.found) {
				newAgent.cliPath = detected.path;
			}
		} else if (cliType === "codex") {
			newAgent.reasoningEnabled = false;
			// Try to detect CLI path
			const detected = detectCodexCLIPath();
			if (detected.found) {
				newAgent.cliPath = detected.path;
			}
		}

		this.plugin.settings.agents.push(newAgent);
		await this.plugin.saveSettings();
		this.display();
	}

	private displayDefaultAgentSection(containerEl: HTMLElement): void {
		const enabledAgents = this.plugin.getEnabledAgents();

		new Setting(containerEl)
			.setName(this.locale.defaultAgent || "Default agent")
			.setDesc(this.locale.defaultAgentDesc || "Which agent to use by default for new chats")
			.addDropdown(dropdown => {
				for (const agent of enabledAgents) {
					dropdown.addOption(agent.id, agent.name);
				}
				dropdown
					.setValue(this.plugin.settings.defaultAgentId || "")
					.onChange(async (value) => {
						this.plugin.settings.defaultAgentId = value;
						await this.plugin.saveSettings();
					});
			});
	}

	private displaySlashCommandsSection(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: this.locale.slashCommands });

		containerEl.createEl("p", {
			cls: "cristal-settings-note",
			text: this.locale.slashCommandsNote
		});

		// Built-in commands
		containerEl.createEl("h4", { text: this.locale.builtinCommands });

		const builtinCommands = getBuiltinCommands(this.plugin.settings.language);
		for (const cmd of builtinCommands) {
			const isDisabled = this.plugin.settings.disabledBuiltinCommands.includes(cmd.id);

			new Setting(containerEl)
				.setName(cmd.command)
				.setDesc(cmd.description)
				.addToggle(toggle => toggle
					.setValue(!isDisabled)
					.onChange(async (value) => {
						if (value) {
							this.plugin.settings.disabledBuiltinCommands =
								this.plugin.settings.disabledBuiltinCommands.filter(id => id !== cmd.id);
						} else {
							this.plugin.settings.disabledBuiltinCommands.push(cmd.id);
						}
						await this.plugin.saveSettings();
					}));
		}

		// Custom commands
		containerEl.createEl("h4", { text: this.locale.customCommands });

		new Setting(containerEl)
			.setName(this.locale.addCustomCommand)
			.setDesc(this.locale.addCustomCommandDesc)
			.addButton(button => button
				.setButtonText(this.locale.addButton)
				.onClick(() => {
					new CommandModal(this.app, this.plugin, null, () => {
						this.display();
					}).open();
				}));

		// Display existing custom commands
		for (const cmd of this.plugin.settings.customCommands) {
			new Setting(containerEl)
				.setName(cmd.command)
				.setDesc(cmd.description)
				.addToggle(toggle => toggle
					.setValue(cmd.enabled !== false)
					.onChange(async (value) => {
						cmd.enabled = value;
						await this.plugin.saveSettings();
					}))
				.addButton(button => button
					.setButtonText(this.locale.editButton)
					.onClick(() => {
						new CommandModal(this.app, this.plugin, cmd, () => {
							this.display();
						}).open();
					}))
				.addButton(button => button
					.setButtonText(this.locale.deleteButton)
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.customCommands =
							this.plugin.settings.customCommands.filter(c => c.id !== cmd.id);
						await this.plugin.saveSettings();
						this.display();
					}));
		}
	}

	private calculateUsageStats(): { todayTokens: number; weekTokens: number; monthTokens: number } {
		const now = new Date();
		const todayStr = now.toISOString().split("T")[0] as string;

		// Week start (Monday)
		const weekStart = new Date(now);
		weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
		weekStart.setHours(0, 0, 0, 0);

		// Month start
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		let todayTokens = 0;
		let weekTokens = 0;
		let monthTokens = 0;

		const tokenHistory = this.plugin.getTokenHistory();

		for (const [dateStr, tokens] of Object.entries(tokenHistory)) {
			const date = new Date(dateStr);

			if (dateStr === todayStr) {
				todayTokens += tokens;
			}
			if (date >= weekStart) {
				weekTokens += tokens;
			}
			if (date >= monthStart) {
				monthTokens += tokens;
			}
		}

		return { todayTokens, weekTokens, monthTokens };
	}

	private createStatInline(container: HTMLElement, label: string, value: string): void {
		const item = container.createDiv({ cls: "cristal-stat-inline" });
		item.createSpan({ cls: "cristal-stat-inline-label", text: label });
		item.createSpan({ cls: "cristal-stat-inline-value", text: value });
	}

	private formatTokens(tokens: number): string {
		if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
		if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
		return String(tokens);
	}
}

/**
 * Modal for agent settings (CLI path, model, permissions, etc.)
 */
class AgentSettingsModal extends Modal {
	private plugin: CristalPlugin;
	private agent: AgentConfig;
	private onSave: () => void;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.plugin.settings.language);
	}

	constructor(app: App, plugin: CristalPlugin, agent: AgentConfig, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.agent = agent;
		this.onSave = onSave;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("cristal-agent-settings-modal");

		contentEl.createEl("h2", { text: `${this.agent.name} ${this.locale.agentSettingsTitle || "Settings"}` });

		// CLI Path (different labels for Claude vs Codex)
		const cliPathSetting = new Setting(contentEl)
			.setName(this.agent.cliType === "codex" ? this.locale.codexCliPath : this.locale.cliPath)
			.setDesc(this.agent.cliType === "codex" ? this.locale.codexCliPathDesc : this.locale.cliPathDesc)
			.addText(text => text
				.setPlaceholder(this.agent.cliType === "claude" ? "claude" : "codex")
				.setValue(this.agent.cliPath)
				.onChange(async (value) => {
					this.agent.cliPath = value || (this.agent.cliType === "claude" ? "claude" : "codex");
					await this.plugin.saveSettings();
					this.checkAndDisplayCLIStatus(cliStatusEl);
				}))
			.addButton(button => button
				.setButtonText("Detect")
				.onClick(async () => {
					const detected = this.agent.cliType === "claude" ? detectCLIPath() : detectCodexCLIPath();
					if (detected.found) {
						this.agent.cliPath = detected.path;
						await this.plugin.saveSettings();
						// Refresh modal
						this.onOpen();
					}
				}));

		// CLI Status indicator
		const cliStatusEl = contentEl.createDiv({ cls: "cristal-cli-status" });
		this.checkAndDisplayCLIStatus(cliStatusEl);

		// System Instructions (CLAUDE.md for Claude, AGENT.md for Codex)
		new Setting(contentEl)
			.setName(this.agent.cliType === "codex" ? this.locale.codexSystemInstructions : this.locale.systemInstructions)
			.setDesc(this.agent.cliType === "codex" ? this.locale.codexSystemInstructionsDesc : this.locale.systemInstructionsDesc)
			.addButton(button => button
				.setButtonText(this.locale.editButton)
				.onClick(() => {
					const agentType = this.agent.cliType === "claude" ? "claude" : "codex";
					new AgentMdModal(this.app, this.plugin, agentType as "claude" | "codex").open();
				}));

		// Model selection (no /model mention - feature removed)
		const allModels = this.agent.cliType === "claude" ? CLAUDE_MODELS : CODEX_MODELS;
		const disabledModels = this.agent.disabledModels || [];
		const enabledModels = allModels.filter(m => !disabledModels.includes(m.value));

		new Setting(contentEl)
			.setName(this.locale.defaultModel)
			.setDesc(this.locale.defaultModelDescNoSlash)
			.addDropdown(dropdown => {
				for (const model of enabledModels) {
					dropdown.addOption(model.value, model.label);
				}
				// If current model is disabled, select first enabled
				const currentModelEnabled = enabledModels.some(m => m.value === this.agent.model);
				if (!currentModelEnabled && enabledModels.length > 0) {
					const firstEnabled = enabledModels[0];
					if (firstEnabled) {
						this.agent.model = firstEnabled.value;
						this.plugin.saveSettings();
					}
				}
				dropdown
					.setValue(this.agent.model)
					.onChange(async (value) => {
						this.agent.model = value as ClaudeModel | string;
						await this.plugin.saveSettings();
					});
			});

		// Available Models section (toggles to disable models)
		contentEl.createEl("h3", { text: this.locale.availableModels || "Available Models" });
		contentEl.createEl("p", {
			cls: "cristal-settings-note",
			text: this.locale.availableModelsDesc || "Disable models you don't want to use"
		});

		for (const model of allModels) {
			const isEnabled = !disabledModels.includes(model.value);
			new Setting(contentEl)
				.setName(model.label)
				.addToggle(toggle => toggle
					.setValue(isEnabled)
					.onChange(async (value) => {
						if (!this.agent.disabledModels) {
							this.agent.disabledModels = [];
						}
						if (value) {
							// Enable model - remove from disabled list
							this.agent.disabledModels = this.agent.disabledModels.filter(m => m !== model.value);
						} else {
							// Disable model - add to disabled list
							if (!this.agent.disabledModels.includes(model.value)) {
								this.agent.disabledModels.push(model.value);
							}
							// If this was the current model, switch to first enabled
							if (this.agent.model === model.value) {
								const remaining = allModels.filter(m => !this.agent.disabledModels!.includes(m.value));
								const firstRemaining = remaining[0];
								if (firstRemaining) {
									this.agent.model = firstRemaining.value;
								}
							}
						}
						await this.plugin.saveSettings();
					}));
		}

		// Claude-specific settings
		if (this.agent.cliType === "claude") {
			// Deep thinking mode
			new Setting(contentEl)
				.setName(this.locale.deepThinking)
				.setDesc(this.locale.deepThinkingDesc)
				.addToggle(toggle => toggle
					.setValue(this.agent.thinkingEnabled || false)
					.onChange(async (value) => {
						this.agent.thinkingEnabled = value;
						await this.plugin.saveSettings();
					}));

			// Permissions section
			contentEl.createEl("h3", { text: this.locale.agentPermissions });

			contentEl.createEl("p", {
				cls: "cristal-settings-note",
				text: this.locale.permissionsNote
			});

			const permissions = this.agent.permissions || { webSearch: false, webFetch: false, task: false };

			new Setting(contentEl)
				.setName(this.locale.webSearch)
				.setDesc(this.locale.webSearchDesc)
				.addToggle(toggle => toggle
					.setValue(permissions.webSearch)
					.onChange(async (value) => {
						if (!this.agent.permissions) {
							this.agent.permissions = { webSearch: false, webFetch: false, task: false };
						}
						this.agent.permissions.webSearch = value;
						await this.plugin.saveSettings();
					}));

			new Setting(contentEl)
				.setName(this.locale.webFetch)
				.setDesc(this.locale.webFetchDesc)
				.addToggle(toggle => toggle
					.setValue(permissions.webFetch)
					.onChange(async (value) => {
						if (!this.agent.permissions) {
							this.agent.permissions = { webSearch: false, webFetch: false, task: false };
						}
						this.agent.permissions.webFetch = value;
						await this.plugin.saveSettings();
					}));

			new Setting(contentEl)
				.setName(this.locale.subAgents)
				.setDesc(this.locale.subAgentsDesc)
				.addToggle(toggle => toggle
					.setValue(permissions.task)
					.onChange(async (value) => {
						if (!this.agent.permissions) {
							this.agent.permissions = { webSearch: false, webFetch: false, task: false };
						}
						this.agent.permissions.task = value;
						await this.plugin.saveSettings();
					}));
		}

		// Codex-specific settings
		if (this.agent.cliType === "codex") {
			// Deep Reasoning (toggle: off = medium, on = xhigh)
			new Setting(contentEl)
				.setName(this.locale.codexDeepReasoning || "Deep reasoning")
				.setDesc(this.locale.codexDeepReasoningDesc || "Enable extra high reasoning for deeper analysis")
				.addToggle(toggle => toggle
					.setValue(this.agent.reasoningEnabled || false)
					.onChange(async (value) => {
						this.agent.reasoningEnabled = value;
						await this.plugin.saveSettings();
						// Write to ~/.codex/config.toml
						setCodexReasoningLevel(value ? "xhigh" : "medium");
					}));
		}

		// Getting Started section (collapsible)
		this.displayGettingStarted(contentEl);

		// Danger Zone - Delete Integration
		contentEl.createEl("h3", {
			text: this.locale.dangerZone || "Danger Zone",
			cls: "cristal-danger-zone-title"
		});

		new Setting(contentEl)
			.setName(this.locale.deleteIntegration || "Delete this integration")
			.setDesc(this.locale.deleteIntegrationDesc || "This will remove the agent from your settings. This action cannot be undone.")
			.addButton(button => button
				.setButtonText(this.locale.deleteButton || "Delete")
				.setWarning()
				.onClick(async () => {
					// Confirmation dialog
					const confirmed = await this.confirmDelete();
					if (!confirmed) return;

					// Remove agent
					this.plugin.settings.agents = this.plugin.settings.agents.filter(
						a => a.id !== this.agent.id
					);

					// Reset default agent if needed
					if (this.plugin.settings.defaultAgentId === this.agent.id) {
						const remaining = this.plugin.settings.agents.find(a => a.enabled);
						this.plugin.settings.defaultAgentId = remaining?.id || null;
					}

					await this.plugin.saveSettings();
					this.close();

					// Refresh settings tab
					const settingsTab = (this.app as any).setting.activeTab;
					if (settingsTab?.display) {
						settingsTab.display();
					}
				}));

		}

	private async checkAndDisplayCLIStatus(container: HTMLElement): Promise<void> {
		container.empty();
		container.createEl("span", {
			cls: "cristal-cli-status-checking",
			text: this.locale.checkingCli
		});

		const status = this.agent.cliType === "claude"
			? await checkCLIInstalled(this.agent.cliPath)
			: await checkCodexInstalled(this.agent.cliPath);

		container.empty();

		if (status.installed) {
			const foundEl = container.createDiv({ cls: "cristal-cli-status-item cristal-cli-status-success" });
			const iconSpan = foundEl.createSpan({ cls: "cristal-cli-status-icon" });
			setIcon(iconSpan, "check-circle");
			foundEl.createSpan({ text: this.locale.cliFound.replace("{version}", status.version || "?") });

			// Open Terminal button for installed CLI
			const terminalBtn = container.createEl("button", {
				text: this.locale.openTerminal || "Open Terminal",
				cls: "mod-cta"
			});
			terminalBtn.style.marginTop = "8px";
			const terminalIcon = terminalBtn.createSpan({ cls: "cristal-btn-icon-left" });
			setIcon(terminalIcon, "terminal");
			terminalBtn.addEventListener("click", async () => {
				this.close();
				const cliCmd = this.agent.cliType === "claude" ? "claude" : "codex";
				await this.plugin.openTerminalWithCommand(cliCmd);
			});
		} else {
			const errorEl = container.createDiv({ cls: "cristal-cli-status-item cristal-cli-status-error" });
			const iconSpan = errorEl.createSpan({ cls: "cristal-cli-status-icon" });
			setIcon(iconSpan, "x-circle");
			errorEl.createSpan({ text: this.locale.cliNotFound });

			// Installation hint - improved formatting
			const installCmd = this.agent.cliType === "claude"
				? "npm i -g @anthropic-ai/claude-code"
				: "npm i -g @openai/codex";

			const installHint = container.createDiv({ cls: "cristal-install-hint" });
			installHint.createEl("p", {
				cls: "cristal-settings-note",
				text: this.locale.installWith + ":"
			});
			installHint.createEl("code", {
				cls: "cristal-install-command",
				text: installCmd
			});

			// Install button
			const installBtn = container.createEl("button", {
				text: this.locale.startIntegration || "Open terminal and install CLI",
				cls: "mod-cta"
			});
			installBtn.style.marginTop = "8px";
			const downloadIcon = installBtn.createSpan({ cls: "cristal-btn-icon-left" });
			setIcon(downloadIcon, "download");
			installBtn.addEventListener("click", async () => {
				this.close();
				await this.plugin.openTerminalWithCommand(installCmd);
			});
		}

		// Refresh button (secondary style)
		const refreshBtn = container.createEl("button", {
			text: this.locale.refreshButton,
			cls: "cristal-cli-refresh-btn"
		});
		refreshBtn.style.marginTop = "8px";
		refreshBtn.style.marginLeft = "8px";
		refreshBtn.addEventListener("click", () => {
			this.checkAndDisplayCLIStatus(container);
		});
	}

	private displayGettingStarted(container: HTMLElement): void {
		// Collapsible header
		const headerEl = container.createDiv({ cls: "cristal-getting-started-header" });
		const chevronEl = headerEl.createSpan({ cls: "cristal-getting-started-chevron" });
		setIcon(chevronEl, "chevron-right");
		headerEl.createEl("h3", { text: this.locale.gettingStarted });

		// Content container (collapsed by default in modal)
		const contentEl = container.createDiv({ cls: "cristal-getting-started-content" });
		contentEl.style.display = "none";

		// Toggle on header click
		headerEl.addEventListener("click", () => {
			const isHidden = contentEl.style.display === "none";
			contentEl.style.display = isHidden ? "block" : "none";
			chevronEl.empty();
			setIcon(chevronEl, isHidden ? "chevron-down" : "chevron-right");
		});

		const infoEl = contentEl.createDiv({ cls: "cristal-settings-info" });
		const steps = infoEl.createEl("ol");

		if (this.agent.cliType === "claude") {
			// Claude installation steps
			const step1 = steps.createEl("li");
			step1.createEl("strong", { text: this.locale.step1Title });
			step1.createEl("br");
			step1.createEl("span", { cls: "cristal-settings-note", text: this.locale.step1MacOS });
			step1.createEl("br");
			step1.createEl("span", { cls: "cristal-settings-note", text: this.locale.step1Windows });

			const step2 = steps.createEl("li");
			step2.createEl("strong", { text: this.locale.step2Title });
			step2.createEl("br");
			step2.createEl("code", { text: "npm i -g @anthropic-ai/claude-code" });

			const step3 = steps.createEl("li");
			step3.createEl("strong", { text: this.locale.step3Title });
			step3.createEl("br");
			step3.createEl("code", { text: "claude" });

			const step4 = steps.createEl("li");
			step4.createEl("strong", { text: this.locale.step4Title });
			step4.createEl("br");
			step4.createEl("span", { cls: "cristal-settings-note", text: this.locale.step4Note });

			const step5 = steps.createEl("li");
			step5.createEl("strong", { text: this.locale.step5Title });
			step5.createEl("br");
			step5.createEl("span", { cls: "cristal-settings-note", text: this.locale.step5Note });

			const step6 = steps.createEl("li");
			step6.createEl("strong", { text: this.locale.step6Title });
			step6.createEl("br");
			step6.createEl("span", { cls: "cristal-settings-note", text: this.locale.step6Note });

			const step7 = steps.createEl("li");
			step7.createEl("strong", { text: this.locale.step7Title });
			step7.createEl("br");
			step7.createEl("span", { cls: "cristal-settings-note", text: this.locale.step7Note });

			const step8 = steps.createEl("li");
			step8.createEl("strong", { text: this.locale.step8Title });

			infoEl.createEl("p", { cls: "cristal-settings-note", text: this.locale.subscriptionNote });
		} else if (this.agent.cliType === "codex") {
			// Codex installation steps (similar structure, different commands)
			const step1 = steps.createEl("li");
			step1.createEl("strong", { text: this.locale.step1Title });
			step1.createEl("br");
			step1.createEl("span", { cls: "cristal-settings-note", text: this.locale.step1MacOS });
			step1.createEl("br");
			step1.createEl("span", { cls: "cristal-settings-note", text: this.locale.step1Windows });

			const step2 = steps.createEl("li");
			step2.createEl("strong", { text: this.locale.step2Title });
			step2.createEl("br");
			step2.createEl("code", { text: "npm i -g @openai/codex" });

			const step3 = steps.createEl("li");
			step3.createEl("strong", { text: this.locale.step3Title });
			step3.createEl("br");
			step3.createEl("code", { text: "codex" });

			const step4 = steps.createEl("li");
			step4.createEl("strong", { text: this.locale.step4Title });
			step4.createEl("br");
			step4.createEl("span", { cls: "cristal-settings-note", text: this.locale.step4Note });

			const step5 = steps.createEl("li");
			step5.createEl("strong", { text: this.locale.step5Title });
			step5.createEl("br");
			step5.createEl("span", { cls: "cristal-settings-note", text: this.locale.step5Note });

			const step6 = steps.createEl("li");
			step6.createEl("strong", { text: this.locale.step6Title });
			step6.createEl("br");
			step6.createEl("span", { cls: "cristal-settings-note", text: this.locale.step6Note });

			const step7 = steps.createEl("li");
			step7.createEl("strong", { text: this.locale.step7Title });
			step7.createEl("br");
			step7.createEl("span", { cls: "cristal-settings-note", text: this.locale.step7Note });

			const step8 = steps.createEl("li");
			step8.createEl("strong", { text: this.locale.step8Title });

			infoEl.createEl("p", { cls: "cristal-settings-note", text: this.locale.subscriptionNote });
		}
	}

	private async confirmDelete(): Promise<boolean> {
		return new Promise(resolve => {
			const modal = new ConfirmDeleteModal(
				this.app,
				this.locale.confirmDeleteTitle || "Delete Integration?",
				`${this.locale.confirmDeleteMessage || "Are you sure you want to delete"} "${this.agent.name}"?`,
				() => resolve(true),
				() => resolve(false)
			);
			modal.open();
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.onSave();
	}
}

/**
 * Confirmation modal for deleting an integration
 */
class ConfirmDeleteModal extends Modal {
	private title: string;
	private message: string;
	private onConfirm: () => void;
	private onCancel: () => void;

	constructor(
		app: App,
		title: string,
		message: string,
		onConfirm: () => void,
		onCancel: () => void
	) {
		super(app);
		this.title = title;
		this.message = message;
		this.onConfirm = onConfirm;
		this.onCancel = onCancel;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.addClass("cristal-confirm-delete-modal");

		contentEl.createEl("h2", { text: this.title });
		contentEl.createEl("p", { text: this.message });

		const buttonContainer = contentEl.createDiv({ cls: "cristal-confirm-buttons" });

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.onCancel();
			this.close();
		});

		const confirmBtn = buttonContainer.createEl("button", {
			text: "Delete",
			cls: "mod-warning"
		});
		confirmBtn.addEventListener("click", () => {
			this.onConfirm();
			this.close();
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for creating/editing custom slash commands
 */
class CommandModal extends Modal {
	private plugin: CristalPlugin;
	private command: SlashCommand | null;
	private onSave: () => void;

	private nameInput!: TextComponent;
	private commandInput!: TextComponent;
	private descInput!: TextComponent;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.plugin.settings.language);
	}

	constructor(app: App, plugin: CristalPlugin, command: SlashCommand | null, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.command = command;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.command ? this.locale.editCommand : this.locale.newCustomCommand
		});

		// Name field
		new Setting(contentEl)
			.setName(this.locale.nameField)
			.setDesc(this.locale.nameFieldDesc)
			.addText(text => {
				this.nameInput = text;
				text.setPlaceholder(this.locale.namePlaceholder)
					.setValue(this.command?.name ?? "");
			});

		// Command field
		new Setting(contentEl)
			.setName(this.locale.commandField)
			.setDesc(this.locale.commandFieldDesc)
			.addText(text => {
				this.commandInput = text;
				text.setPlaceholder(this.locale.commandPlaceholder)
					.setValue(this.command?.command ?? "/");
			});

		// Description field
		new Setting(contentEl)
			.setName(this.locale.descriptionField)
			.setDesc(this.locale.descriptionFieldDesc)
			.addText(text => {
				this.descInput = text;
				text.setPlaceholder(this.locale.descriptionPlaceholder)
					.setValue(this.command?.description ?? "");
			});

		// Prompt field
		const promptSetting = new Setting(contentEl)
			.setName(this.locale.promptField)
			.setDesc(this.locale.promptFieldDesc);

		const promptContainer = contentEl.createDiv({ cls: "cristal-prompt-container" });
		const promptTextarea = promptContainer.createEl("textarea", {
			cls: "cristal-prompt-textarea",
			attr: { rows: "4", placeholder: this.locale.promptPlaceholder }
		});
		promptTextarea.value = this.command?.prompt ?? "";

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "cristal-modal-buttons" });

		const cancelBtn = buttonContainer.createEl("button", { text: this.locale.cancelButton });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = buttonContainer.createEl("button", {
			text: this.locale.saveButton,
			cls: "mod-cta"
		});
		saveBtn.addEventListener("click", async () => {
			await this.save(promptTextarea.value);
		});
	}

	private async save(promptValue: string): Promise<void> {
		const name = this.nameInput.getValue().trim();
		const command = this.commandInput.getValue().trim();
		const description = this.descInput.getValue().trim();
		const prompt = promptValue.trim();

		// Validation
		if (!name || !command || !description || !prompt) {
			return;
		}

		// Ensure command starts with /
		const finalCommand = command.startsWith("/") ? command : "/" + command;

		if (this.command) {
			// Editing existing command
			const idx = this.plugin.settings.customCommands.findIndex(c => c.id === this.command!.id);
			if (idx !== -1) {
				this.plugin.settings.customCommands[idx] = {
					...this.command,
					name,
					command: finalCommand,
					description,
					prompt
				};
			}
		} else {
			// Creating new command
			const newCommand: SlashCommand = {
				id: crypto.randomUUID(),
				name,
				command: finalCommand,
				description,
				prompt,
				icon: "terminal",
				isBuiltin: false,
				enabled: true
			};
			this.plugin.settings.customCommands.push(newCommand);
		}

		await this.plugin.saveSettings();
		this.onSave();
		this.close();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for editing agent system instructions (CLAUDE.md or AGENT.md)
 */
class AgentMdModal extends Modal {
	private plugin: CristalPlugin;
	private agentType: "claude" | "codex";
	private textarea!: HTMLTextAreaElement;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.plugin.settings.language);
	}

	constructor(app: App, plugin: CristalPlugin, agentType: "claude" | "codex") {
		super(app);
		this.plugin = plugin;
		this.agentType = agentType;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("cristal-claudemd-modal");

		const filename = this.agentType === "claude" ? "CLAUDE.md" : "AGENT.md";
		contentEl.createEl("h2", { text: `${filename} ${this.locale.systemInstructionsTitle || "Instructions"}` });

		contentEl.createEl("p", {
			cls: "cristal-settings-note",
			text: this.locale.systemInstructionsModalDesc
		});

		// Textarea container
		const container = contentEl.createDiv({ cls: "cristal-claudemd-container" });
		this.textarea = container.createEl("textarea", {
			cls: "cristal-claudemd-textarea",
			attr: { rows: "16", placeholder: this.locale.loadingPlaceholder }
		});

		// Load current content
		const content = await this.plugin.readAgentMd(this.agentType);
		this.textarea.value = content || this.plugin.getDefaultAgentMdContent();

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "cristal-modal-buttons" });

		const resetBtn = buttonContainer.createEl("button", { text: this.locale.resetToDefaultButton });
		resetBtn.addEventListener("click", async () => {
			const defaultContent = this.plugin.getDefaultAgentMdContent();
			this.textarea.value = defaultContent;
		});

		const saveBtn = buttonContainer.createEl("button", {
			text: this.locale.saveButton,
			cls: "mod-cta"
		});
		saveBtn.addEventListener("click", async () => {
			await this.plugin.writeAgentMd(this.agentType, this.textarea.value);
			this.close();
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
