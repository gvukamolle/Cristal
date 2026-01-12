/**
 * Fallback PTY backend using child_process.spawn
 *
 * This backend does NOT support full PTY features:
 * - No support for interactive programs like vim, nano, less
 * - Limited ANSI escape sequence handling
 * - No true terminal resize
 *
 * Used on Windows without Python, or as emergency fallback when Python PTY fails.
 * Works fine for: npm install, claude/codex CLI, basic shell commands
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import type { IPtyBackend, PtySpawnOptions } from "./types";

export class FallbackPtyBackend extends EventEmitter implements IPtyBackend {
	private process: ChildProcess | null = null;
	private running: boolean = false;

	constructor() {
		super();
	}

	async spawn(options: PtySpawnOptions): Promise<void> {
		const isWindows = process.platform === "win32";

		// Determine shell and args
		let shell = options.shell;
		let args = options.args || [];

		// Windows-specific adjustments
		if (isWindows) {
			if (shell === "powershell.exe" || shell.includes("powershell")) {
				args = ["-NoLogo", "-NoProfile", ...args];
			}
		}

		// Environment setup
		const env: Record<string, string> = {
			...process.env as Record<string, string>,
			...options.env,
			// Indicate non-interactive terminal
			TERM: isWindows ? "dumb" : "xterm-256color",
			// Force colors in many CLI tools
			FORCE_COLOR: "1",
			CLICOLOR: "1",
			CLICOLOR_FORCE: "1",
			// Set terminal size hints (some programs respect these)
			COLUMNS: String(options.cols),
			LINES: String(options.rows)
		};

		try {
			this.process = spawn(shell, args, {
				cwd: options.cwd,
				env,
				stdio: ["pipe", "pipe", "pipe"],
				shell: isWindows, // Use shell on Windows for better command handling
				windowsHide: false
			});

			this.running = true;

			// Handle stdout
			this.process.stdout?.on("data", (data: Buffer) => {
				this.emit("data", data.toString());
			});

			// Handle stderr (merge with stdout for terminal experience)
			this.process.stderr?.on("data", (data: Buffer) => {
				this.emit("data", data.toString());
			});

			// Handle process exit
			this.process.on("close", (code) => {
				this.running = false;
				this.emit("exit", code ?? 0);
				this.process = null;
			});

			// Handle spawn errors
			this.process.on("error", (err) => {
				this.running = false;
				this.emit("error", err);
			});

			// Write initial prompt-like message
			// Small delay to let shell initialize
			setTimeout(() => {
				if (this.running) {
					this.emit("data", `\x1b[33m[Fallback mode - limited terminal functionality]\x1b[0m\r\n`);
				}
			}, 100);

		} catch (err) {
			this.running = false;
			throw err;
		}
	}

	write(data: string): void {
		if (this.process?.stdin && !this.process.stdin.destroyed) {
			this.process.stdin.write(data);
		}
	}

	resize(_cols: number, _rows: number): void {
		// Fallback backend doesn't support true resize
		// Some programs might check COLUMNS/LINES env vars on startup
		// but we can't change them after spawn
	}

	kill(): void {
		if (this.process && !this.process.killed) {
			this.running = false;

			// Try graceful termination first
			this.process.kill("SIGTERM");

			// Force kill after timeout
			setTimeout(() => {
				if (this.process && !this.process.killed) {
					this.process.kill("SIGKILL");
				}
			}, 1000);
		}
		this.process = null;
	}

	isRunning(): boolean {
		return this.running;
	}
}
