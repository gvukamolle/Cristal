import type {
	SkillMetadata,
	ParsedSkill,
	SkillValidationResult,
	SkillValidationError,
	SkillValidationWarning
} from "./types";
import {
	FORBIDDEN_SKILL_FILES,
	MAX_SKILL_BODY_LINES,
	MIN_DESCRIPTION_LENGTH
} from "./types";

/**
 * Parser for SKILL.md files with YAML frontmatter
 *
 * Format:
 * ---
 * name: skill-name
 * description: Skill description
 * ---
 *
 * # Instructions
 * ...markdown body...
 */
export class SkillParser {
	private static readonly FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

	// Strict kebab-case: lowercase letters, digits, hyphens between words
	private static readonly KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

	/**
	 * Parse a complete SKILL.md file
	 */
	static parse(content: string): ParsedSkill | null {
		const match = content.match(this.FRONTMATTER_REGEX);
		if (!match) {
			return null;
		}

		const frontmatter = match[1];
		const body = match[2];
		if (!frontmatter || body === undefined) {
			return null;
		}

		const metadata = this.parseYaml(frontmatter);
		if (!metadata) {
			return null;
		}

		return {
			metadata,
			instructions: body.trim()
		};
	}

	/**
	 * Parse only the frontmatter metadata (for lazy loading)
	 */
	static parseMetadataOnly(content: string): SkillMetadata | null {
		const match = content.match(this.FRONTMATTER_REGEX);
		if (!match || !match[1]) {
			return null;
		}

		return this.parseYaml(match[1]);
	}

	/**
	 * Simple YAML parser for frontmatter
	 * Handles basic key: value pairs
	 */
	private static parseYaml(yaml: string): SkillMetadata | null {
		const lines = yaml.split("\n");
		const result: Record<string, string> = {};

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) {
				continue;
			}

			const colonIndex = trimmed.indexOf(":");
			if (colonIndex === -1) {
				continue;
			}

			const key = trimmed.slice(0, colonIndex).trim();
			let value = trimmed.slice(colonIndex + 1).trim();

			// Remove surrounding quotes if present
			if ((value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))) {
				value = value.slice(1, -1);
			}

			result[key] = value;
		}

		// Validate required fields
		if (!result.name || !result.description) {
			return null;
		}

		return {
			name: result.name,
			description: result.description,
			license: result.license,
			compatibility: result.compatibility
		};
	}

	/**
	 * Validate skill name format (strict kebab-case)
	 * Must be lowercase letters, digits, hyphens between words
	 */
	static isValidSkillName(name: string): boolean {
		if (!name || name.length > 64) {
			return false;
		}
		return this.KEBAB_CASE_REGEX.test(name);
	}

	/**
	 * Count lines in body
	 */
	static countBodyLines(body: string): number {
		if (!body || body.trim() === '') return 0;
		return body.split('\n').length;
	}

	/**
	 * Full validation of a skill folder according to Anthropic guide
	 *
	 * @param skillMdContent - Content of SKILL.md file (null if missing)
	 * @param folderFiles - List of all files in skill folder (relative paths)
	 */
	static validate(
		skillMdContent: string | null,
		folderFiles: string[]
	): SkillValidationResult {
		const errors: SkillValidationError[] = [];
		const warnings: SkillValidationWarning[] = [];

		// 1. Check SKILL.md exists
		if (!skillMdContent) {
			errors.push({
				code: 'MISSING_SKILL_MD',
				message: 'SKILL.md file is required'
			});
			return { isValid: false, errors, warnings };
		}

		// 2. Parse and validate frontmatter
		const parsed = this.parse(skillMdContent);
		if (!parsed) {
			errors.push({
				code: 'INVALID_YAML',
				message: 'Invalid YAML frontmatter format'
			});
			return { isValid: false, errors, warnings };
		}

		// 3. Check required fields
		if (!parsed.metadata.name) {
			errors.push({
				code: 'MISSING_NAME',
				message: 'Field "name" is required in frontmatter'
			});
		}

		if (!parsed.metadata.description) {
			errors.push({
				code: 'MISSING_DESCRIPTION',
				message: 'Field "description" is required in frontmatter'
			});
		}

		// 4. Validate name format (strict kebab-case)
		if (parsed.metadata.name && !this.isValidSkillName(parsed.metadata.name)) {
			errors.push({
				code: 'INVALID_NAME_FORMAT',
				message: `Name "${parsed.metadata.name}" must be kebab-case (lowercase letters, digits, hyphens)`
			});
		}

		// 5. Check body length
		const bodyLines = this.countBodyLines(parsed.instructions);
		if (bodyLines > MAX_SKILL_BODY_LINES) {
			errors.push({
				code: 'BODY_TOO_LONG',
				message: `Body has ${bodyLines} lines, maximum is ${MAX_SKILL_BODY_LINES}`
			});
		}

		// 6. Check for forbidden files
		for (const file of folderFiles) {
			const filename = file.split('/').pop() || '';
			if (FORBIDDEN_SKILL_FILES.includes(filename)) {
				errors.push({
					code: 'FORBIDDEN_FILE',
					message: `File "${filename}" is not allowed in skill folder`
				});
			}
		}

		// 7. Warnings
		if (parsed.metadata.description && parsed.metadata.description.length < MIN_DESCRIPTION_LENGTH) {
			warnings.push({
				code: 'DESCRIPTION_TOO_SHORT',
				message: 'Description is very short. Consider adding more trigger contexts.'
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings
		};
	}
}
