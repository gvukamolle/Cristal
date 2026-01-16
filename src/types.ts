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
	// Usage stats (cumulative for session) - snake_case from CLI
	usage?: {
		input_tokens: number;
		output_tokens: number;
		cache_read_input_tokens: number;
		cache_creation_input_tokens: number;
	};
}

export interface CompactBoundaryMessage {
	type: "system";
	subtype: "compact_boundary";
	session_id: string;
	compact_metadata: {
		trigger: "manual" | "auto";
		pre_tokens: number;
	};
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

export type CLIMessage = InitMessage | ResultMessage | ConversationMessage | CompactBoundaryMessage;

// ============================================================================
// UI State Types
// ============================================================================

// Context for selected text with position info for precise replacement
export interface SelectionContext {
	content: string;      // Selected text content
	source: string;       // Source file name (display)
	filePath: string;     // Full path to source file
	startLine: number;    // Start line (0-based)
	startCh: number;      // Start character in line
	endLine: number;      // End line
	endCh: number;        // End character in line
}

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
	isStreaming?: boolean;
	isError?: boolean;
	thinkingSteps?: ToolUseBlock[];  // Tool steps performed for this message
	selectionContext?: SelectionContext;  // Selection context for this response (for replace/append)
	attachedFiles?: { name: string; path: string; type: string }[];  // Files attached to this message
	activeFileContext?: { name: string };  // Active file context included in this message
}

export interface ChatSession {
	id: string;
	cliSessionId: string | null;  // Claude CLI session ID for --resume
	messages: ChatMessage[];
	createdAt: number;
	title?: string;  // Auto-generated from first message
	model?: ClaudeModel | string;  // Model used for this session
	tokenStats?: SessionTokenStats;  // Token statistics for this session
	agentId?: string;  // Which agent was used for this session
}

// ============================================================================
// Plugin Data (persisted)
// ============================================================================

export interface PluginData {
	settings: CrystalSettings;
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

// ============================================================================
// AI Provider Types
// ============================================================================

// Claude model types
export type ClaudeModel = "claude-haiku-4-5-20251001" | "claude-sonnet-4-5-20250929" | "claude-opus-4-5-20251101";

export const CLAUDE_MODELS: { value: ClaudeModel; label: string }[] = [
	{ value: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
	{ value: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
	{ value: "claude-opus-4-5-20251101", label: "Opus 4.5" }
];

export interface ClaudePermissions {
	// Web operations
	webSearch: boolean;
	webFetch: boolean;
	// Agent operations
	task: boolean;
	// File operations
	fileRead: boolean;
	fileWrite: boolean;
	fileEdit: boolean;
	// Advanced
	extendedThinking: boolean;
}

export const DEFAULT_CLAUDE_PERMISSIONS: ClaudePermissions = {
	webSearch: false,
	webFetch: false,
	task: false,
	fileRead: true,
	fileWrite: true,
	fileEdit: true,
	extendedThinking: false
};

// ============================================================================
// Agent Personalization
// ============================================================================

export interface AgentPersonalization {
	userName: string;
	userRole: string;
	workContext: string;
	communicationStyle: string;
	currentFocus: string;
}

export const DEFAULT_AGENT_PERSONALIZATION: AgentPersonalization = {
	userName: "",
	userRole: "",
	workContext: "",
	communicationStyle: "",
	currentFocus: ""
};

// ============================================================================
// Agent Configuration
// ============================================================================

export type CLIType = "claude";

export interface AgentConfig {
	id: string;                      // Unique ID
	cliType: CLIType;                // Type of CLI
	name: string;                    // User-defined name
	description: string;             // Description
	enabled: boolean;                // Whether agent is enabled
	cliPath: string;                 // Path to CLI executable
	model: string;                   // Default model
	disabledModels?: string[];       // Models disabled by user (hidden from dropdown)
	// Claude-specific
	thinkingEnabled?: boolean;       // Extended thinking mode (legacy, use permissions.extendedThinking)
	permissions?: ClaudePermissions; // Claude permissions
	// Skills
	enabledSkills?: string[];        // IDs of enabled skills for this agent
}

// CLI descriptions
export const CLI_INFO: Record<CLIType, { name: string; description: string; available: boolean }> = {
	claude: { name: "Claude Code", description: "Anthropic Claude CLI", available: true }
};

export interface CrystalSettings {
	// New agent-based settings
	agents: AgentConfig[];
	defaultAgentId: string | null;

	// General settings
	language: import("./systemPrompts").LanguageCode;
	customCommands: SlashCommand[];
	disabledBuiltinCommands: string[];  // IDs of disabled built-in commands
	tokenHistory: Record<string, number>;  // date -> tokens used that day
	agentTokenHistory: Record<string, Record<string, number>>;  // agentId -> date -> tokens
	gettingStartedDismissed: boolean;  // Whether the Getting Started section is collapsed

	// Agent personalization (user context for system prompt)
	agentPersonalization: AgentPersonalization;

	// Legacy fields for backwards compatibility (will be migrated)
	cliPath?: string;
	permissions?: ClaudePermissions;
	defaultModel?: ClaudeModel;
	thinkingEnabled?: boolean;
}

// Empty by default - user must add agents in settings
export const DEFAULT_AGENTS: AgentConfig[] = [];

export const DEFAULT_SETTINGS: CrystalSettings = {
	agents: DEFAULT_AGENTS,
	defaultAgentId: null,
	language: "en",
	customCommands: [],
	disabledBuiltinCommands: [],
	tokenHistory: {},
	agentTokenHistory: {},
	gettingStartedDismissed: false,
	agentPersonalization: DEFAULT_AGENT_PERSONALIZATION
};

// ============================================================================
// Service Event Types (for parallel sessions)
// ============================================================================

export interface StreamingEvent {
	sessionId: string;
	text: string;
}

export interface CompleteEvent {
	sessionId: string;
	code: number | null;
}

export interface InitEvent {
	sessionId: string;
	cliSessionId: string;
}

export interface AssistantEvent {
	sessionId: string;
	message: ConversationMessage;
}

export interface ResultEvent {
	sessionId: string;
	result: ResultMessage;
}

export interface ErrorEvent {
	sessionId: string;
	error: string;
}

// ============================================================================
// Context Tracking Types
// ============================================================================

export interface SessionTokenStats {
	inputTokens: number;
	outputTokens: number;
	contextWindow: number;
	cacheReadTokens: number;
	compactCount: number;
	lastCompactPreTokens: number | null;
}

export interface ContextUsage {
	used: number;        // current tokens
	limit: number;       // effective limit (60%)
	nominal: number;     // full window size
	percentage: number;  // 0-100
}

export interface ContextUpdateEvent {
	sessionId: string;
	stats: SessionTokenStats;
	usage: ContextUsage;
}

export interface CompactEvent {
	sessionId: string;
	trigger: "manual" | "auto";
	preTokens: number;
}

export interface ToolUseEvent {
	sessionId: string;
	tool: ToolUseBlock;
}

export interface ToolResultEvent {
	sessionId: string;
	result: ToolResultBlock;
}

// Pending message for background sessions
export interface PendingMessage {
	text: string;
	tools: ToolUseBlock[];
}

