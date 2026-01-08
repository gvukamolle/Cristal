import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import type { CLIMessage, InitMessage, ResultMessage, ConversationMessage, ContentBlock, TextBlock, ClaudePermissions } from "./types";

export class ClaudeService extends EventEmitter {
	private currentProcess: ChildProcess | null = null;
	private currentSessionId: string | null = null;
	private cliPath: string;
	private workingDir: string;
	private permissions: ClaudePermissions;
	private debug = false; // Set to true for debugging

	constructor(cliPath: string = "claude", workingDir: string = process.cwd()) {
		super();
		this.cliPath = cliPath;
		this.workingDir = workingDir;
		this.permissions = { webSearch: false, webFetch: false, task: false };
	}

	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log("[ClaudeService]", ...args);
		}
	}

	setCliPath(path: string): void {
		this.cliPath = path;
	}

	setWorkingDir(dir: string): void {
		this.workingDir = dir;
	}

	setPermissions(permissions: ClaudePermissions): void {
		this.permissions = permissions;
		this.writePermissionsConfig();
	}

	private writePermissionsConfig(): void {
		const claudeDir = path.join(this.workingDir, ".claude");
		const configPath = path.join(claudeDir, "settings.json");

		// Build permissions config
		const allowRules: string[] = [
			// Always allow reading/editing Obsidian file types
			"Read(./**/*.md)",
			"Read(./**/*.canvas)",
			"Read(./**/*.base)",
			"Edit(./**/*.md)",
			"Edit(./**/*.canvas)",
			"Edit(./**/*.base)",
			"Write(./**/*.md)",
			"Write(./**/*.canvas)",
			"Write(./**/*.base)"
		];

		// Optional permissions
		if (this.permissions.webSearch) {
			allowRules.push("WebSearch");
		}
		if (this.permissions.webFetch) {
			allowRules.push("WebFetch");
		}
		if (this.permissions.task) {
			allowRules.push("Task");
		}

		const denyRules: string[] = [
			// Always block dangerous operations
			"Bash",
			"Read(./.obsidian/**)",
			"Edit(./.obsidian/**)",
			"Write(./.obsidian/**)"
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

	async sendMessage(prompt: string, sessionId?: string): Promise<void> {
		if (this.currentProcess) {
			this.log("Aborting existing process");
			this.abort();
		}

		// Build args
		const args = ["-p", prompt, "--output-format", "stream-json", "--verbose"];
		if (sessionId) {
			args.push("--resume", sessionId);
		}

		this.log("Spawning:", this.cliPath, args);

		// Set up environment for Electron
		const pathAdditions = ["/usr/local/bin", "/opt/homebrew/bin", "/usr/bin", "/bin"];
		const homeDir = process.env.HOME || os.homedir();
		const env = {
			...process.env,
			PATH: pathAdditions.join(":") + ":" + (process.env.PATH || ""),
			HOME: homeDir,
			USER: process.env.USER || os.userInfo().username
		};

		this.currentProcess = spawn(this.cliPath, args, {
			cwd: this.workingDir,
			env,
			stdio: ["pipe", "pipe", "pipe"]
		});

		// Close stdin immediately - this was the key fix!
		this.currentProcess.stdin?.end();

		this.log("Process spawned, PID:", this.currentProcess.pid);

		let buffer = "";
		let accumulatedText = ""; // For streaming text accumulation

		// Handle stdout stream
		this.currentProcess.stdout?.on("data", (chunk: Buffer) => {
			const chunkStr = chunk.toString();
			this.log("stdout chunk:", chunkStr.length, "bytes");
			buffer += chunkStr;

			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.trim()) {
					const result = this.parseLine(line);
					if (result?.type === "text") {
						accumulatedText = result.text;
						// Emit streaming text update
						this.emit("streaming", accumulatedText);
					}
				}
			}
		});

		// Handle stderr
		this.currentProcess.stderr?.on("data", (data: Buffer) => {
			const errorText = data.toString();
			this.log("stderr:", errorText);
			if (errorText.includes("authenticate") || errorText.includes("login")) {
				this.emit("error", "Authentication required. Run 'claude' in terminal to login.");
			}
		});

		// Handle errors
		this.currentProcess.on("error", (err: Error) => {
			this.log("Process error:", err.message);
			this.emit("error", `Failed to start CLI: ${err.message}`);
			this.currentProcess = null;
		});

		// Handle close
		this.currentProcess.on("close", (code: number | null) => {
			this.log("Process closed with code:", code);
			// Process remaining buffer
			if (buffer.trim()) {
				this.parseLine(buffer);
			}
			this.emit("complete", code);
			this.currentProcess = null;
		});
	}

	private parseLine(line: string): { type: "text"; text: string } | null {
		this.log("Parsing:", line.substring(0, 80) + "...");
		try {
			const msg = JSON.parse(line) as CLIMessage;
			return this.handleMessage(msg);
		} catch {
			this.log("JSON parse error");
			return null;
		}
	}

	private handleMessage(msg: CLIMessage): { type: "text"; text: string } | null {
		switch (msg.type) {
			case "system":
				if ((msg as InitMessage).subtype === "init") {
					this.currentSessionId = msg.session_id;
					this.log("Init, session:", msg.session_id);
					this.emit("init", msg);
				}
				break;

			case "assistant": {
				const convMsg = msg as ConversationMessage;
				const text = this.extractText(convMsg.message.content);
				this.log("Assistant text:", text.substring(0, 50));
				if (text) {
					this.emit("assistant", msg);
					return { type: "text", text };
				}
				break;
			}

			case "result": {
				const resultMsg = msg as ResultMessage;
				this.log("Result, is_error:", resultMsg.is_error);
				if (resultMsg.is_error) {
					this.emit("error", resultMsg.result);
				}
				this.emit("result", msg);
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

	abort(): void {
		if (this.currentProcess) {
			this.currentProcess.kill("SIGTERM");
			this.currentProcess = null;
			this.emit("complete", null);
		}
	}

	get sessionId(): string | null {
		return this.currentSessionId;
	}

	get isRunning(): boolean {
		return this.currentProcess !== null;
	}

	clearSession(): void {
		this.currentSessionId = null;
	}
}
