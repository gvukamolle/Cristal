import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import * as os from "os";
import type { ToolUseBlock, PendingMessage } from "./types";

// Codex CLI event types
interface CodexThreadStarted {
	type: "thread.started";
	thread_id: string;
}

interface CodexTurnStarted {
	type: "turn.started";
}

interface CodexItem {
	id: string;
	type: "command_execution" | "file_read" | "file_write" | "file_change"
		| "agent_message" | "reasoning" | "mcp_tool_call" | "web_search"
		| "todo_list" | "error";
	// Common fields
	command?: string;
	text?: string;
	status?: string;
	// Reasoning specific
	summary?: string[];
	content?: string[];
	// File change specific
	changes?: Array<{ path: string; kind: "add" | "delete" | "update" }>;
	// MCP specific
	server?: string;
	tool?: string;
	arguments?: unknown;
	result?: unknown;
	// Web search specific
	query?: string;
	// Todo list specific
	items?: Array<{ text: string; completed: boolean }>;
}

interface CodexItemEvent {
	type: "item.started" | "item.updated" | "item.completed";
	item: CodexItem;
}

interface CodexTurnCompleted {
	type: "turn.completed";
	usage: {
		input_tokens: number;
		cached_input_tokens: number;
		output_tokens: number;
	};
}

interface CodexError {
	type: "error";
	message: string;
}

type CodexEvent = CodexThreadStarted | CodexTurnStarted | CodexItemEvent | CodexTurnCompleted | CodexError;

export class CodexService extends EventEmitter {
	private processes: Map<string, ChildProcess> = new Map();
	private threadIds: Map<string, string> = new Map();
	private pendingMessages: Map<string, PendingMessage> = new Map();
	private cliPath: string;
	private workingDir: string;
	private debug = true;

	constructor(cliPath: string = "codex", workingDir: string = process.cwd()) {
		super();
		this.cliPath = cliPath;
		this.workingDir = workingDir;
	}

	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log("[CodexService]", ...args);
		}
	}

	setCliPath(path: string): void {
		this.cliPath = path;
	}

	setWorkingDir(dir: string): void {
		this.workingDir = dir;
	}

	async sendMessage(prompt: string, sessionId: string, threadId?: string, model?: string): Promise<void> {
		// Abort existing process for this sessionId
		const existingProcess = this.processes.get(sessionId);
		if (existingProcess) {
			this.log(`Aborting existing process for session ${sessionId}`);
			this.abort(sessionId);
		}

		this.pendingMessages.set(sessionId, { text: "", tools: [] });

		// Build args - always use full-access mode
		const args = ["exec", "--json", "--skip-git-repo-check", "--sandbox", "danger-full-access"];

		if (model) {
			args.push("--model", model);
		}

		// Note: --reasoning-effort is not a valid flag for codex exec
		// Reasoning level is configured via config.toml or future API

		// Resume or new prompt
		if (threadId) {
			args.push("resume", "--last", prompt);
		} else {
			args.push(prompt);
		}

		this.log("Spawning:", this.cliPath, args, "for sessionId:", sessionId);

		const homeDir = process.env.HOME || os.homedir();
		const pathAdditions = [
			`${homeDir}/.npm-global/bin`,  // Custom npm global prefix
			"/usr/local/bin",
			"/opt/homebrew/bin",
			"/usr/bin",
			"/bin"
		];
		const env = {
			...process.env,
			PATH: pathAdditions.join(":") + ":" + (process.env.PATH || ""),
			HOME: homeDir,
			USER: process.env.USER || os.userInfo().username
		};

		const childProcess = spawn(this.cliPath, args, {
			cwd: this.workingDir,
			env,
			stdio: ["pipe", "pipe", "pipe"]
		});

		this.processes.set(sessionId, childProcess);
		childProcess.stdin?.end();

		this.log("Process spawned, PID:", childProcess.pid);

		let buffer = "";
		let accumulatedText = "";

		childProcess.stdout?.on("data", (chunk: Buffer) => {
			const chunkStr = chunk.toString();
			this.log("stdout chunk:", chunkStr.length, "bytes");
			buffer += chunkStr;

			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim()) {
					const result = this.parseLine(line, sessionId);
					if (result?.type === "text") {
						accumulatedText = result.text;
						const pending = this.pendingMessages.get(sessionId);
						if (pending) {
							pending.text = accumulatedText;
						}
						this.emit("streaming", { sessionId, text: accumulatedText });
					}
				}
			}
		});

		childProcess.stderr?.on("data", (data: Buffer) => {
			const errorText = data.toString();
			this.log("stderr:", errorText);
			// Codex writes progress to stderr, not all are errors
		});

		childProcess.on("error", (err: Error) => {
			this.log("Process error:", err.message);
			this.emit("error", { sessionId, error: `Failed to start Codex CLI: ${err.message}` });
			this.processes.delete(sessionId);
		});

		childProcess.on("close", (code: number | null) => {
			this.log("Process closed with code:", code);
			if (buffer.trim()) {
				this.parseLine(buffer, sessionId);
			}
			this.emit("complete", { sessionId, code });
			this.processes.delete(sessionId);
		});
	}

	private parseLine(line: string, sessionId: string): { type: "text"; text: string } | null {
		this.log("Parsing:", line.substring(0, 100) + "...");
		try {
			const event = JSON.parse(line) as CodexEvent;
			return this.handleEvent(event, sessionId);
		} catch {
			this.log("JSON parse error");
			return null;
		}
	}

	private handleEvent(event: CodexEvent, sessionId: string): { type: "text"; text: string } | null {
		switch (event.type) {
			case "thread.started":
				this.threadIds.set(sessionId, event.thread_id);
				this.log("Thread started:", event.thread_id);
				this.emit("init", { sessionId, cliSessionId: event.thread_id });
				break;

			case "turn.started":
				this.log("Turn started");
				break;

			case "item.started":
			case "item.updated":
				if (event.item.type === "command_execution" ||
					event.item.type === "file_read" ||
					event.item.type === "file_write") {
					const toolBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: event.item.type,
						input: { command: event.item.command }
					};
					const pending = this.pendingMessages.get(sessionId);
					if (pending && event.type === "item.started") {
						pending.tools.push(toolBlock);
					}
					this.emit("toolUse", { sessionId, tool: toolBlock });
				}
				break;

			case "item.completed":
				// Agent message → streaming text
				if (event.item.type === "agent_message" && event.item.text) {
					this.log("Agent message:", event.item.text.substring(0, 50));
					return { type: "text", text: event.item.text };
				}

				// Reasoning → emit as thinking step
				if (event.item.type === "reasoning") {
					this.log("Reasoning item:", event.item.summary?.join(", ") || event.item.text?.substring(0, 50));
					const reasoningBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: "thinking",  // Special name for UI
						input: {
							text: event.item.text,
							summary: event.item.summary,
							content: event.item.content
						}
					};
					this.emit("toolUse", { sessionId, tool: reasoningBlock });
				}

				// File change → emit as tool use
				if (event.item.type === "file_change" && event.item.changes) {
					this.log("File change:", event.item.changes.length, "files");
					const toolBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: "file_change",
						input: { changes: event.item.changes }
					};
					this.emit("toolUse", { sessionId, tool: toolBlock });
				}

				// MCP tool call → emit as tool use
				if (event.item.type === "mcp_tool_call") {
					this.log("MCP tool call:", event.item.server, event.item.tool);
					const toolBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: `mcp:${event.item.server}:${event.item.tool}`,
						input: event.item.arguments
					};
					this.emit("toolUse", { sessionId, tool: toolBlock });
				}

				// Web search → emit as tool use
				if (event.item.type === "web_search" && event.item.query) {
					this.log("Web search:", event.item.query);
					const toolBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: "web_search",
						input: { query: event.item.query }
					};
					this.emit("toolUse", { sessionId, tool: toolBlock });
				}

				// Todo list → emit as tool use
				if (event.item.type === "todo_list" && event.item.items) {
					this.log("Todo list:", event.item.items.length, "items");
					const toolBlock: ToolUseBlock = {
						type: "tool_use",
						id: event.item.id,
						name: "todo_list",
						input: { items: event.item.items }
					};
					this.emit("toolUse", { sessionId, tool: toolBlock });
				}
				break;

			case "turn.completed":
				this.log("Turn completed, usage:", event.usage);
				this.emit("result", {
					sessionId,
					result: {
						type: "result",
						subtype: "success",
						is_error: false,
						result: "",
						session_id: this.threadIds.get(sessionId) || "",
						total_cost_usd: 0,
						duration_ms: 0,
						duration_api_ms: 0,
						num_turns: 1,
						usage: {
							input_tokens: event.usage.input_tokens,
							output_tokens: event.usage.output_tokens,
							cache_read_input_tokens: event.usage.cached_input_tokens,
							cache_creation_input_tokens: 0
						}
					}
				});
				this.emit("contextUpdate", {
					sessionId,
					usage: {
						input_tokens: event.usage.input_tokens,
						output_tokens: event.usage.output_tokens,
						cache_read_input_tokens: event.usage.cached_input_tokens,
						cache_creation_input_tokens: 0
					}
				});
				break;

			case "error":
				this.log("Error:", event.message);
				this.emit("error", { sessionId, error: event.message });
				break;
		}
		return null;
	}

	abort(sessionId: string): void {
		const process = this.processes.get(sessionId);
		if (process) {
			process.kill("SIGTERM");
			this.processes.delete(sessionId);
			this.emit("complete", { sessionId, code: null });
		}
	}

	abortAll(): void {
		for (const [sessionId, process] of this.processes) {
			process.kill("SIGTERM");
			this.emit("complete", { sessionId, code: null });
		}
		this.processes.clear();
		this.threadIds.clear();
		this.pendingMessages.clear();
	}

	getThreadId(sessionId: string): string | null {
		return this.threadIds.get(sessionId) || null;
	}

	isRunning(sessionId: string): boolean {
		return this.processes.has(sessionId);
	}

	hasAnyRunning(): boolean {
		return this.processes.size > 0;
	}

	clearSession(sessionId: string): void {
		this.threadIds.delete(sessionId);
		this.pendingMessages.delete(sessionId);
	}

	getPendingMessage(sessionId: string): PendingMessage | null {
		return this.pendingMessages.get(sessionId) || null;
	}

	clearPendingMessage(sessionId: string): void {
		this.pendingMessages.delete(sessionId);
	}
}
