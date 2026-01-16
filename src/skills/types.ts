// ============================================================================
// Skills System Types
// ============================================================================

/**
 * Resource file info (for scripts, references, assets)
 */
export interface SkillResource {
	relativePath: string;   // Relative path within skill folder (e.g., "scripts/convert.py")
	absolutePath: string;   // Full path in vault for reading
}

/**
 * Metadata from SKILL.md YAML frontmatter
 */
export interface SkillMetadata {
	name: string;           // Unique skill ID (e.g., "obsidian-markdown")
	description: string;    // Description for UI and agent matching
	license?: string;       // Optional license info
	compatibility?: string; // Optional environment requirements
}

/**
 * Full skill with instructions and resources
 */
export interface Skill {
	id: string;             // Same as metadata.name
	metadata: SkillMetadata;
	instructions: string;   // Markdown body (agent instructions)
	isBuiltin: boolean;     // Built-in vs user-defined
	path?: string;          // Path to skill folder (for vault skills)
	skillMdPath?: string;   // Full path to SKILL.md

	// Resource folders
	scripts: SkillResource[];    // Executable scripts
	references: SkillResource[]; // Documentation for context
	assets: SkillResource[];     // Output files (not loaded in context)
}

/**
 * Lightweight reference for UI lists (without full instructions)
 */
export interface SkillReference {
	id: string;
	name: string;
	description: string;
	isBuiltin: boolean;
}

/**
 * Result of parsing a SKILL.md file
 */
export interface ParsedSkill {
	metadata: SkillMetadata;
	instructions: string;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error codes
 */
export type SkillValidationErrorCode =
	| 'MISSING_SKILL_MD'
	| 'INVALID_YAML'
	| 'MISSING_NAME'
	| 'MISSING_DESCRIPTION'
	| 'INVALID_NAME_FORMAT'
	| 'BODY_TOO_LONG'
	| 'FORBIDDEN_FILE';

/**
 * Validation warning codes
 */
export type SkillValidationWarningCode = 'DESCRIPTION_TOO_SHORT';

/**
 * Validation error
 */
export interface SkillValidationError {
	code: SkillValidationErrorCode;
	message: string;
	line?: number;
}

/**
 * Validation warning
 */
export interface SkillValidationWarning {
	code: SkillValidationWarningCode;
	message: string;
}

/**
 * Validation result for a skill
 */
export interface SkillValidationResult {
	isValid: boolean;
	errors: SkillValidationError[];
	warnings: SkillValidationWarning[];
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Forbidden files in skill folder (per Anthropic guide)
 */
export const FORBIDDEN_SKILL_FILES = [
	'README.md',
	'INSTALLATION_GUIDE.md',
	'QUICK_REFERENCE.md',
	'CHANGELOG.md'
];

/**
 * Max body lines in SKILL.md (per Anthropic guide)
 */
export const MAX_SKILL_BODY_LINES = 500;

/**
 * Min description length for warnings
 */
export const MIN_DESCRIPTION_LENGTH = 30;
