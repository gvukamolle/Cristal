/**
 * Python PTY backend
 *
 * Uses embedded Python script for full PTY functionality on macOS/Linux.
 * Supports interactive programs (vim, nano, less, etc.)
 * Based on polyipseity/obsidian-terminal implementation.
 */

import { spawn, ChildProcess, execSync } from "child_process";
import { EventEmitter } from "events";
import type { IPtyBackend, PtySpawnOptions } from "./types";

// Embedded PTY helper script - based on polyipseity/obsidian-terminal
const PTY_HELPER_SCRIPT = `
from os import (
    execvp as _execvp,
    read as _read,
    waitpid as _waitpid,
    waitstatus_to_exitcode as _ws_to_ec,
    write as _write,
)
from selectors import DefaultSelector as _DefaultSelector, EVENT_READ as _EVENT_READ
from struct import pack as _pack
import sys as _sys
from sys import exit as _exit, stdin as _stdin, stdout as _stdout
from typing import Callable as _Callable, cast as _cast

if _sys.platform != "win32":
    from fcntl import ioctl as _ioctl
    import pty as _pty
    from termios import TIOCSWINSZ as _TIOCSWINSZ

    _FORK = _cast(
        _Callable[[], tuple[int, int]],
        _pty.fork,
    )
    _CHUNK_SIZE = 1024
    _STDIN = _stdin.fileno()
    _STDOUT = _stdout.fileno()
    _CMDIO = 3

    def main():
        if len(_sys.argv) < 2:
            _exit(1)

        pid, pty_fd = _FORK()
        if pid == 0:
            _execvp(_sys.argv[1], _sys.argv[1:])

        def write_all(fd, data):
            while data:
                data = data[_write(fd, data):]

        with _DefaultSelector() as selector:
            running = True

            def pipe_pty():
                try:
                    data = _read(pty_fd, _CHUNK_SIZE)
                except OSError:
                    data = b""
                if not data:
                    selector.unregister(pty_fd)
                    global running
                    running = False
                    return
                write_all(_STDOUT, data)

            def pipe_stdin():
                data = _read(_STDIN, _CHUNK_SIZE)
                if not data:
                    selector.unregister(_STDIN)
                    return
                write_all(pty_fd, data)

            def process_cmdio():
                data = _read(_CMDIO, _CHUNK_SIZE)
                if not data:
                    selector.unregister(_CMDIO)
                    return
                for line in data.decode("UTF-8", "strict").splitlines():
                    parts = line.split("x", 2)
                    if len(parts) == 2:
                        cols = int(parts[0].strip())
                        rows = int(parts[1].strip())
                        _ioctl(pty_fd, _TIOCSWINSZ, _pack("HHHH", rows, cols, 0, 0))

            selector.register(pty_fd, _EVENT_READ, pipe_pty)
            selector.register(_STDIN, _EVENT_READ, pipe_stdin)

            try:
                import os
                os.fstat(_CMDIO)
                selector.register(_CMDIO, _EVENT_READ, process_cmdio)
            except OSError:
                pass

            while running:
                for key, _ in selector.select():
                    key.data()

        _exit(_ws_to_ec(_waitpid(pid, 0)[1]))

else:
    def main():
        raise NotImplementedError(_sys.platform)

if __name__ == "__main__":
    main()
`;

export class PythonPtyBackend extends EventEmitter implements IPtyBackend {
	private process: ChildProcess | null = null;
	private pythonPath: string;
	private running: boolean = false;

	constructor(pythonPath: string) {
		super();
		this.pythonPath = pythonPath;
	}

	async spawn(options: PtySpawnOptions): Promise<void> {
		// Spawn Python PTY helper with script passed via -c
		// Usage: python3 -c <script> <shell> [args...]
		const args = ["-c", PTY_HELPER_SCRIPT, options.shell];
		if (options.args) {
			args.push(...options.args);
		}

		// Set TERM environment variable
		const env: Record<string, string> = {
			...process.env as Record<string, string>,
			...options.env,
			TERM: "xterm-256color",
			// Disable zsh features that emit unsupported sequences
			DISABLE_AUTO_TITLE: "true",
			// Critical: Disable grapheme clustering mode (ESC[?2026h/l)
			// zsh checks TERM_PROGRAM and disables it for certain programs
			TERM_PROGRAM: "Apple_Terminal",  // Pretend to be Terminal.app
			// Python settings
			PYTHONIOENCODING: "utf-8",
			PYTHONUNBUFFERED: "1"
		};

		this.process = spawn(
			this.pythonPath,
			args,
			{
				cwd: options.cwd,
				env,
				// fd 0: stdin, fd 1: stdout, fd 2: stderr, fd 3: resize pipe
				stdio: ["pipe", "pipe", "pipe", "pipe"]
			}
		);

		this.running = true;

		// Handle stdout (terminal output from PTY)
		this.process.stdout?.on("data", (data: Buffer) => {
			this.emit("data", data.toString("utf-8"));
		});

		// Handle stderr (errors from helper)
		this.process.stderr?.on("data", (data: Buffer) => {
			const msg = data.toString("utf-8");
			console.error("[PythonPty]", msg);
		});

		// Handle process close
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

		// Initial resize will be sent by XtermWrapper.fit() when terminal is ready
		// Don't send it here - dimensions may not be valid yet
	}

	write(data: string): void {
		if (this.process?.stdin && !this.process.stdin.destroyed) {
			this.process.stdin.write(data, "utf-8");
		}
	}

	resize(cols: number, rows: number): void {
		// Validate dimensions before sending
		if (!cols || !rows || isNaN(cols) || isNaN(rows) || cols <= 0 || rows <= 0) {
			console.warn("[PythonPty] Invalid resize dimensions:", cols, rows);
			return;
		}

		// Send resize command via fd 3 (stdio[3])
		// Text format: "cols x rows\n" (like polyipseity/obsidian-terminal)
		if (this.process?.stdio[3]) {
			try {
				const resizeCmd = `${cols}x${rows}\n`;
				(this.process.stdio[3] as NodeJS.WritableStream).write(resizeCmd);
			} catch (err) {
				console.warn("[PythonPty] Failed to send resize:", err);
			}
		}
	}

	kill(): void {
		if (this.process && !this.process.killed) {
			this.running = false;

			// Send SIGTERM for graceful shutdown
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

	/**
	 * Verify Python is available and return version
	 */
	static async verifyPython(pythonPath: string): Promise<string | null> {
		try {
			const result = execSync(`"${pythonPath}" --version`, {
				encoding: "utf-8",
				timeout: 5000
			});
			// Returns "Python 3.x.x"
			return result.trim();
		} catch {
			return null;
		}
	}

	/**
	 * Find available Python installation
	 */
	static async findPython(): Promise<string | null> {
		const candidates = [
			"python3",
			"python",
			"/usr/bin/python3",
			"/usr/local/bin/python3",
			"/opt/homebrew/bin/python3"
		];

		for (const candidate of candidates) {
			const version = await this.verifyPython(candidate);
			if (version && version.includes("Python 3")) {
				return candidate;
			}
		}

		return null;
	}
}
