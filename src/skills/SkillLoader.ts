import type { Vault } from "obsidian";
import { FileSystemAdapter } from "obsidian";
import * as path from "path";
import * as fs from "fs";
import type { Skill, SkillReference, SkillResource, SkillValidationResult } from "./types";
import { SkillParser } from "./SkillParser";
import type { CLIType } from "../types";
import type { LanguageCode } from "../systemPrompts";
import { getSkillDescription } from "../skillLocales";

// Import builtin skills
import { OBSIDIAN_MARKDOWN_SKILL } from "./builtins/obsidian-markdown";
import { OBSIDIAN_CANVAS_SKILL } from "./builtins/obsidian-canvas";
import { OBSIDIAN_BASE_SKILL } from "./builtins/obsidian-base";
import { OBSIDIAN_LINKS_SKILL } from "./builtins/obsidian-links";
import { OBSIDIAN_TAGS_SKILL } from "./builtins/obsidian-tags";
import { OBSIDIAN_DATAVIEW_SKILL } from "./builtins/obsidian-dataview";

const BUILTIN_SKILLS_RAW: string[] = [
	OBSIDIAN_MARKDOWN_SKILL,
	OBSIDIAN_CANVAS_SKILL,
	OBSIDIAN_BASE_SKILL,
	OBSIDIAN_LINKS_SKILL,
	OBSIDIAN_TAGS_SKILL,
	OBSIDIAN_DATAVIEW_SKILL
];

const SKILLS_FOLDER = ".crystal/skills";

// Resource folder names
const RESOURCE_FOLDERS = ['scripts', 'references', 'assets'] as const;
type ResourceFolderType = typeof RESOURCE_FOLDERS[number];

/**
 * Loads and manages skills from builtin and vault sources
 * Supports full skill structure: SKILL.md + scripts/ + references/ + assets/
 */
export class SkillLoader {
	private builtinSkills: Map<string, Skill> = new Map();
	private vaultSkills: Map<string, Skill> = new Map();

	constructor(private vault: Vault) {}

	/**
	 * Initialize by loading all skills
	 */
	async initialize(): Promise<void> {
		this.loadBuiltinSkills();
		await this.discoverVaultSkills();
	}

	/**
	 * Load builtin skills from embedded strings
	 * (builtins don't have scripts/references/assets - they are pure instructions)
	 */
	private loadBuiltinSkills(): void {
		for (const raw of BUILTIN_SKILLS_RAW) {
			const parsed = SkillParser.parse(raw);
			if (parsed) {
				const skill: Skill = {
					id: parsed.metadata.name,
					metadata: parsed.metadata,
					instructions: parsed.instructions,
					isBuiltin: true,
					scripts: [],
					references: [],
					assets: []
				};
				this.builtinSkills.set(skill.id, skill);
			}
		}
	}

	/**
	 * Discover custom skills in vault's .crystal/skills/ folder
	 * Uses file system directly since Obsidian cache may not be updated
	 */
	async discoverVaultSkills(): Promise<void> {
		this.vaultSkills.clear();

		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return;
		}

		const skillsDir = path.join(adapter.getBasePath(), SKILLS_FOLDER);

		// Check if skills folder exists
		if (!fs.existsSync(skillsDir)) {
			return;
		}

		// Get all subdirectories (each is a skill)
		const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
		const skillFolders = entries.filter(e => e.isDirectory());

		for (const skillFolder of skillFolders) {
			const skill = await this.loadSkillFromFolderFS(skillFolder.name, skillsDir);
			if (skill) {
				this.vaultSkills.set(skill.id, skill);
			}
		}
	}

	/**
	 * Load a complete skill from a folder using file system directly
	 */
	private async loadSkillFromFolderFS(
		folderName: string,
		skillsDir: string
	): Promise<Skill | null> {
		const skillDir = path.join(skillsDir, folderName);
		const skillMdPath = path.join(skillDir, 'SKILL.md');

		// Check if SKILL.md exists
		if (!fs.existsSync(skillMdPath)) {
			console.warn(`SkillLoader: No SKILL.md in ${skillDir}`);
			return null;
		}

		try {
			const content = fs.readFileSync(skillMdPath, 'utf-8');
			const parsed = SkillParser.parse(content);

			if (!parsed || !SkillParser.isValidSkillName(parsed.metadata.name)) {
				console.warn(`SkillLoader: Invalid skill in ${skillDir}`);
				return null;
			}

			// Load resources from subfolders
			const vaultRelativePath = `${SKILLS_FOLDER}/${folderName}`;
			const scripts = this.loadResourceFolderFS(skillDir, 'scripts', vaultRelativePath);
			const references = this.loadResourceFolderFS(skillDir, 'references', vaultRelativePath);
			const assets = this.loadResourceFolderFS(skillDir, 'assets', vaultRelativePath);

			const skill: Skill = {
				id: parsed.metadata.name,
				metadata: parsed.metadata,
				instructions: parsed.instructions,
				isBuiltin: false,
				path: vaultRelativePath,
				skillMdPath: `${vaultRelativePath}/SKILL.md`,
				scripts,
				references,
				assets
			};

			return skill;
		} catch (e) {
			console.error(`SkillLoader: Failed to load skill from ${skillDir}:`, e);
			return null;
		}
	}

	/**
	 * Load resources from a subfolder using file system directly
	 */
	private loadResourceFolderFS(
		skillDir: string,
		resourceType: ResourceFolderType,
		vaultRelativePath: string
	): SkillResource[] {
		const resources: SkillResource[] = [];
		const resourceDir = path.join(skillDir, resourceType);

		if (!fs.existsSync(resourceDir)) {
			return resources;
		}

		// Recursively collect all files
		const collectFiles = (dir: string, relativePath: string): void => {
			const entries = fs.readdirSync(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					// Recurse into subdirectory
					collectFiles(
						fullPath,
						relativePath ? `${relativePath}/${entry.name}` : entry.name
					);
				} else {
					// Skip .gitkeep
					if (entry.name === '.gitkeep') continue;

					const relPath = relativePath
						? `${resourceType}/${relativePath}/${entry.name}`
						: `${resourceType}/${entry.name}`;

					resources.push({
						relativePath: relPath,
						absolutePath: `${vaultRelativePath}/${relPath}`
					});
				}
			}
		};

		collectFiles(resourceDir, '');
		return resources;
	}

	/**
	 * Get all available skills as references (for UI)
	 * @param language - Optional language code for localized descriptions (for builtin skills)
	 */
	getSkillReferences(language?: LanguageCode): SkillReference[] {
		const refs: SkillReference[] = [];

		// Builtin skills first (with localized descriptions if available)
		for (const skill of this.builtinSkills.values()) {
			// Get localized description for builtin skills
			const localizedDesc = language
				? getSkillDescription(skill.id, language)
				: null;

			refs.push({
				id: skill.id,
				name: skill.metadata.name,
				description: localizedDesc || skill.metadata.description,
				isBuiltin: true
			});
		}

		// Then vault skills (can override builtins by having same ID)
		// Vault skills keep their original descriptions (user-defined)
		for (const skill of this.vaultSkills.values()) {
			// Check if this overrides a builtin
			const existingIndex = refs.findIndex((r) => r.id === skill.id);
			if (existingIndex !== -1) {
				refs[existingIndex] = {
					id: skill.id,
					name: skill.metadata.name,
					description: skill.metadata.description,
					isBuiltin: false
				};
			} else {
				refs.push({
					id: skill.id,
					name: skill.metadata.name,
					description: skill.metadata.description,
					isBuiltin: false
				});
			}
		}

		return refs;
	}

	/**
	 * Get a specific skill by ID
	 * Vault skills take precedence over builtins
	 */
	getSkill(id: string): Skill | null {
		return this.vaultSkills.get(id) || this.builtinSkills.get(id) || null;
	}

	/**
	 * Build combined instructions from enabled skills
	 */
	buildSkillInstructions(enabledSkillIds: string[]): string {
		if (enabledSkillIds.length === 0) {
			return "";
		}

		const instructions: string[] = [];

		for (const id of enabledSkillIds) {
			const skill = this.getSkill(id);
			if (skill) {
				instructions.push(`## ${skill.metadata.name}\n\n${skill.instructions}`);
			}
		}

		if (instructions.length === 0) {
			return "";
		}

		return `# Active Skills\n\n${instructions.join("\n\n---\n\n")}`;
	}

	/**
	 * Refresh vault skills (call when files change)
	 */
	async refresh(): Promise<void> {
		await this.discoverVaultSkills();
	}

	/**
	 * Validate a skill folder using file system directly
	 */
	async validateSkill(skillId: string): Promise<SkillValidationResult> {
		const skill = this.vaultSkills.get(skillId);
		if (!skill || !skill.path) {
			return {
				isValid: false,
				errors: [{ code: 'MISSING_SKILL_MD', message: 'Skill not found' }],
				warnings: []
			};
		}

		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return {
				isValid: false,
				errors: [{ code: 'MISSING_SKILL_MD', message: 'Not a file system adapter' }],
				warnings: []
			};
		}

		const vaultPath = adapter.getBasePath();
		const skillDir = path.join(vaultPath, skill.path);
		const skillMdPath = path.join(skillDir, 'SKILL.md');

		// Read SKILL.md content using fs
		let content: string | null = null;
		if (fs.existsSync(skillMdPath)) {
			content = fs.readFileSync(skillMdPath, 'utf-8');
		}

		// Collect all files in skill folder using fs
		const files: string[] = [];
		const collectFilesFS = (dir: string, prefix: string): void => {
			if (!fs.existsSync(dir)) return;

			const entries = fs.readdirSync(dir, { withFileTypes: true });
			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);
				if (entry.isDirectory()) {
					collectFilesFS(fullPath, prefix ? `${prefix}/${entry.name}` : entry.name);
				} else {
					const filePath = prefix ? `${prefix}/${entry.name}` : entry.name;
					files.push(filePath);
				}
			}
		};
		collectFilesFS(skillDir, '');

		return SkillParser.validate(content, files);
	}

	/**
	 * Sync enabled skills to CLI-specific directories
	 * Now copies entire skill structure including scripts/, references/, assets/
	 */
	async syncSkillsForAgent(cliType: CLIType, enabledSkillIds: string[]): Promise<void> {
		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			console.warn("SkillLoader: Cannot sync skills - not a file system adapter");
			return;
		}

		const vaultPath = adapter.getBasePath();
		const skillsDir = path.join(vaultPath, ".claude", "skills");

		try {
			// Create skills directory if it doesn't exist
			if (!fs.existsSync(skillsDir)) {
				fs.mkdirSync(skillsDir, { recursive: true });
			}

			// Get existing skill folders
			const existingFolders = fs.existsSync(skillsDir)
				? fs.readdirSync(skillsDir).filter(f =>
					fs.statSync(path.join(skillsDir, f)).isDirectory()
				)
				: [];

			// Remove skills that are no longer enabled
			for (const folder of existingFolders) {
				if (!enabledSkillIds.includes(folder)) {
					const folderPath = path.join(skillsDir, folder);
					fs.rmSync(folderPath, { recursive: true, force: true });
					console.log(`SkillLoader: Removed skill folder ${folderPath}`);
				}
			}

			// Create/update enabled skills
			for (const skillId of enabledSkillIds) {
				const skill = this.getSkill(skillId);
				if (!skill) continue;

				await this.syncSingleSkill(skill, skillsDir, vaultPath);
			}

			console.log(`SkillLoader: Synced ${enabledSkillIds.length} skills for ${cliType}`);
		} catch (error) {
			console.error(`SkillLoader: Failed to sync skills for ${cliType}:`, error);
		}
	}

	/**
	 * Sync a single skill with all its resources
	 */
	private async syncSingleSkill(
		skill: Skill,
		targetSkillsDir: string,
		vaultPath: string
	): Promise<void> {
		const skillFolder = path.join(targetSkillsDir, skill.id);

		// Remove existing folder to ensure clean sync
		if (fs.existsSync(skillFolder)) {
			fs.rmSync(skillFolder, { recursive: true, force: true });
		}

		// Create skill folder
		fs.mkdirSync(skillFolder, { recursive: true });

		// Write SKILL.md
		const skillMdContent = this.buildSkillMdContent(skill);
		fs.writeFileSync(path.join(skillFolder, 'SKILL.md'), skillMdContent, 'utf-8');

		// For vault skills, copy resource folders (even if empty)
		if (!skill.isBuiltin && skill.path) {
			const sourceSkillDir = path.join(vaultPath, skill.path);

			// Always sync resource folders if they exist in source
			for (const folderType of RESOURCE_FOLDERS) {
				const sourceFolder = path.join(sourceSkillDir, folderType);
				const targetFolder = path.join(skillFolder, folderType);

				if (fs.existsSync(sourceFolder)) {
					// Create folder in target
					fs.mkdirSync(targetFolder, { recursive: true });

					// Copy all files (excluding .gitkeep since target doesn't need it)
					this.copyFolderContents(sourceFolder, targetFolder);
				}
			}
		}

		console.log(`SkillLoader: Synced skill ${skill.id} to ${skillFolder}`);
	}

	/**
	 * Recursively copy folder contents
	 */
	private copyFolderContents(sourceDir: string, targetDir: string): void {
		if (!fs.existsSync(sourceDir)) return;

		const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

		for (const entry of entries) {
			const sourcePath = path.join(sourceDir, entry.name);
			const targetPath = path.join(targetDir, entry.name);

			if (entry.isDirectory()) {
				fs.mkdirSync(targetPath, { recursive: true });
				this.copyFolderContents(sourcePath, targetPath);
			} else {
				fs.copyFileSync(sourcePath, targetPath);
			}
		}
	}


	/**
	 * Build SKILL.md content from skill object
	 */
	private buildSkillMdContent(skill: Skill): string {
		let frontmatter = `---\nname: ${skill.metadata.name}\ndescription: ${skill.metadata.description}`;

		if (skill.metadata.license) {
			frontmatter += `\nlicense: ${skill.metadata.license}`;
		}
		if (skill.metadata.compatibility) {
			frontmatter += `\ncompatibility: ${skill.metadata.compatibility}`;
		}

		frontmatter += `\n---\n\n`;

		return frontmatter + skill.instructions;
	}

	/**
	 * Create a new skill folder with template
	 * Uses file system directly to avoid Obsidian cache issues
	 */
	async createNewSkill(
		name: string,
		description: string,
		options: { includeScripts?: boolean; includeReferences?: boolean; includeAssets?: boolean }
	): Promise<{ success: boolean; path?: string; error?: string }> {
		// Validate name format
		if (!SkillParser.isValidSkillName(name)) {
			return {
				success: false,
				error: `Invalid skill name "${name}". Must be kebab-case (lowercase letters, digits, hyphens).`
			};
		}

		// Check if skill already exists
		if (this.vaultSkills.has(name) || this.builtinSkills.has(name)) {
			return { success: false, error: `Skill "${name}" already exists.` };
		}

		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return { success: false, error: "Not a file system adapter" };
		}

		const vaultPath = adapter.getBasePath();
		const skillsDir = path.join(vaultPath, SKILLS_FOLDER);
		const skillDir = path.join(skillsDir, name);

		try {
			// Check if folder already exists on disk
			if (fs.existsSync(skillDir)) {
				return { success: false, error: `Folder "${name}" already exists.` };
			}

			// Ensure .crystal/skills folder exists
			if (!fs.existsSync(skillsDir)) {
				fs.mkdirSync(skillsDir, { recursive: true });
			}

			// Create skill folder
			fs.mkdirSync(skillDir);

			// Create SKILL.md with template
			const skillMdContent = this.generateSkillMdTemplate(name, description);
			fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMdContent, 'utf-8');

			// Create optional folders with .gitkeep
			if (options.includeScripts) {
				const scriptsDir = path.join(skillDir, 'scripts');
				fs.mkdirSync(scriptsDir);
				fs.writeFileSync(path.join(scriptsDir, '.gitkeep'), '', 'utf-8');
			}

			if (options.includeReferences) {
				const refsDir = path.join(skillDir, 'references');
				fs.mkdirSync(refsDir);
				fs.writeFileSync(path.join(refsDir, '.gitkeep'), '', 'utf-8');
			}

			if (options.includeAssets) {
				const assetsDir = path.join(skillDir, 'assets');
				fs.mkdirSync(assetsDir);
				fs.writeFileSync(path.join(assetsDir, '.gitkeep'), '', 'utf-8');
			}

			// Wait a bit for Obsidian to detect new files
			await new Promise(resolve => setTimeout(resolve, 500));

			// Refresh skills list
			await this.refresh();

			return { success: true, path: `${SKILLS_FOLDER}/${name}` };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	}

	/**
	 * Generate SKILL.md template content
	 */
	private generateSkillMdTemplate(name: string, description: string): string {
		const title = this.kebabToTitle(name);
		return `---
name: ${name}
description: ${description}
---

# ${title}

## Overview

[Describe what this skill does and when to use it]

## Instructions

[Add specific instructions for the AI agent]

## Examples

[Add usage examples]
`;
	}

	/**
	 * Convert kebab-case to Title Case
	 */
	private kebabToTitle(kebab: string): string {
		return kebab
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	/**
	 * Get vault base path (for external use)
	 */
	getVaultPath(): string | null {
		const adapter = this.vault.adapter;
		if (adapter instanceof FileSystemAdapter) {
			return adapter.getBasePath();
		}
		return null;
	}

	/**
	 * Ensure a resource folder exists for a skill
	 */
	async ensureResourceFolder(skillId: string, resourceType: string): Promise<void> {
		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return;
		}

		const vaultPath = adapter.getBasePath();
		const resourceDir = path.join(vaultPath, SKILLS_FOLDER, skillId, resourceType);

		if (!fs.existsSync(resourceDir)) {
			fs.mkdirSync(resourceDir, { recursive: true });
			// Add .gitkeep
			fs.writeFileSync(path.join(resourceDir, '.gitkeep'), '', 'utf-8');
		}
	}

	/**
	 * Update a skill's description and/or instructions
	 */
	async updateSkill(
		skillId: string,
		updates: { description?: string; instructions?: string }
	): Promise<{ success: boolean; error?: string }> {
		const skill = this.vaultSkills.get(skillId);
		if (!skill || !skill.skillMdPath) {
			return { success: false, error: 'Skill not found' };
		}

		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return { success: false, error: 'Not a file system adapter' };
		}

		const vaultPath = adapter.getBasePath();
		const skillMdPath = path.join(vaultPath, skill.skillMdPath);

		try {
			// Build new content
			const newDescription = updates.description ?? skill.metadata.description;
			const newInstructions = updates.instructions ?? skill.instructions;

			let frontmatter = `---\nname: ${skill.metadata.name}\ndescription: ${newDescription}`;

			if (skill.metadata.license) {
				frontmatter += `\nlicense: ${skill.metadata.license}`;
			}
			if (skill.metadata.compatibility) {
				frontmatter += `\ncompatibility: ${skill.metadata.compatibility}`;
			}

			frontmatter += `\n---\n\n`;

			const newContent = frontmatter + newInstructions;

			fs.writeFileSync(skillMdPath, newContent, 'utf-8');

			// Refresh skills
			await this.refresh();

			return { success: true };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	}

	/**
	 * Delete a skill completely
	 */
	async deleteSkill(skillId: string): Promise<{ success: boolean; error?: string }> {
		const skill = this.vaultSkills.get(skillId);
		if (!skill || !skill.path) {
			return { success: false, error: 'Skill not found' };
		}

		const adapter = this.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			return { success: false, error: 'Not a file system adapter' };
		}

		const vaultPath = adapter.getBasePath();
		const skillDir = path.join(vaultPath, skill.path);

		try {
			if (fs.existsSync(skillDir)) {
				fs.rmSync(skillDir, { recursive: true, force: true });
			}

			// Remove from cache
			this.vaultSkills.delete(skillId);

			return { success: true };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	}
}
