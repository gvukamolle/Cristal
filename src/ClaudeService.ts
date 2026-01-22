import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import type { CLIMessage, ContentBlock, TextBlock, ClaudePermissions, PendingMessage } from "./types";

export class ClaudeService extends EventEmitter {
	// Map of sessionId -> ChildProcess for parallel session support
	private processes: Map<string, ChildProcess> = new Map();
	// Map of sessionId -> CLI session ID (for --resume)
	private cliSessionIds: Map<string, string> = new Map();
	// Map of sessionId -> pending message (for background sessions)
	private pendingMessages: Map<string, PendingMessage> = new Map();
	private cliPath: string;
	private workingDir: string;
	private configDir: string = ""; // Obsidian config folder (set via setConfigDir from vault.configDir)
	private permissions: ClaudePermissions;
	private debug = true; // DEBUG MODE: Check DevTools for usage data

	// Rate limit detection patterns
	private readonly rateLimitPatterns = [
		/rate_limit_error/i,
		/would exceed your account's rate limit/i,
		/exceeded.*rate limit/i,
		/5-hour limit reached/i,
		/weekly limit reached/i,
		/limit reached.*resets/i,
		/usage limit reached/i
	];

	// Authentication error patterns
	private readonly authErrorPatterns = [
		/authenticate/i,
		/login/i,
		/unauthorized/i,
		/not logged in/i,
		/authentication required/i,
		/sign in/i
	];

	constructor(cliPath: string = "claude", workingDir: string = process.cwd()) {
		super();
		this.cliPath = cliPath;
		this.workingDir = workingDir;
		this.permissions = {
			webSearch: false,
			webFetch: false,
			task: false,
			fileRead: true,
			fileWrite: true,
			fileEdit: true,
			extendedThinking: false
		};
	}

	private log(...args: unknown[]): void {
		if (this.debug) {
			console.debug("[ClaudeService]", ...args);
		}
	}

	setCliPath(path: string): void {
		this.cliPath = path;
	}

	setWorkingDir(dir: string): void {
		this.workingDir = dir;
	}

	setConfigDir(dir: string): void {
		this.configDir = dir;
	}

	setPermissions(permissions: ClaudePermissions): void {
		this.permissions = permissions;
		this.writePermissionsConfig();
	}

	private writePermissionsConfig(): void {
		const claudeDir = path.join(this.workingDir, ".claude");
		const configPath = path.join(claudeDir, "settings.json");

		// Build permissions config based on user settings
		const allowRules: string[] = [];

		// File operations - granular control
		if (this.permissions.fileRead) {
			allowRules.push(
				"Read(./**/*.md)",
				"Read(./**/*.canvas)",
				"Read(./**/*.base)"
			);
		}
		if (this.permissions.fileEdit) {
			allowRules.push(
				"Edit(./**/*.md)",
				"Edit(./**/*.canvas)",
				"Edit(./**/*.base)"
			);
		}
		if (this.permissions.fileWrite) {
			allowRules.push(
				"Write(./**/*.md)",
				"Write(./**/*.canvas)",
				"Write(./**/*.base)",
				"Delete(./**/*.md)",
				"Delete(./**/*.canvas)",
				"Delete(./**/*.base)"
			);
		}

		// Web operations
		if (this.permissions.webSearch) {
			allowRules.push("WebSearch");
		}
		if (this.permissions.webFetch) {
			allowRules.push("WebFetch");
		}

		// Agent operations
		if (this.permissions.task) {
			allowRules.push("Task");
		}

		const denyRules: string[] = [
			// Always block dangerous operations
			"Bash",
			`Read(./${this.configDir}/**)`,
			`Edit(./${this.configDir}/**)`,
			`Write(./${this.configDir}/**)`,
			`Delete(./${this.configDir}/**)`,
			"Read(./.trash/**)",
			"Edit(./.trash/**)",
			"Write(./.trash/**)",
			"Delete(./.trash/**)",
			// Hide AGENTS.md from Claude (Claude uses CLAUDE.md only)
			"Read(./.crystal-rules/AGENTS.md)",
			"Edit(./.crystal-rules/AGENTS.md)",
			"Write(./.crystal-rules/AGENTS.md)",
			"Delete(./.crystal-rules/AGENTS.md)",
			// Block editing CLAUDE.md (read-only access)
			"Edit(./.crystal-rules/CLAUDE.md)",
			"Write(./.crystal-rules/CLAUDE.md)",
			"Delete(./.crystal-rules/CLAUDE.md)"
		];

		const config = {
			permissions: {
				allow: allowRules,
				deny: denyRules
			}
		};

		try {
			// Create .claude directory if it doesn't exist
			if (!fs.existsSync(claudeDir)) {
				fs.mkdirSync(claudeDir, { recursive: true });
			}

			// Write config file
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
			this.log("Wrote permissions config to", configPath);
		} catch (err) {
			this.log("Failed to write permissions config:", err);
		}
	}

	sendMessage(prompt: string, sessionId: string, cliSessionId?: string, model?: string): void {
		// Abort existing process for this sessionId if any
		const existingProcess = this.processes.get(sessionId);
		if (existingProcess) {
			this.log(`Aborting existing process for session ${sessionId}`);
			this.abort(sessionId);
		}

		// Initialize pending message for this session
		this.pendingMessages.set(sessionId, { text: "", tools: [] });

		// Build args
		// Note: Extended thinking is activated via "ultrathink:" prompt prefix
		const args = ["-p", prompt, "--output-format", "stream-json", "--verbose"];
		if (model) {
			args.push("--model", model);
		}
		if (cliSessionId) {
			args.push("--resume", cliSessionId);
		}

		this.log("Spawning:", this.cliPath, args, "for sessionId:", sessionId);

		// Set up environment for Electron
		const homeDir = process.env.HOME || os.homedir();
		const pathAdditions = [
			`${homeDir}/.local/bin`,  // User local binaries (common for npm global installs)
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

		// Store process in map
		this.processes.set(sessionId, childProcess);

		// Close stdin immediately - this was the key fix!
		childProcess.stdin?.end();

		this.log("Process spawned, PID:", childProcess.pid, "for sessionId:", sessionId);

		let buffer = "";
		let accumulatedText = ""; // For streaming text accumulation

		// Handle stdout stream
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
						// Update pending message
						const pending = this.pendingMessages.get(sessionId);
						if (pending) {
							pending.text = accumulatedText;
						}
						// Emit streaming text update with sessionId
						this.emit("streaming", { sessionId, text: accumulatedText });
					}
				}
			}
		});

		// Handle stderr
		childProcess.stderr?.on("data", (data: Buffer) => {
			const errorText = data.toString();
			this.log("stderr:", errorText);
			if (this.isAuthError(errorText)) {
				this.emit("error", { sessionId, error: "Authentication required. Run 'claude' in terminal to login." });
			}
		});

		// Handle errors
		childProcess.on("error", (err: Error) => {
			this.log("Process error:", err.message);
			this.emit("error", { sessionId, error: `Failed to start CLI: ${err.message}` });
			this.processes.delete(sessionId);
		});

		// Handle close
		childProcess.on("close", (code: number | null) => {
			this.log("Process closed with code:", code, "for sessionId:", sessionId);
			// Process remaining buffer
			if (buffer.trim()) {
				this.parseLine(buffer, sessionId);
			}
			this.processes.delete(sessionId);
			this.emit("complete", { sessionId, code });
		});
	}

	private parseLine(line: string, sessionId: string): { type: "text"; text: string } | null {
		this.log("Parsing:", line.substring(0, 80) + "...");
		try {
			const parsed = JSON.parse(line);

			// Check for direct API error (type: "error")
			if (parsed.type === "error" && parsed.error) {
				const errorType = parsed.error.type || "";
				const errorMsg = parsed.error.message || "";

				if (this.isRateLimitError(errorType) || this.isRateLimitError(errorMsg)) {
					const resetTime = this.parseResetTime(errorMsg);
					this.emit("rateLimitError", { sessionId, resetTime, message: errorMsg });
					return null;
				}

				this.emit("error", { sessionId, error: errorMsg });
				return null;
			}

			const msg = parsed as CLIMessage;
			return this.handleMessage(msg, sessionId);
		} catch {
			this.log("JSON parse error");
			return null;
		}
	}

	private isRateLimitError(text: string): boolean {
		return this.rateLimitPatterns.some(pattern => pattern.test(text));
	}

	private isAuthError(text: string): boolean {
		return this.authErrorPatterns.some(pattern => pattern.test(text));
	}

	private parseResetTime(message: string): string | null {
		const match = message.match(/resets?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s*\([^)]+\))?)/i);
		return match?.[1]?.trim() || null;
	}

	private handleMessage(msg: CLIMessage, sessionId: string): { type: "text"; text: string } | null {
		switch (msg.type) {
			case "system": {
				if (msg.subtype === "init") {
					this.cliSessionIds.set(sessionId, msg.session_id);
					this.log("Init, cliSession:", msg.session_id, "for sessionId:", sessionId);
					this.emit("init", { sessionId, cliSessionId: msg.session_id });
				} else if (msg.subtype === "compact_boundary") {
					this.log("Compact boundary:", msg.compact_metadata);
					this.emit("compact", {
						sessionId,
						trigger: msg.compact_metadata.trigger,
						preTokens: msg.compact_metadata.pre_tokens
					});
				}
				break;
			}

			case "assistant": {
				// Emit tool_use events for each tool use block and store in pending
				const pending = this.pendingMessages.get(sessionId);
				for (const block of msg.message.content) {
					if (block.type === "tool_use") {
						this.log("Tool use:", block.name);
						if (pending) {
							pending.tools.push(block);
						}
						this.emit("toolUse", { sessionId, tool: block });
					}
				}

				const text = this.extractText(msg.message.content);
				this.log("Assistant text:", text.substring(0, 50));
				if (text) {
					this.emit("assistant", { sessionId, message: msg });
					return { type: "text", text };
				}
				break;
			}

			case "result": {
				this.log("Result, is_error:", msg.is_error);
				this.log("Result raw usage:", JSON.stringify(msg.usage));

				// Check for rate limit in result message
				if (msg.is_error && msg.result && this.isRateLimitError(msg.result)) {
					const resetTime = this.parseResetTime(msg.result);
					this.emit("rateLimitError", { sessionId, resetTime, message: msg.result });
					return null;
				}

				if (msg.is_error) {
					this.emit("error", { sessionId, error: msg.result });
				}
				this.emit("result", { sessionId, result: msg });

				// Always emit context update (with defaults if no usage data)
				const usage = msg.usage ?? {
					input_tokens: 0,
					output_tokens: 0,
					cache_read_input_tokens: 0,
					cache_creation_input_tokens: 0
				};
				this.log("Usage (with defaults):", usage);
				this.emit("contextUpdate", { sessionId, usage });
				break;
			}
		}
		return null;
	}

	private extractText(content: ContentBlock[]): string {
		return content
			.filter((block): block is TextBlock => block.type === "text")
			.map(block => block.text)
			.join("");
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
		this.cliSessionIds.clear();
		this.pendingMessages.clear();
	}

	getCliSessionId(sessionId: string): string | null {
		return this.cliSessionIds.get(sessionId) || null;
	}

	isRunning(sessionId: string): boolean {
		return this.processes.has(sessionId);
	}

	hasAnyRunning(): boolean {
		return this.processes.size > 0;
	}

	clearSession(sessionId: string): void {
		this.cliSessionIds.delete(sessionId);
		this.pendingMessages.delete(sessionId);
	}

	getPendingMessage(sessionId: string): PendingMessage | null {
		return this.pendingMessages.get(sessionId) || null;
	}

	clearPendingMessage(sessionId: string): void {
		this.pendingMessages.delete(sessionId);
	}
}
