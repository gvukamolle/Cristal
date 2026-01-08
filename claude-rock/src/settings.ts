import { App, PluginSettingTab, Setting, Modal, TextComponent } from "obsidian";
import type ClaudeRockPlugin from "./main";
import type { SlashCommand, LanguageCode } from "./types";
import { BUILTIN_COMMANDS } from "./commands";
import { LANGUAGE_NAMES } from "./systemPrompts";

export class ClaudeRockSettingTab extends PluginSettingTab {
	plugin: ClaudeRockPlugin;

	constructor(app: App, plugin: ClaudeRockPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Claude Rock Settings" });

		new Setting(containerEl)
			.setName("Claude CLI path")
			.setDesc("Path to the Claude Code CLI executable. Usually just 'claude' if installed globally.")
			.addText(text => text
				.setPlaceholder("claude")
				.setValue(this.plugin.settings.cliPath)
				.onChange(async (value) => {
					this.plugin.settings.cliPath = value || "claude";
					await this.plugin.saveSettings();
				}));

		// Language selection
		new Setting(containerEl)
			.setName("Assistant language")
			.setDesc("Language for Claude's responses and system instructions")
			.addDropdown(dropdown => {
				// Add all language options
				for (const [code, name] of Object.entries(LANGUAGE_NAMES)) {
					dropdown.addOption(code, name);
				}
				dropdown
					.setValue(this.plugin.settings.language)
					.onChange(async (value) => {
						this.plugin.settings.language = value as LanguageCode;
						await this.plugin.saveSettings();
					});
			});

		// Permissions section
		containerEl.createEl("h3", { text: "Claude Permissions" });

		const permissionsInfo = containerEl.createDiv({ cls: "claude-rock-settings-info" });
		permissionsInfo.createEl("p", {
			text: "Basic capabilities (always enabled): Reading and editing notes (.md, .canvas, .base), creating new notes."
		});
		permissionsInfo.createEl("p", {
			cls: "claude-rock-settings-note",
			text: "Bash commands and .obsidian folder access are always blocked for security."
		});

		new Setting(containerEl)
			.setName("Web Search")
			.setDesc("Allow Claude to search the internet for information")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.permissions.webSearch)
				.onChange(async (value) => {
					this.plugin.settings.permissions.webSearch = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Web Fetch")
			.setDesc("Allow Claude to read content from web pages")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.permissions.webFetch)
				.onChange(async (value) => {
					this.plugin.settings.permissions.webFetch = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Sub-agents (Task)")
			.setDesc("Allow Claude to launch helper agents for complex tasks")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.permissions.task)
				.onChange(async (value) => {
					this.plugin.settings.permissions.task = value;
					await this.plugin.saveSettings();
				}));

		// Slash Commands section
		containerEl.createEl("h3", { text: "Slash Commands" });

		containerEl.createEl("p", {
			cls: "claude-rock-settings-note",
			text: "Type / in chat to see available commands. Built-in commands can be disabled. You can also add custom commands."
		});

		// Built-in commands
		containerEl.createEl("h4", { text: "Built-in Commands" });

		for (const cmd of BUILTIN_COMMANDS) {
			const isDisabled = this.plugin.settings.disabledBuiltinCommands.includes(cmd.id);

			new Setting(containerEl)
				.setName(cmd.command)
				.setDesc(cmd.description)
				.addToggle(toggle => toggle
					.setValue(!isDisabled)
					.onChange(async (value) => {
						if (value) {
							// Enable: remove from disabled list
							this.plugin.settings.disabledBuiltinCommands =
								this.plugin.settings.disabledBuiltinCommands.filter(id => id !== cmd.id);
						} else {
							// Disable: add to disabled list
							this.plugin.settings.disabledBuiltinCommands.push(cmd.id);
						}
						await this.plugin.saveSettings();
					}));
		}

		// Custom commands
		containerEl.createEl("h4", { text: "Custom Commands" });

		new Setting(containerEl)
			.setName("Add custom command")
			.setDesc("Create your own slash command with a custom prompt")
			.addButton(button => button
				.setButtonText("Add")
				.onClick(() => {
					new CommandModal(this.app, this.plugin, null, () => {
						this.display(); // Refresh the settings view
					}).open();
				}));

		// Display existing custom commands
		for (const cmd of this.plugin.settings.customCommands) {
			new Setting(containerEl)
				.setName(cmd.command)
				.setDesc(cmd.description)
				.addButton(button => button
					.setButtonText("Edit")
					.onClick(() => {
						new CommandModal(this.app, this.plugin, cmd, () => {
							this.display();
						}).open();
					}))
				.addButton(button => button
					.setButtonText("Delete")
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.customCommands =
							this.plugin.settings.customCommands.filter(c => c.id !== cmd.id);
						await this.plugin.saveSettings();
						this.display();
					}));
		}

		// Info section
		containerEl.createEl("h3", { text: "Prerequisites" });

		const infoEl = containerEl.createDiv({ cls: "claude-rock-settings-info" });
		infoEl.createEl("p", {
			text: "Claude Rock requires Claude Code CLI to be installed and authenticated."
		});

		const steps = infoEl.createEl("ol");
		steps.createEl("li", { text: "Install: npm i -g @anthropic-ai/claude-code" });
		steps.createEl("li", { text: "Authenticate: run 'claude' in terminal and follow OAuth flow" });
		steps.createEl("li", { text: "Verify: run 'claude -p \"hello\"' to test" });

		infoEl.createEl("p", {
			cls: "claude-rock-settings-note",
			text: "Note: You need an active Claude Pro or Max subscription."
		});
	}
}

/**
 * Modal for creating/editing custom slash commands
 */
class CommandModal extends Modal {
	private plugin: ClaudeRockPlugin;
	private command: SlashCommand | null;
	private onSave: () => void;

	private nameInput!: TextComponent;
	private commandInput!: TextComponent;
	private descInput!: TextComponent;

	constructor(app: App, plugin: ClaudeRockPlugin, command: SlashCommand | null, onSave: () => void) {
		super(app);
		this.plugin = plugin;
		this.command = command;
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.command ? "Edit Command" : "New Custom Command"
		});

		// Name field
		new Setting(contentEl)
			.setName("Name")
			.setDesc("Display name for the command")
			.addText(text => {
				this.nameInput = text;
				text.setPlaceholder("My Command")
					.setValue(this.command?.name ?? "");
			});

		// Command field
		new Setting(contentEl)
			.setName("Command")
			.setDesc("The slash command trigger (e.g., /mycommand)")
			.addText(text => {
				this.commandInput = text;
				text.setPlaceholder("/mycommand")
					.setValue(this.command?.command ?? "/");
			});

		// Description field
		new Setting(contentEl)
			.setName("Description")
			.setDesc("Short description shown in autocomplete")
			.addText(text => {
				this.descInput = text;
				text.setPlaceholder("What this command does")
					.setValue(this.command?.description ?? "");
			});

		// Prompt field
		const promptSetting = new Setting(contentEl)
			.setName("Prompt")
			.setDesc("The prompt to send to Claude. Use {arg} for command arguments (e.g., '/mycommand hello' would replace {arg} with 'hello')");

		const promptContainer = contentEl.createDiv({ cls: "claude-rock-prompt-container" });
		const promptTextarea = promptContainer.createEl("textarea", {
			cls: "claude-rock-prompt-textarea",
			attr: { rows: "4", placeholder: "Enter the prompt..." }
		});
		promptTextarea.value = this.command?.prompt ?? "";

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: "claude-rock-modal-buttons" });

		const cancelBtn = buttonContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => this.close());

		const saveBtn = buttonContainer.createEl("button", {
			text: "Save",
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
			// TODO: Show error
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
