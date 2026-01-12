/**
 * Terminal Service
 *
 * Manages terminal sessions and PTY backends.
 * Handles backend selection (Python PTY vs Fallback) automatically.
 */

import { EventEmitter } from "events";
import { Notice } from "obsidian";
import type {
	IPtyBackend,
	PtySpawnOptions,
	TerminalProfile,
	TerminalSettings,
	TerminalSession,
	BackendType
} from "./types";
import { getDefaultProfiles, DEFAULT_TERMINAL_SETTINGS } from "./types";
import { PythonPtyBackend } from "./PythonPtyBackend";
import { FallbackPtyBackend } from "./FallbackPtyBackend";

export class TerminalService extends EventEmitter {
	private sessions: Map<string, { backend: IPtyBackend; session: TerminalSession }> = new Map();
	private settings: TerminalSettings;
	private vaultPath: string;
	private pythonPath: string | null = null;
	private pythonChecked: boolean = false;

	constructor(vaultPath: string, settings?: Partial<TerminalSettings>) {
		super();
		this.vaultPath = vaultPath;
		this.settings = {
			...DEFAULT_TERMINAL_SETTINGS,
			...settings,
			profiles: settings?.profiles || getDefaultProfiles()
		};
	}

	/**
	 * Set vault path (for working directory)
	 */
	setVaultPath(path: string): void {
		this.vaultPath = path;
	}

	/**
	 * Update settings
	 */
	updateSettings(settings: Partial<TerminalSettings>): void {
		this.settings = { ...this.settings, ...settings };
	}

	/**
	 * Create a new terminal session
	 */
	async createSession(sessionId?: string, profileId?: string): Promise<{
		backend: IPtyBackend;
		session: TerminalSession;
	}> {
		const id = sessionId || crypto.randomUUID();
		const profile = this.getProfile(profileId);

		// Check Python availability if not checked yet
		if (!this.pythonChecked) {
			await this.checkPython();
		}

		// Create appropriate backend
		const { backend, backendType } = await this.createBackend(profile);

		// Create session info
		const session: TerminalSession = {
			id,
			backendType,
			profile,
			createdAt: Date.now()
		};

		// Spawn shell process
		const spawnOptions: PtySpawnOptions = {
			shell: profile.shell,
			args: profile.args,
			cwd: this.vaultPath,
			env: profile.env,
			cols: 80,
			rows: 24
		};

		await backend.spawn(spawnOptions);

		// Forward events
		backend.on("data", (data: string) => {
			this.emit("data", { sessionId: id, data });
		});

		backend.on("exit", (code: number) => {
			this.emit("exit", { sessionId: id, code });
			this.sessions.delete(id);
		});

		backend.on("error", (error: Error) => {
			this.emit("error", { sessionId: id, error });
		});

		// Store session
		this.sessions.set(id, { backend, session });

		// Notify about backend type
		if (backendType === "fallback") {
			new Notice("Terminal running in limited mode (Python not found)", 3000);
		}

		return { backend, session };
	}

	/**
	 * Check Python availability
	 */
	private async checkPython(): Promise<void> {
		this.pythonChecked = true;

		// Check custom path first
		if (this.settings.pythonPath) {
			const version = await PythonPtyBackend.verifyPython(this.settings.pythonPath);
			if (version) {
				this.pythonPath = this.settings.pythonPath;
				console.log(`[Terminal] Using custom Python: ${version}`);
				return;
			}
		}

		// Auto-detect Python
		this.pythonPath = await PythonPtyBackend.findPython();
		if (this.pythonPath) {
			console.log(`[Terminal] Found Python: ${this.pythonPath}`);
		} else {
			console.log("[Terminal] Python not found, will use fallback backend");
		}
	}

	/**
	 * Create PTY backend based on availability
	 */
	private async createBackend(profile: TerminalProfile): Promise<{
		backend: IPtyBackend;
		backendType: BackendType;
	}> {
		const isWindows = process.platform === "win32";

		// On Windows without Python, use fallback
		if (isWindows && !this.pythonPath) {
			return {
				backend: new FallbackPtyBackend(),
				backendType: "fallback"
			};
		}

		// On Unix-like systems, try Python PTY
		if (this.pythonPath) {
			try {
				const backend = new PythonPtyBackend(this.pythonPath);
				return { backend, backendType: "python-pty" };
			} catch (error) {
				console.warn("[Terminal] Python PTY failed, using fallback:", error);
			}
		}

		// Fallback
		return {
			backend: new FallbackPtyBackend(),
			backendType: "fallback"
		};
	}

	/**
	 * Get profile by ID
	 */
	private getProfile(profileId?: string): TerminalProfile {
		const id = profileId || this.settings.defaultProfile;
		const profile = this.settings.profiles.find(p => p.id === id);

		if (profile) return profile;

		// Return first available profile
		const firstProfile = this.settings.profiles[0];
		if (firstProfile) {
			return firstProfile;
		}

		// Emergency fallback - get default profiles and return first one
		const defaultProfiles = getDefaultProfiles();
		return defaultProfiles[0] as TerminalProfile;
	}

	/**
	 * Get session by ID
	 */
	getSession(sessionId: string): { backend: IPtyBackend; session: TerminalSession } | undefined {
		return this.sessions.get(sessionId);
	}

	/**
	 * Kill a specific session
	 */
	killSession(sessionId: string): void {
		const entry = this.sessions.get(sessionId);
		if (entry) {
			entry.backend.kill();
			this.sessions.delete(sessionId);
		}
	}

	/**
	 * Kill all sessions
	 */
	killAll(): void {
		for (const [id, entry] of this.sessions) {
			entry.backend.kill();
		}
		this.sessions.clear();
	}

	/**
	 * Get all active sessions
	 */
	getActiveSessions(): TerminalSession[] {
		return Array.from(this.sessions.values()).map(e => e.session);
	}

	/**
	 * Check if Python PTY is available
	 */
	isPythonAvailable(): boolean {
		return this.pythonPath !== null;
	}

	/**
	 * Get available profiles
	 */
	getProfiles(): TerminalProfile[] {
		return this.settings.profiles;
	}

	/**
	 * Execute a command headlessly and return output
	 * Used for getting CLI status without user-visible terminal
	 *
	 * @param command - The command to run (e.g., "codex")
	 * @param input - Input to send to the process (e.g., "/status\nexit\n")
	 * @param timeoutMs - Timeout in milliseconds
	 * @returns Collected output or null on error
	 */
	async executeCommandHeadless(
		command: string,
		input: string,
		timeoutMs: number = 5000
	): Promise<string | null> {
		return new Promise(async (resolve) => {
			let output = "";
			let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
			let sessionId: string | null = null;

			const cleanup = () => {
				if (timeoutHandle) {
					clearTimeout(timeoutHandle);
					timeoutHandle = null;
				}
				if (sessionId) {
					this.killSession(sessionId);
				}
			};

			try {
				// Check Python availability if not checked yet
				if (!this.pythonChecked) {
					await this.checkPython();
				}

				// Create backend (prefer Python PTY for full terminal emulation)
				const { backend, backendType } = await this.createBackend(this.getProfile());

				sessionId = `headless-${Date.now()}`;

				// Build extended PATH with common node locations (macOS GUI apps don't inherit shell PATH)
				const homedir = require("os").homedir();
				const extraPaths = [
					"/usr/local/bin",           // Homebrew Intel
					"/opt/homebrew/bin",        // Homebrew Apple Silicon
					`${homedir}/.nvm/versions/node/v22/bin`,  // NVM (common version)
					`${homedir}/.nvm/versions/node/v20/bin`,  // NVM LTS
					`${homedir}/.nvm/versions/node/v18/bin`,  // NVM older LTS
					`${homedir}/.npm-global/bin`,
					`${homedir}/.local/bin`,
					"/usr/bin",
					"/bin"
				];
				const currentPath = process.env.PATH || "";
				const extendedPath = [...extraPaths, ...currentPath.split(":")].join(":");

				// Spawn with custom shell command
				const spawnOptions: PtySpawnOptions = {
					shell: command,
					args: [],
					cwd: this.vaultPath,
					cols: 120,
					rows: 40,
					env: {
						...process.env as Record<string, string>,
						PATH: extendedPath
					}
				};

				await backend.spawn(spawnOptions);

				// Collect data
				backend.on("data", (data: string) => {
					output += data;
				});

				// Handle exit
				backend.on("exit", () => {
					cleanup();
					resolve(output || null);
				});

				backend.on("error", (error: Error) => {
					console.log("[Terminal] Headless error:", error.message);
					cleanup();
					resolve(null);
				});

				// Store session for cleanup
				this.sessions.set(sessionId, {
					backend,
					session: {
						id: sessionId,
						backendType,
						profile: this.getProfile(),
						createdAt: Date.now()
					}
				});

				// Send input after short delay (allow CLI to initialize)
				setTimeout(() => {
					backend.write(input);
				}, 500);

				// Set timeout
				timeoutHandle = setTimeout(() => {
					console.log("[Terminal] Headless timeout, returning collected output");
					cleanup();
					resolve(output || null);
				}, timeoutMs);

			} catch (error) {
				console.log("[Terminal] Headless execution error:", error);
				cleanup();
				resolve(null);
			}
		});
	}

	/**
	 * Write to an existing session
	 */
	writeToSession(sessionId: string, data: string): void {
		const entry = this.sessions.get(sessionId);
		if (entry) {
			entry.backend.write(data);
		}
	}

	/**
	 * Resize an existing session
	 */
	resizeSession(sessionId: string, cols: number, rows: number): void {
		const entry = this.sessions.get(sessionId);
		if (entry) {
			entry.backend.resize(cols, rows);
		}
	}
}
