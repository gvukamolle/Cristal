import { App, Modal, Setting, Notice, TextComponent } from "obsidian";
import type { SkillLoader } from "./SkillLoader";
import type { SkillReference, Skill } from "./types";
import { SkillParser } from "./SkillParser";
import { getSettingsLocale, type SettingsLocale } from "../settingsLocales";
import type { LanguageCode } from "../systemPrompts";

/**
 * Modal for creating a new skill
 */
export class CreateSkillModal extends Modal {
	private skillLoader: SkillLoader;
	private language: LanguageCode;
	private onSuccess: (skillId: string) => void;

	private nameInput!: TextComponent;
	private descInput!: TextComponent;
	private includeScripts = false;
	private includeReferences = false;
	private includeAssets = false;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.language);
	}

	constructor(
		app: App,
		skillLoader: SkillLoader,
		language: LanguageCode,
		onSuccess: (skillId: string) => void
	) {
		super(app);
		this.skillLoader = skillLoader;
		this.language = language;
		this.onSuccess = onSuccess;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('crystal-create-skill-modal');

		contentEl.createEl('h2', { text: this.locale.createNewSkillTitle || 'Create New Skill' });

		// Name field
		new Setting(contentEl)
			.setName(this.locale.skillNameField || 'Skill Name')
			.setDesc(this.locale.skillNameFieldDesc || 'Unique identifier in kebab-case (e.g., my-custom-skill)')
			.addText(text => {
				this.nameInput = text;
				text.setPlaceholder(this.locale.skillNamePlaceholder || 'my-skill-name')
					.onChange(value => {
						// Real-time validation feedback
						const isValid = SkillParser.isValidSkillName(value) || value === '';
						text.inputEl.classList.toggle('crystal-input-error', !isValid);
					});
			});

		// Description field
		new Setting(contentEl)
			.setName(this.locale.skillDescriptionField || 'Description')
			.setDesc(this.locale.skillDescriptionFieldDesc || 'Detailed description for triggering (what it does, when to use)')
			.addText(text => {
				this.descInput = text;
				text.setPlaceholder(this.locale.skillDescriptionPlaceholder || 'Describe what this skill does...');
				text.inputEl.style.width = '100%';
			});

		// Optional folders section
		contentEl.createEl('h3', { text: this.locale.optionalFolders || 'Optional Folders', cls: 'crystal-section-header' });

		new Setting(contentEl)
			.setName(this.locale.includeScripts || 'Include scripts/')
			.setDesc(this.locale.includeScriptsDesc || 'For executable code (Python, shell scripts)')
			.addToggle(toggle => {
				toggle.setValue(false);
				toggle.onChange(value => {
					this.includeScripts = value;
				});
			});

		new Setting(contentEl)
			.setName(this.locale.includeReferences || 'Include references/')
			.setDesc(this.locale.includeReferencesDesc || 'For documentation loaded into context')
			.addToggle(toggle => {
				toggle.setValue(false);
				toggle.onChange(value => {
					this.includeReferences = value;
				});
			});

		new Setting(contentEl)
			.setName(this.locale.includeAssets || 'Include assets/')
			.setDesc(this.locale.includeAssetsDesc || 'For output files (templates, images)')
			.addToggle(toggle => {
				toggle.setValue(false);
				toggle.onChange(value => {
					this.includeAssets = value;
				});
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'crystal-modal-buttons' });

		const cancelBtn = buttonContainer.createEl('button', { text: this.locale.cancelButton });
		cancelBtn.addEventListener('click', () => this.close());

		const createBtn = buttonContainer.createEl('button', {
			text: this.locale.createSkillButton || 'Create Skill',
			cls: 'mod-cta'
		});
		createBtn.addEventListener('click', () => this.createSkill());
	}

	private async createSkill(): Promise<void> {
		const name = this.nameInput.getValue().trim();
		const description = this.descInput.getValue().trim();

		// Validation
		if (!name) {
			new Notice(this.locale.skillNameRequired || 'Skill name is required');
			return;
		}

		if (!SkillParser.isValidSkillName(name)) {
			new Notice(this.locale.invalidSkillName || 'Invalid skill name. Must be kebab-case (lowercase letters, digits, hyphens).');
			return;
		}

		if (!description) {
			new Notice(this.locale.skillDescriptionRequired || 'Description is required');
			return;
		}

		const result = await this.skillLoader.createNewSkill(name, description, {
			includeScripts: this.includeScripts,
			includeReferences: this.includeReferences,
			includeAssets: this.includeAssets
		});

		if (result.success) {
			this.onSuccess(name);
			this.close();
		} else {
			new Notice(result.error || this.locale.skillCreationFailed || 'Failed to create skill');
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for validating a skill
 */
export class ValidateSkillModal extends Modal {
	private skillLoader: SkillLoader;
	private skillId: string;
	private language: LanguageCode;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.language);
	}

	constructor(app: App, skillLoader: SkillLoader, skillId: string, language: LanguageCode) {
		super(app);
		this.skillLoader = skillLoader;
		this.skillId = skillId;
		this.language = language;
	}

	async onOpen(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('crystal-validate-skill-modal');

		const title = (this.locale.validateSkillTitle || 'Validate: {name}').replace('{name}', this.skillId);
		contentEl.createEl('h2', { text: title });

		// Show loading
		const loadingEl = contentEl.createEl('p', { text: this.locale.validating || 'Validating...' });

		// Run validation
		const result = await this.skillLoader.validateSkill(this.skillId);

		loadingEl.remove();

		// Show result
		if (result.isValid) {
			const successEl = contentEl.createDiv({ cls: 'crystal-validation-success' });
			successEl.createEl('span', { text: this.locale.skillIsValid || '✓ Skill is valid' });
		} else {
			const errorEl = contentEl.createDiv({ cls: 'crystal-validation-errors' });
			errorEl.createEl('h3', { text: this.locale.errors || 'Errors' });
			const errorList = errorEl.createEl('ul');
			for (const error of result.errors) {
				const li = errorList.createEl('li');
				li.createEl('strong', { text: error.code });
				li.createSpan({ text: `: ${error.message}` });
			}
		}

		// Show warnings
		if (result.warnings.length > 0) {
			const warnEl = contentEl.createDiv({ cls: 'crystal-validation-warnings' });
			warnEl.createEl('h3', { text: this.locale.warnings || 'Warnings' });
			const warnList = warnEl.createEl('ul');
			for (const warning of result.warnings) {
				const li = warnList.createEl('li');
				li.createEl('strong', { text: warning.code });
				li.createSpan({ text: `: ${warning.message}` });
			}
		}

		// Close button
		const buttonContainer = contentEl.createDiv({ cls: 'crystal-modal-buttons' });
		const closeBtn = buttonContainer.createEl('button', { text: this.locale.closeButton || 'Close', cls: 'mod-cta' });
		closeBtn.addEventListener('click', () => this.close());
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for selecting a skill from a list
 */
export class SkillSelectorModal extends Modal {
	private skills: SkillReference[];
	private onSelect: (skillId: string) => void;
	private language: LanguageCode;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.language);
	}

	constructor(
		app: App,
		skills: SkillReference[],
		language: LanguageCode,
		onSelect: (skillId: string) => void
	) {
		super(app);
		this.skills = skills;
		this.language = language;
		this.onSelect = onSelect;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('crystal-skill-selector-modal');

		contentEl.createEl('h2', { text: this.locale.selectSkillTitle || 'Select a Skill' });

		if (this.skills.length === 0) {
			contentEl.createEl('p', {
				text: this.locale.noCustomSkillsFound || 'No custom skills found in .crystal/skills/',
				cls: 'crystal-no-skills'
			});
		} else {
			const list = contentEl.createDiv({ cls: 'crystal-skill-list' });

			for (const skill of this.skills) {
				const item = list.createDiv({ cls: 'crystal-skill-item' });
				item.createEl('strong', { text: skill.name });
				item.createEl('p', { text: skill.description, cls: 'crystal-skill-desc' });

				item.addEventListener('click', () => {
					this.onSelect(skill.id);
					this.close();
				});
			}
		}

		// Cancel button
		const buttonContainer = contentEl.createDiv({ cls: 'crystal-modal-buttons' });
		const cancelBtn = buttonContainer.createEl('button', { text: this.locale.cancelButton || 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

/**
 * Modal for editing an existing skill
 */
export class EditSkillModal extends Modal {
	private skillLoader: SkillLoader;
	private skill: Skill;
	private language: LanguageCode;
	private onSave: () => void;
	private onDelete: (skillId: string) => void;

	private get locale(): SettingsLocale {
		return getSettingsLocale(this.language);
	}

	constructor(
		app: App,
		skillLoader: SkillLoader,
		skill: Skill,
		language: LanguageCode,
		onSave: () => void,
		onDelete: (skillId: string) => void
	) {
		super(app);
		this.skillLoader = skillLoader;
		this.skill = skill;
		this.language = language;
		this.onSave = onSave;
		this.onDelete = onDelete;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('crystal-edit-skill-modal');

		// Header
		const title = (this.locale.editSkillTitle || 'Edit: {name}').replace('{name}', this.skill.metadata.name);
		contentEl.createEl('h2', { text: title });

		// Description field
		new Setting(contentEl)
			.setName(this.locale.skillDescriptionField || 'Description')
			.setDesc(this.locale.skillDescriptionFieldDesc || 'Detailed description for triggering')
			.addText(text => {
				text.setValue(this.skill.metadata.description);
				text.inputEl.style.width = '100%';
				text.inputEl.dataset.field = 'description';
			});

		// Instructions field (textarea)
		const instructionsGroup = contentEl.createDiv({ cls: 'crystal-skill-instructions-group' });
		instructionsGroup.createEl('label', {
			text: this.locale.skillInstructionsField || 'Instructions',
			cls: 'crystal-skill-label'
		});
		instructionsGroup.createEl('p', {
			text: this.locale.skillInstructionsFieldDesc || 'The main content of the skill - instructions for the AI',
			cls: 'crystal-skill-hint'
		});
		const instructionsTextarea = instructionsGroup.createEl('textarea', {
			cls: 'crystal-skill-textarea',
			attr: { rows: '12' }
		});
		instructionsTextarea.value = this.skill.instructions;

		// Resources section
		contentEl.createEl('h3', {
			text: this.locale.resourceFolders || 'Resource Folders',
			cls: 'crystal-section-header'
		});

		// Scripts
		this.renderResourceSection(contentEl, 'scripts', this.skill.scripts,
			this.locale.scriptsFolder || 'scripts/',
			this.locale.scriptsFolderDesc || 'Executable code (Python, shell scripts)'
		);

		// References
		this.renderResourceSection(contentEl, 'references', this.skill.references,
			this.locale.referencesFolder || 'references/',
			this.locale.referencesFolderDesc || 'Documentation loaded into context'
		);

		// Assets
		this.renderResourceSection(contentEl, 'assets', this.skill.assets,
			this.locale.assetsFolder || 'assets/',
			this.locale.assetsFolderDesc || 'Output files (templates, images)'
		);

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'crystal-modal-buttons' });

		// Delete button (left side)
		const deleteBtn = buttonContainer.createEl('button', {
			text: this.locale.deleteSkillButton || 'Delete Skill',
			cls: 'crystal-delete-skill-btn'
		});
		deleteBtn.addEventListener('click', () => this.confirmDelete());

		// Spacer
		buttonContainer.createDiv({ cls: 'crystal-modal-buttons-spacer' });

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', { text: this.locale.cancelButton || 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		// Save button
		const saveBtn = buttonContainer.createEl('button', {
			text: this.locale.saveButton || 'Save',
			cls: 'mod-cta'
		});
		saveBtn.addEventListener('click', () => this.saveSkill(instructionsTextarea.value));
	}

	private renderResourceSection(
		container: HTMLElement,
		type: 'scripts' | 'references' | 'assets',
		resources: { relativePath: string; absolutePath: string }[],
		title: string,
		desc: string
	): void {
		const section = container.createDiv({ cls: 'crystal-resource-section' });

		const headerRow = section.createDiv({ cls: 'crystal-resource-header' });
		headerRow.createEl('strong', { text: title });
		headerRow.createEl('span', { text: desc, cls: 'crystal-resource-desc' });

		if (resources.length === 0) {
			section.createEl('p', {
				text: this.locale.noFilesInFolder || 'No files. Add files directly to the folder.',
				cls: 'crystal-resource-empty'
			});
		} else {
			const list = section.createEl('ul', { cls: 'crystal-resource-list' });
			for (const resource of resources) {
				const li = list.createEl('li');
				li.createEl('span', { text: resource.relativePath });
			}
		}

		// Buttons container
		const buttonsContainer = section.createDiv({ cls: 'crystal-resource-buttons' });

		// Add files button
		const addBtn = buttonsContainer.createEl('button', {
			text: this.locale.addFilesButton || 'Add Files',
			cls: 'crystal-add-files-btn'
		});
		addBtn.addEventListener('click', () => {
			this.addFilesToResource(type);
		});

		// Open folder button
		const openBtn = buttonsContainer.createEl('button', {
			text: this.locale.openFolderButton || 'Open Folder',
			cls: 'crystal-open-folder-btn'
		});
		openBtn.addEventListener('click', () => {
			this.openResourceFolder(type);
		});
	}

	private async openResourceFolder(type: string): Promise<void> {
		const folderPath = `${this.skill.path}/${type}`;

		// Create folder if it doesn't exist
		await this.skillLoader.ensureResourceFolder(this.skill.id, type);

		// Open in system file manager
		const vaultPath = this.skillLoader.getVaultPath();
		if (vaultPath) {
			const fullPath = `${vaultPath}/${folderPath}`;
			const { shell } = require('electron');
			shell.openPath(fullPath);
		}
	}

	private async addFilesToResource(type: string): Promise<void> {
		// Ensure folder exists
		await this.skillLoader.ensureResourceFolder(this.skill.id, type);

		const vaultPath = this.skillLoader.getVaultPath();
		if (!vaultPath) return;

		const targetDir = `${vaultPath}/${this.skill.path}/${type}`;

		// Create hidden file input for selecting files
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.multiple = true;
		fileInput.style.display = 'none';

		fileInput.addEventListener('change', async () => {
			const files = fileInput.files;
			if (!files || files.length === 0) return;

			try {
				const fs = require('fs');
				const path = require('path');

				// Copy selected files to resource folder
				for (const file of Array.from(files)) {
					const destPath = path.join(targetDir, file.name);

					// Read file as ArrayBuffer and write to destination
					const buffer = await file.arrayBuffer();
					fs.writeFileSync(destPath, Buffer.from(buffer));
				}

				// Refresh skill data and re-render
				await this.skillLoader.refresh();
				const updatedSkill = this.skillLoader.getSkill(this.skill.id);
				if (updatedSkill) {
					this.skill = updatedSkill;
					this.onOpen(); // Re-render modal
				}

				new Notice(this.locale.filesAdded || 'Files added successfully');
			} catch (error) {
				console.error('Failed to add files:', error);
				new Notice(this.locale.filesAddFailed || 'Failed to add files');
			}

			// Clean up
			fileInput.remove();
		});

		document.body.appendChild(fileInput);
		fileInput.click();
	}

	private async saveSkill(newInstructions: string): Promise<void> {
		const descInput = this.contentEl.querySelector('input[data-field="description"]') as HTMLInputElement;
		const newDescription = descInput?.value.trim() || this.skill.metadata.description;

		const result = await this.skillLoader.updateSkill(this.skill.id, {
			description: newDescription,
			instructions: newInstructions
		});

		if (result.success) {
			new Notice(this.locale.skillSaved || 'Skill saved');
			this.onSave();
			this.close();
		} else {
			new Notice(result.error || this.locale.skillSaveFailed || 'Failed to save skill');
		}
	}

	private confirmDelete(): void {
		const confirmed = confirm(
			(this.locale.confirmDeleteSkill || 'Are you sure you want to delete skill "{name}"?')
				.replace('{name}', this.skill.metadata.name)
		);

		if (confirmed) {
			this.deleteSkill();
		}
	}

	private async deleteSkill(): Promise<void> {
		const result = await this.skillLoader.deleteSkill(this.skill.id);

		if (result.success) {
			new Notice(this.locale.skillDeleted || 'Skill deleted');
			this.onDelete(this.skill.id);
			this.close();
		} else {
			new Notice(result.error || this.locale.skillDeleteFailed || 'Failed to delete skill');
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
