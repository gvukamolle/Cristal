import { App, PluginSettingTab, Setting, Modal, TextComponent, setIcon, Notice } from "obsidian";
import type CrystalPlugin from "./main";
import type { SlashCommand, LanguageCode, ClaudeModel, AgentConfig, CLIType, AgentPersonalization } from "./types";
import { CLAUDE_MODELS, CLI_INFO, DEFAULT_CLAUDE_PERMISSIONS, DEFAULT_AGENT_PERSONALIZATION } from "./types";
import { getBuiltinCommands } from "./commands";
import { LANGUAGE_NAMES } from "./systemPrompts";
import { checkCLIInstalled, detectCLIPath } from "./cliDetector";
import { getSettingsLocale, type SettingsLocale } from "./settingsLocales";
import { CreateSkillModal, ValidateSkillModal, EditSkillModal } from "./skills";

export class CrystalSettingTab extends PluginSettingTab {
	plugin: CrystalPlugin;
	private locale!: SettingsLocale;

	constructor(app: App, plugin: CrystalPlugin) {
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

		// 3. Agent Personalization
		this.displayAgentPersonalizationSection(containerEl);

		// 4. Claude Code Integration settings
		this.displayClaudeSettings(containerEl);

		// 5. Slash Commands section
		this.displaySlashCommandsSection(containerEl);

		// 6. Skills section
		this.displaySkillsSectionStandalone(containerEl);

		// 7. Getting Started section (at the bottom)
		this.displayGettingStarted(containerEl);
	}

	private displayUsageSection(containerEl: HTMLElement): void {
		const usageSection = containerEl.createDiv({ cls: "crystal-usage-section" });
		usageSection.createEl("h3", { text: this.locale.usageStatistics });

		// Calculate stats from plugin sessions
		const stats = this.calculateUsageStats();

		// Inline compact format
		const inline = usageSection.createDiv({ cls: "crystal-stats-inline" });
		this.createStatInline(inline, this.locale.today, this.formatTokens(stats.todayTokens));
		this.createStatInline(inline, this.locale.week, this.formatTokens(stats.weekTokens));
		this.createStatInline(inline, this.locale.month, this.formatTokens(stats.monthTokens));

		// Account limits section
		this.displayAccountLimitsSection(usageSection);
	}

	private displayAccountLimitsSection(containerEl: HTMLElement): void {
		const limitsSection = containerEl.createDiv({ cls: "crystal-account-limits" });
		limitsSection.createEl("h4", { text: this.locale.accountLimits });

		// Container for limits data
		const limitsContainer = limitsSection.createDiv({ cls: "crystal-limits-data" });

		// Check limits button
		const btnContainer = limitsSection.createDiv({ cls: "crystal-limits-btn-container" });
		const checkBtn = btnContainer.createEl("button", {
			text: this.locale.checkLimits,
			cls: "crystal-check-limits-btn"
		});
		setIcon(checkBtn.createSpan({ cls: "crystal-btn-icon-left" }), "refresh-cw");

		checkBtn.addEventListener("click", async () => {
			await this.loadAccountLimits(limitsContainer);
		});
	}

	private async loadAccountLimits(container: HTMLElement): Promise<void> {
		container.empty();
		container.createEl("span", { cls: "crystal-limits-loading", text: this.locale.loadingLimits });

		const { UsageLimitsService } = await import("./UsageLimitsService");
		const service = new UsageLimitsService();

		container.empty();

		// Claude limits
		const claudeAgent = this.plugin.getAgentByCliType("claude");
		if (claudeAgent?.enabled) {
			const claudeLimits = await service.fetchClaudeUsage();
			this.renderClaudeLimits(container, claudeLimits);
		} else {
			container.createEl("span", {
				cls: "crystal-limits-note",
				text: "No agents enabled"
			});
		}
	}

	private renderClaudeLimits(container: HTMLElement, limits: import("./UsageLimitsService").ClaudeUsageLimits): void {
		container.empty();

		if (limits.error) {
			const errorEl = container.createDiv({ cls: "crystal-limits-error" });
			if (limits.error === "not_authenticated") {
				errorEl.createEl("span", { text: this.locale.notAuthenticated });
				errorEl.createEl("br");
				errorEl.createEl("span", { cls: "crystal-limits-note", text: this.locale.notAuthenticatedDesc });
			} else {
				errorEl.createEl("span", { text: this.locale.limitsError });
			}
			return;
		}

		const claudeSection = container.createDiv({ cls: "crystal-agent-limits" });
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

	private createProgressBar(
		container: HTMLElement,
		label: string,
		percent: number,
		resetsAt: string | null,
		showLeft: boolean = false
	): void {
		const row = container.createDiv({ cls: "crystal-progress-row" });

		// Top line: label + percent
		const topLine = row.createDiv({ cls: "crystal-progress-top" });
		topLine.createDiv({ cls: "crystal-progress-label", text: label });
		const percentText = showLeft ? `${Math.round(100 - percent)}% ${this.locale.left}` : `${Math.round(percent)}% ${this.locale.used}`;
		topLine.createDiv({ cls: "crystal-progress-percent", text: percentText });

		// Progress bar
		const barContainer = row.createDiv({ cls: "crystal-progress-bar" });
		const fill = barContainer.createDiv({ cls: "crystal-progress-fill" });
		fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;

		// Color based on usage
		if (percent >= 90) {
			fill.addClass("crystal-progress-danger");
		} else if (percent >= 70) {
			fill.addClass("crystal-progress-warning");
		}

		// Reset time
		if (resetsAt) {
			const resetText = this.formatResetTime(resetsAt);
			row.createDiv({ cls: "crystal-progress-reset", text: resetText });
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

	/**
	 * Launch command in system terminal
	 */
	private launchCommand(command: string): void {
		const success = this.plugin.openInSystemTerminal(command);
		if (!success) {
			new Notice("Failed to open system terminal");
		}
	}

	private displayAgentPersonalizationSection(containerEl: HTMLElement): void {
		// Ensure agentPersonalization exists with defaults
		if (!this.plugin.settings.agentPersonalization) {
			this.plugin.settings.agentPersonalization = { ...DEFAULT_AGENT_PERSONALIZATION };
		}

		new Setting(containerEl)
			.setName(this.locale.agentPersonalization)
			.setDesc(this.locale.agentPersonalizationDesc)
			.addButton(btn => btn
				.setButtonText(this.locale.personalizationNotConfigured)
				.onClick(() => {
					new AgentPersonalizationModal(this.app, this.plugin, () => {
						this.display();
					}).open();
				}));
	}

	private displayClaudeSettings(containerEl: HTMLElement): void {
		// Get or create Claude agent
		let agent = this.plugin.getAgentByCliType("claude");
		if (!agent) {
			// Auto-create Claude agent if it doesn't exist
			const info = CLI_INFO.claude;
			agent = {
				id: `claude-${Date.now()}`,
				cliType: "claude",
				name: info.name,
				description: info.description,
				enabled: true,
				cliPath: "claude",
				model: "claude-haiku-4-5-20251001",
				thinkingEnabled: false,
				permissions: { ...DEFAULT_CLAUDE_PERMISSIONS },
				enabledSkills: []
			};
			this.plugin.settings.agents.push(agent);
			this.plugin.settings.defaultAgentId = agent.id;
			this.plugin.saveSettings();
		}

		containerEl.createEl("h3", { text: "Claude Code" });

		// Auto-detect CLI path on settings open
		const detected = detectCLIPath();
		if (detected.found && agent.cliPath !== detected.path) {
			agent.cliPath = detected.path;
			this.plugin.saveSettings();
		}

		// CLI Status indicator (no path input - auto-detected)
		const cliStatusEl = containerEl.createDiv({ cls: "crystal-cli-status" });
		this.checkAndDisplayCLIStatus(cliStatusEl, agent);

		// Model selection
		const allModels = CLAUDE_MODELS;
		const disabledModels = agent.disabledModels || [];
		const enabledModels = allModels.filter(m => !disabledModels.includes(m.value));

		new Setting(containerEl)
			.setName(this.locale.defaultModel)
			.setDesc(this.locale.defaultModelDescNoSlash)
			.addDropdown(dropdown => {
				for (const model of enabledModels) {
					dropdown.addOption(model.value, model.label);
				}
				// If current model is disabled, select first enabled
				const currentModelEnabled = enabledModels.some(m => m.value === agent!.model);
				if (!currentModelEnabled && enabledModels.length > 0) {
					const firstEnabled = enabledModels[0];
					if (firstEnabled) {
						agent!.model = firstEnabled.value;
						this.plugin.saveSettings();
					}
				}
				dropdown
					.setValue(agent!.model)
					.onChange(async (value) => {
						agent!.model = value as ClaudeModel | string;
						await this.plugin.saveSettings();
					});
			});

		// Available Models section (toggles to disable models)
		containerEl.createEl("h4", { text: this.locale.availableModels || "Available Models" });
		containerEl.createEl("p", {
			cls: "crystal-settings-note",
			text: this.locale.availableModelsDesc || "Disable models you don't want to use"
		});

		for (const model of allModels) {
			const isEnabled = !disabledModels.includes(model.value);
			new Setting(containerEl)
				.setName(model.label)
				.addToggle(toggle => toggle
					.setValue(isEnabled)
					.onChange(async (value) => {
						if (!agent!.disabledModels) {
							agent!.disabledModels = [];
						}
						if (value) {
							agent!.disabledModels = agent!.disabledModels.filter(m => m !== model.value);
						} else {
							if (!agent!.disabledModels.includes(model.value)) {
								agent!.disabledModels.push(model.value);
							}
							if (agent!.model === model.value) {
								const remaining = allModels.filter(m => !agent!.disabledModels!.includes(m.value));
								const firstRemaining = remaining[0];
								if (firstRemaining) {
									agent!.model = firstRemaining.value;
								}
							}
						}
						await this.plugin.saveSettings();
					}));
		}

		// Agent permissions
		const permissions = agent.permissions || { ...DEFAULT_CLAUDE_PERMISSIONS };

		// Extended Thinking
		new Setting(containerEl)
			.setName(this.locale.extendedThinking || "Extended Thinking")
			.setDesc(this.locale.extendedThinkingDesc || "Enable deeper analysis mode for complex tasks")
			.addToggle(toggle => toggle
				.setValue(permissions.extendedThinking)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.extendedThinking = value;
					agent!.thinkingEnabled = value;
					await this.plugin.saveSettings();
				}));

		// Permissions section
		containerEl.createEl("h4", { text: this.locale.agentPermissions });
		containerEl.createEl("p", {
			cls: "crystal-settings-note",
			text: this.locale.permissionsNote
		});

		// File Operations
		containerEl.createEl("h5", { text: this.locale.fileOperations || "File Operations" });

		new Setting(containerEl)
			.setName(this.locale.fileRead || "Read files")
			.setDesc(this.locale.fileReadDesc || "Allow reading files in vault")
			.addToggle(toggle => toggle
				.setValue(permissions.fileRead)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.fileRead = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.locale.fileWrite || "Write files")
			.setDesc(this.locale.fileWriteDesc || "Allow creating new files")
			.addToggle(toggle => toggle
				.setValue(permissions.fileWrite)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.fileWrite = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.locale.fileEdit || "Edit files")
			.setDesc(this.locale.fileEditDesc || "Allow editing existing files")
			.addToggle(toggle => toggle
				.setValue(permissions.fileEdit)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.fileEdit = value;
					await this.plugin.saveSettings();
				}));

		// Web Operations
		containerEl.createEl("h5", { text: this.locale.webOperations || "Web Operations" });

		new Setting(containerEl)
			.setName(this.locale.webSearch)
			.setDesc(this.locale.webSearchDesc)
			.addToggle(toggle => toggle
				.setValue(permissions.webSearch)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.webSearch = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(this.locale.webFetch)
			.setDesc(this.locale.webFetchDesc)
			.addToggle(toggle => toggle
				.setValue(permissions.webFetch)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.webFetch = value;
					await this.plugin.saveSettings();
				}));

		// Advanced
		containerEl.createEl("h5", { text: this.locale.advanced || "Advanced" });

		new Setting(containerEl)
			.setName(this.locale.subAgents)
			.setDesc(this.locale.subAgentsDesc)
			.addToggle(toggle => toggle
				.setValue(permissions.task)
				.onChange(async (value) => {
					if (!agent!.permissions) {
						agent!.permissions = { ...DEFAULT_CLAUDE_PERMISSIONS };
					}
					agent!.permissions.task = value;
					await this.plugin.saveSettings();
				}));
	}

	private async checkAndDisplayCLIStatus(container: HTMLElement, agent: AgentConfig): Promise<void> {
		container.empty();
		container.addClass("crystal-cli-status-container");

		// Fixed structure: status row (always present) + content area
		const statusRow = container.createDiv({ cls: "crystal-cli-status-row" });
		const statusInfo = statusRow.createDiv({ cls: "crystal-cli-status-info" });

		// Refresh button (always in same position)
		const refreshBtn = statusRow.createEl("button", {
			cls: "crystal-cli-refresh-btn clickable-icon",
			attr: { "aria-label": this.locale.refreshButton }
		});
		setIcon(refreshBtn, "refresh-cw");
		refreshBtn.addEventListener("click", () => {
			this.checkAndDisplayCLIStatus(container, agent);
		});

		// Content area for buttons/hints
		const contentArea = container.createDiv({ cls: "crystal-cli-status-content" });

		// Show loading state
		const loadingEl = statusInfo.createDiv({ cls: "crystal-cli-status-item crystal-cli-status-checking" });
		const loadingIcon = loadingEl.createSpan({ cls: "crystal-cli-status-icon" });
		setIcon(loadingIcon, "loader");
		loadingEl.createSpan({ text: this.locale.checkingCli });

		// Check CLI status
		const status = await checkCLIInstalled(agent.cliPath);

		// Update status info (keep structure, just update content)
		statusInfo.empty();

		if (status.installed) {
			const foundEl = statusInfo.createDiv({ cls: "crystal-cli-status-item crystal-cli-status-success" });
			const iconSpan = foundEl.createSpan({ cls: "crystal-cli-status-icon" });
			setIcon(iconSpan, "check-circle");
			foundEl.createSpan({ text: this.locale.cliFound.replace("{version}", status.version || "?") });

			// Terminal button with description (right-aligned)
			const terminalSection = contentArea.createDiv({ cls: "crystal-cli-terminal-section" });

			terminalSection.createEl("p", {
				cls: "crystal-settings-note crystal-terminal-desc",
				text: this.locale.openTerminalDesc || "Open system terminal with Claude Code"
			});

			const terminalBtn = terminalSection.createEl("button", {
				cls: "mod-cta"
			});
			const terminalIcon = terminalBtn.createSpan({ cls: "crystal-btn-icon-left" });
			setIcon(terminalIcon, "terminal");
			terminalBtn.createSpan({ text: this.locale.openTerminal || "Open Terminal" });

			terminalBtn.addEventListener("click", () => {
				this.launchCommand("claude");
			});
		} else {
			const errorEl = statusInfo.createDiv({ cls: "crystal-cli-status-item crystal-cli-status-error" });
			const iconSpan = errorEl.createSpan({ cls: "crystal-cli-status-icon" });
			setIcon(iconSpan, "x-circle");
			errorEl.createSpan({ text: this.locale.cliNotFound });

			// Installation hint
			const installCmd = "npm i -g @anthropic-ai/claude-code";

			const installHint = contentArea.createDiv({ cls: "crystal-install-hint" });
			installHint.createEl("p", {
				cls: "crystal-settings-note",
				text: this.locale.installWith + ":"
			});
			installHint.createEl("code", {
				cls: "crystal-install-command",
				text: installCmd
			});

			// Install button
			const installBtn = contentArea.createEl("button", {
				cls: "mod-cta"
			});
			const downloadIcon = installBtn.createSpan({ cls: "crystal-btn-icon-left" });
			setIcon(downloadIcon, "download");
			installBtn.createSpan({ text: this.locale.startIntegration || "Open terminal and install CLI" });

			installBtn.addEventListener("click", () => {
				this.launchCommand(installCmd);
			});
		}
	}

	private displaySkillsSectionStandalone(containerEl: HTMLElement): void {
		// Get agent for skill toggles
		const agent = this.plugin.getAgentByCliType("claude");
		if (!agent) return;

		containerEl.createEl("h3", { text: this.locale.skills || "Skills" });

		containerEl.createEl("p", {
			cls: "crystal-settings-note",
			text: this.locale.skillsNote || "Skills provide specialized knowledge for Obsidian workflows"
		});

		// Built-in skills
		containerEl.createEl("h4", { text: this.locale.builtinSkills || "Built-in Skills" });

		const skillRefs = this.plugin.skillLoader?.getSkillReferences(this.plugin.settings.language) || [];
		const enabledSkills = agent.enabledSkills || [];
		const builtinSkills = skillRefs.filter(s => s.isBuiltin);
		const customSkills = skillRefs.filter(s => !s.isBuiltin);

		if (builtinSkills.length === 0) {
			containerEl.createEl("p", {
				cls: "crystal-settings-note",
				text: this.locale.noSkillsAvailable || "No skills available"
			});
		} else {
			for (const skill of builtinSkills) {
				this.renderSkillToggle(containerEl, skill, enabledSkills, false, agent);
			}
		}

		// Custom skills
		containerEl.createEl("h4", { text: this.locale.customSkills || "Custom Skills" });

		// Add custom skill button
		new Setting(containerEl)
			.setName(this.locale.addCustomSkill || "Add custom skill")
			.setDesc(this.locale.addCustomSkillDesc || "Create your own skill with custom instructions")
			.addButton(button => button
				.setButtonText(this.locale.addButton || "Add")
				.onClick(() => {
					new CreateSkillModal(
						this.app,
						this.plugin.skillLoader,
						this.plugin.settings.language,
						async (skillId: string) => {
							await this.plugin.skillLoader.refresh();
							new Notice(this.locale.skillCreatedSuccess?.replace("{name}", skillId) || `Skill "${skillId}" created`);
							this.display();
						}
					).open();
				}));

		// Display existing custom skills
		for (const skill of customSkills) {
			this.renderSkillToggle(containerEl, skill, enabledSkills, true, agent);
		}
	}

	private renderSkillToggle(
		container: HTMLElement,
		skill: { id: string; name: string; description: string; isBuiltin: boolean },
		enabledSkills: string[],
		showValidate: boolean,
		agent: AgentConfig
	): void {
		const isEnabled = enabledSkills.includes(skill.id);

		const setting = new Setting(container)
			.setName(skill.name)
			.setDesc(skill.description)
			.addToggle(toggle => toggle
				.setValue(isEnabled)
				.onChange(async (value) => {
					if (!agent.enabledSkills) {
						agent.enabledSkills = [];
					}
					if (value) {
						if (!agent.enabledSkills.includes(skill.id)) {
							agent.enabledSkills.push(skill.id);
						}
					} else {
						agent.enabledSkills = agent.enabledSkills.filter(
							id => id !== skill.id
						);
					}
					await this.plugin.saveSettings();

					// Sync skills to CLI directory
					await this.plugin.skillLoader?.syncSkillsForAgent(
						agent.cliType,
						agent.enabledSkills || []
					);
				}));

		// Add edit and validate buttons for custom skills
		if (showValidate) {
			// Edit button
			setting.addButton(btn => btn
				.setIcon("pencil")
				.setTooltip(this.locale.editButton || "Edit")
				.onClick(async () => {
					const fullSkill = this.plugin.skillLoader.getSkill(skill.id);
					if (fullSkill) {
						new EditSkillModal(
							this.app,
							this.plugin.skillLoader,
							fullSkill,
							this.plugin.settings.language,
							async () => {
								// On save - refresh and sync
								await this.plugin.skillLoader.refresh();
								await this.plugin.syncAllAgentSkills();
								this.display();
							},
							async (deletedSkillId: string) => {
								// On delete - remove skill from all agents, refresh and sync
								for (const agent of this.plugin.settings.agents) {
									if (agent.enabledSkills?.includes(deletedSkillId)) {
										agent.enabledSkills = agent.enabledSkills.filter(id => id !== deletedSkillId);
									}
								}
								await this.plugin.saveSettings();
								await this.plugin.skillLoader.refresh();
								await this.plugin.syncAllAgentSkills();
								this.display();
							}
						).open();
					}
				}));

			// Validate button
			setting.addButton(btn => btn
				.setIcon("check-circle")
				.setTooltip(this.locale.validateSkill || "Validate skill")
				.onClick(() => {
					new ValidateSkillModal(this.app, this.plugin.skillLoader, skill.id, this.plugin.settings.language).open();
				}));
		}
	}

	private displayGettingStarted(containerEl: HTMLElement): void {
		// Collapsible header
		const headerEl = containerEl.createDiv({ cls: "crystal-getting-started-header" });
		const chevronEl = headerEl.createSpan({ cls: "crystal-getting-started-chevron" });
		setIcon(chevronEl, "chevron-right");
		headerEl.createEl("h3", { text: this.locale.gettingStarted });

		// Content container (collapsed by default)
		const contentEl = containerEl.createDiv({ cls: "crystal-getting-started-content" });
		contentEl.style.display = "none";

		// Toggle on header click
		headerEl.addEventListener("click", () => {
			const isHidden = contentEl.style.display === "none";
			contentEl.style.display = isHidden ? "block" : "none";
			chevronEl.empty();
			setIcon(chevronEl, isHidden ? "chevron-down" : "chevron-right");
		});

		const infoEl = contentEl.createDiv({ cls: "crystal-settings-info" });
		const steps = infoEl.createEl("ol");

		// Claude installation steps
		const step1 = steps.createEl("li");
		step1.createEl("strong", { text: this.locale.step1Title });
		step1.createEl("br");
		step1.createEl("span", { cls: "crystal-settings-note", text: this.locale.step1MacOS });
		step1.createEl("br");
		step1.createEl("span", { cls: "crystal-settings-note", text: this.locale.step1Windows });

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
		step4.createEl("span", { cls: "crystal-settings-note", text: this.locale.step4Note });

		const step5 = steps.createEl("li");
		step5.createEl("strong", { text: this.locale.step5Title });
		step5.createEl("br");
		step5.createEl("span", { cls: "crystal-settings-note", text: this.locale.step5Note });

		const step6 = steps.createEl("li");
		step6.createEl("strong", { text: this.locale.step6Title });
		step6.createEl("br");
		step6.createEl("span", { cls: "crystal-settings-note", text: this.locale.step6Note });

		const step7 = steps.createEl("li");
		step7.createEl("strong", { text: this.locale.step7Title });
		step7.createEl("br");
		step7.createEl("span", { cls: "crystal-settings-note", text: this.locale.step7Note });

		const step8 = steps.createEl("li");
		step8.createEl("strong", { text: this.locale.step8Title });

		infoEl.createEl("p", { cls: "crystal-settings-note", text: this.locale.subscriptionNote });
	}

	private displaySlashCommandsSection(containerEl: HTMLElement): void {
		containerEl.createEl("h3", { text: this.locale.slashCommands });

		containerEl.createEl("p", {
			cls: "crystal-settings-note",
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
		const item = container.createDiv({ cls: "crystal-stat-inline" });
		item.createSpan({ cls: "crystal-stat-inline-label", text: label });
		item.createSpan({ cls: "crystal-stat-inline-value", text: value });
	}

	private formatTokens(tokens: number): string {
		if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
		if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
		return String(tokens);
	}
}

/**
 * Modal for creating/editing custom slash commands
 */
class CommandModal extends Modal {
	private plugin: CrystalPlugin;
	private command: SlashCommand | null;
	private onSave: () => void;

	private nameInput!: TextComponent;
	private commandInput!: TextComponent;
	private descInput!: TextComponent;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.plugin.settings.language);
	}

	constructor(app: App, plugin: CrystalPlugin, command: SlashCommand | null, onSave: () => void) {
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

		const promptContainer = contentEl.createDiv({ cls: "crystal-prompt-container" });
		const promptTextarea = promptContainer.createEl("textarea", {
			cls: "crystal-prompt-textarea",
			attr: { rows: "4", placeholder: this.locale.promptPlaceholder }
		});
		promptTextarea.value = this.command?.prompt ?? "";

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "crystal-modal-buttons" });

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
 * Modal for editing agent personalization settings
 */
class AgentPersonalizationModal extends Modal {
	private plugin: CrystalPlugin;
	private onSave: () => void;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.plugin.settings.language);
	}

	constructor(app: App, plugin: CrystalPlugin, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("crystal-personalization-modal");

		// Ensure agentPersonalization exists
		if (!this.plugin.settings.agentPersonalization) {
			this.plugin.settings.agentPersonalization = { ...DEFAULT_AGENT_PERSONALIZATION };
		}
		const personalization = this.plugin.settings.agentPersonalization;

		// Header with icon
		const header = contentEl.createDiv({ cls: "crystal-personalization-header" });
		const headerIcon = header.createDiv({ cls: "crystal-personalization-header-icon" });
		setIcon(headerIcon, "user");
		header.createEl("h2", { text: this.locale.agentPersonalization });

		// Description
		contentEl.createEl("p", {
			cls: "crystal-personalization-desc",
			text: this.locale.agentPersonalizationDesc
		});

		// Form container
		const form = contentEl.createDiv({ cls: "crystal-personalization-form" });

		// User Name
		const nameGroup = form.createDiv({ cls: "crystal-personalization-group" });
		const nameLabel = nameGroup.createDiv({ cls: "crystal-personalization-label" });
		const nameLabelIcon = nameLabel.createSpan({ cls: "crystal-personalization-label-icon" });
		setIcon(nameLabelIcon, "at-sign");
		nameLabel.createSpan({ text: this.locale.personalizationUserName });
		nameGroup.createEl("p", {
			cls: "crystal-personalization-hint",
			text: this.locale.personalizationUserNameDesc
		});
		const nameInput = nameGroup.createEl("input", {
			cls: "crystal-personalization-input",
			attr: {
				type: "text",
				placeholder: this.locale.personalizationUserNamePlaceholder
			}
		});
		nameInput.value = personalization.userName || "";

		// User Role
		const roleGroup = form.createDiv({ cls: "crystal-personalization-group" });
		const roleLabel = roleGroup.createDiv({ cls: "crystal-personalization-label" });
		const roleLabelIcon = roleLabel.createSpan({ cls: "crystal-personalization-label-icon" });
		setIcon(roleLabelIcon, "briefcase");
		roleLabel.createSpan({ text: this.locale.personalizationUserRole });
		roleGroup.createEl("p", {
			cls: "crystal-personalization-hint",
			text: this.locale.personalizationUserRoleDesc
		});
		const roleInput = roleGroup.createEl("input", {
			cls: "crystal-personalization-input",
			attr: {
				type: "text",
				placeholder: this.locale.personalizationUserRolePlaceholder
			}
		});
		roleInput.value = personalization.userRole || "";

		// Work Context
		const workGroup = form.createDiv({ cls: "crystal-personalization-group" });
		const workLabel = workGroup.createDiv({ cls: "crystal-personalization-label" });
		const workLabelIcon = workLabel.createSpan({ cls: "crystal-personalization-label-icon" });
		setIcon(workLabelIcon, "book-open");
		workLabel.createSpan({ text: this.locale.personalizationWorkContext });
		workGroup.createEl("p", {
			cls: "crystal-personalization-hint",
			text: this.locale.personalizationWorkContextDesc
		});
		const workTextarea = workGroup.createEl("textarea", {
			cls: "crystal-personalization-textarea",
			attr: {
				rows: "3",
				placeholder: this.locale.personalizationWorkContextPlaceholder
			}
		});
		workTextarea.value = personalization.workContext || "";

		// Communication Style
		const styleGroup = form.createDiv({ cls: "crystal-personalization-group" });
		const styleLabel = styleGroup.createDiv({ cls: "crystal-personalization-label" });
		const styleLabelIcon = styleLabel.createSpan({ cls: "crystal-personalization-label-icon" });
		setIcon(styleLabelIcon, "message-circle");
		styleLabel.createSpan({ text: this.locale.personalizationCommunicationStyle });
		styleGroup.createEl("p", {
			cls: "crystal-personalization-hint",
			text: this.locale.personalizationCommunicationStyleDesc
		});
		const styleTextarea = styleGroup.createEl("textarea", {
			cls: "crystal-personalization-textarea",
			attr: {
				rows: "2",
				placeholder: this.locale.personalizationCommunicationStylePlaceholder
			}
		});
		styleTextarea.value = personalization.communicationStyle || "";

		// Current Focus
		const focusGroup = form.createDiv({ cls: "crystal-personalization-group" });
		const focusLabel = focusGroup.createDiv({ cls: "crystal-personalization-label" });
		const focusLabelIcon = focusLabel.createSpan({ cls: "crystal-personalization-label-icon" });
		setIcon(focusLabelIcon, "target");
		focusLabel.createSpan({ text: this.locale.personalizationCurrentFocus });
		focusGroup.createEl("p", {
			cls: "crystal-personalization-hint",
			text: this.locale.personalizationCurrentFocusDesc
		});
		const focusTextarea = focusGroup.createEl("textarea", {
			cls: "crystal-personalization-textarea",
			attr: {
				rows: "2",
				placeholder: this.locale.personalizationCurrentFocusPlaceholder
			}
		});
		focusTextarea.value = personalization.currentFocus || "";

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "crystal-modal-buttons" });

		const clearBtn = buttonContainer.createEl("button", {
			text: this.locale.clearAllButton || "Clear all",
			cls: "crystal-personalization-clear-btn"
		});
		clearBtn.addEventListener("click", () => {
			nameInput.value = "";
			roleInput.value = "";
			workTextarea.value = "";
			styleTextarea.value = "";
			focusTextarea.value = "";
		});

		// Spacer
		buttonContainer.createDiv({ cls: "crystal-modal-buttons-spacer" });

		const cancelBtn = buttonContainer.createEl("button", { text: this.locale.cancelButton });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = buttonContainer.createEl("button", {
			text: this.locale.saveButton,
			cls: "mod-cta"
		});
		saveBtn.addEventListener("click", async () => {
			this.plugin.settings.agentPersonalization = {
				userName: nameInput.value.trim(),
				userRole: roleInput.value.trim(),
				workContext: workTextarea.value.trim(),
				communicationStyle: styleTextarea.value.trim(),
				currentFocus: focusTextarea.value.trim()
			};
			await this.plugin.saveSettings();
			this.onSave();
			this.close();
		});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
