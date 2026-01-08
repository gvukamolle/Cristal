// ============================================================================
// CLI Message Types (from stream-json output)
// ============================================================================

export interface InitMessage {
	type: "system";
	subtype: "init";
	session_id: string;
	tools: string[];
	mcp_servers: Record<string, unknown>;
}

export interface ResultMessage {
	type: "result";
	subtype: "success" | "error";
	result: string;
	session_id: string;
	is_error: boolean;
	total_cost_usd: number;
	duration_ms: number;
	duration_api_ms: number;
	num_turns: number;
}

export interface ConversationMessage {
	type: "user" | "assistant";
	message: {
		role: "user" | "assistant";
		content: ContentBlock[];
	};
	session_id: string;
	uuid?: string;
}

export type ContentBlock =
	| TextBlock
	| ToolUseBlock
	| ToolResultBlock;

export interface TextBlock {
	type: "text";
	text: string;
}

export interface ToolUseBlock {
	type: "tool_use";
	id: string;
	name: string;
	input: unknown;
}

export interface ToolResultBlock {
	type: "tool_result";
	tool_use_id: string;
	content: string;
}

export type CLIMessage = InitMessage | ResultMessage | ConversationMessage;

// ============================================================================
// UI State Types
// ============================================================================

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	isStreaming?: boolean;
	isError?: boolean;
}

export interface ChatSession {
	id: string;
	cliSessionId: string | null;  // Claude CLI session ID for --resume
	messages: ChatMessage[];
	createdAt: number;
	title?: string;  // Auto-generated from first message
}

// ============================================================================
// Plugin Data (persisted)
// ============================================================================

export interface PluginData {
	settings: ClaudeRockSettings;
	sessions: ChatSession[];
	currentSessionId: string | null;
}

// ============================================================================
// Slash Commands
// ============================================================================

export interface SlashCommand {
	id: string;
	name: string;           // Display name (e.g., "Summarize")
	command: string;        // Command trigger (e.g., "/summarize")
	prompt: string;         // Prompt template (use {text} for context)
	description: string;    // Short description for autocomplete
	icon: string;           // Obsidian icon name
	isBuiltin: boolean;     // Built-in commands can't be deleted
	enabled: boolean;       // Can be toggled on/off
}

// ============================================================================
// Plugin Settings
// ============================================================================

// Re-export LanguageCode for convenience
export type { LanguageCode } from "./systemPrompts";

export interface ClaudePermissions {
	webSearch: boolean;
	webFetch: boolean;
	task: boolean;
}

export interface ClaudeRockSettings {
	cliPath: string;
	language: import("./systemPrompts").LanguageCode;
	permissions: ClaudePermissions;
	customCommands: SlashCommand[];
	disabledBuiltinCommands: string[];  // IDs of disabled built-in commands
}

export const DEFAULT_SETTINGS: ClaudeRockSettings = {
	cliPath: "/usr/local/bin/claude",
	language: "en",
	permissions: {
		webSearch: false,
		webFetch: false,
		task: false
	},
	customCommands: [],
	disabledBuiltinCommands: []
};
