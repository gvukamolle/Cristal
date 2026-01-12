/**
 * Terminal module types
 */

import { EventEmitter } from "events";

/**
 * PTY spawn options
 */
export interface PtySpawnOptions {
	/** Shell executable path (e.g., /bin/zsh, powershell.exe) */
	shell: string;
	/** Arguments to pass to the shell */
	args?: string[];
	/** Working directory */
	cwd: string;
	/** Environment variables */
	env?: Record<string, string>;
	/** Terminal columns */
	cols: number;
	/** Terminal rows */
	rows: number;
}

/**
 * PTY backend interface - abstraction over different PTY implementations
 */
export interface IPtyBackend extends EventEmitter {
	/** Spawn a new shell process */
	spawn(options: PtySpawnOptions): Promise<void>;
	/** Write data to the PTY stdin */
	write(data: string): void;
	/** Resize the PTY */
	resize(cols: number, rows: number): void;
	/** Kill the PTY process */
	kill(): void;
	/** Check if the process is running */
	isRunning(): boolean;
}

/**
 * Terminal profile configuration
 */
export interface TerminalProfile {
	/** Unique profile ID */
	id: string;
	/** Display name */
	name: string;
	/** Shell executable path */
	shell: string;
	/** Shell arguments */
	args?: string[];
	/** Environment variables */
	env?: Record<string, string>;
	/** Custom Python path for PTY helper */
	pythonPath?: string;
}

/**
 * Terminal settings stored in plugin settings
 */
export interface TerminalSettings {
	/** Default profile ID to use */
	defaultProfile: string;
	/** Available terminal profiles */
	profiles: TerminalProfile[];
	/** Font size in pixels */
	fontSize: number;
	/** Font family */
	fontFamily: string;
	/** Cursor style */
	cursorStyle: "block" | "underline" | "bar";
	/** Scrollback buffer size */
	scrollback: number;
	/** Custom Python path (overrides auto-detection) */
	pythonPath?: string;
}

/**
 * Default terminal profiles for each platform
 * Note: -l flag starts shell as login shell to load user profile (PATH, etc.)
 */
export function getDefaultProfiles(): TerminalProfile[] {
	const platform = process.platform;

	if (platform === "win32") {
		return [
			{ id: "powershell", name: "PowerShell", shell: "powershell.exe", args: ["-NoLogo"] },
			{ id: "cmd", name: "Command Prompt", shell: "cmd.exe" },
			{ id: "wsl", name: "WSL", shell: "wsl.exe" }
		];
	} else if (platform === "darwin") {
		// On macOS, always use /bin/zsh as default (process.env.SHELL may not work in Electron)
		return [
			{ id: "default", name: "zsh", shell: "/bin/zsh", args: ["-l"] },
			{ id: "zsh", name: "zsh", shell: "/bin/zsh", args: ["-l"] },
			{ id: "bash", name: "bash", shell: "/bin/bash", args: ["-l"] }
		];
	} else {
		// Linux
		const shell = process.env.SHELL || "/bin/bash";
		const isZsh = shell.includes("zsh");
		return [
			{ id: "default", name: isZsh ? "zsh" : "bash", shell, args: ["-l"] },
			{ id: "bash", name: "bash", shell: "/bin/bash", args: ["-l"] },
			{ id: "sh", name: "sh", shell: "/bin/sh" }
		];
	}
}

/**
 * Default terminal settings
 */
export const DEFAULT_TERMINAL_SETTINGS: TerminalSettings = {
	defaultProfile: "default",
	profiles: getDefaultProfiles(),
	fontSize: 14,
	fontFamily: 'Menlo, Monaco, "Courier New", monospace',
	cursorStyle: "block",
	scrollback: 1000
};

/**
 * Backend type indicator
 */
export type BackendType = "python-pty" | "fallback";

/**
 * Terminal session info
 */
export interface TerminalSession {
	/** Session ID */
	id: string;
	/** Backend being used */
	backendType: BackendType;
	/** Profile used */
	profile: TerminalProfile;
	/** Created timestamp */
	createdAt: number;
}
