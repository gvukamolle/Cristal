import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// Claude Code usage limits response
export interface ClaudeUsageLimits {
	fiveHour: { utilization: number; resetsAt: string | null };
	sevenDay: { utilization: number; resetsAt: string | null };
	sevenDayOpus?: { utilization: number; resetsAt: string | null };
	sevenDaySonnet?: { utilization: number; resetsAt: string | null };
	error?: string;
}

// Codex usage limits (parsed from session files)
export interface CodexUsageLimits {
	fiveHour: { utilization: number; resetsAt: string | null };
	sevenDay: { utilization: number; resetsAt: string | null };
	error?: string;
}

/**
 * Service for fetching account usage limits from Claude Code and Codex CLI
 */
export class UsageLimitsService {
	private debug = true;

	private log(...args: unknown[]): void {
		if (this.debug) {
			console.log("[UsageLimitsService]", ...args);
		}
	}

	// ==================== Claude Code ====================

	/**
	 * Get Claude Code access token from platform-specific storage
	 * - macOS: Keychain
	 * - Linux/WSL: ~/.claude/.credentials.json
	 */
	async getClaudeAccessToken(): Promise<string | null> {
		const platform = os.platform();

		if (platform === "darwin") {
			return this.getFromKeychain();
		} else {
			// Linux, Windows (WSL), etc.
			return this.getFromCredentialsFile();
		}
	}

	/**
	 * macOS: Get credentials from Keychain
	 */
	private async getFromKeychain(): Promise<string | null> {
		return new Promise((resolve) => {
			exec(
				'security find-generic-password -s "Claude Code-credentials" -w',
				{ timeout: 5000 },
				(error, stdout, stderr) => {
					if (error) {
						this.log("Keychain error:", error.message);
						resolve(null);
						return;
					}

					try {
						const creds = JSON.parse(stdout.trim());
						const token = creds.claudeAiOauth?.accessToken;
						if (token) {
							this.log("Got token from Keychain");
							resolve(token);
						} else {
							this.log("No accessToken in Keychain credentials");
							resolve(null);
						}
					} catch (parseError) {
						this.log("Failed to parse Keychain credentials:", parseError);
						resolve(null);
					}
				}
			);
		});
	}

	/**
	 * Linux/WSL: Get credentials from file
	 */
	private async getFromCredentialsFile(): Promise<string | null> {
		const credPath = path.join(os.homedir(), ".claude", ".credentials.json");

		try {
			if (!fs.existsSync(credPath)) {
				this.log("Credentials file not found:", credPath);
				return null;
			}

			const content = fs.readFileSync(credPath, "utf-8");
			const creds = JSON.parse(content);
			const token = creds.claudeAiOauth?.accessToken;

			if (token) {
				this.log("Got token from credentials file");
				return token;
			} else {
				this.log("No accessToken in credentials file");
				return null;
			}
		} catch (error) {
			this.log("Failed to read credentials file:", error);
			return null;
		}
	}

	/**
	 * Fetch Claude Code usage limits from API using curl (bypasses CORS)
	 */
	async fetchClaudeUsage(): Promise<ClaudeUsageLimits> {
		const token = await this.getClaudeAccessToken();

		if (!token) {
			return {
				fiveHour: { utilization: 0, resetsAt: null },
				sevenDay: { utilization: 0, resetsAt: null },
				error: "not_authenticated"
			};
		}

		return new Promise((resolve) => {
			const curlCmd = `curl -s -X GET "https://api.anthropic.com/api/oauth/usage" ` +
				`-H "Authorization: Bearer ${token}" ` +
				`-H "Accept: application/json" ` +
				`-H "anthropic-beta: oauth-2025-04-20"`;

			exec(curlCmd, { timeout: 10000 }, (error, stdout, stderr) => {
				if (error) {
					this.log("Curl error:", error.message);
					resolve({
						fiveHour: { utilization: 0, resetsAt: null },
						sevenDay: { utilization: 0, resetsAt: null },
						error: "network_error"
					});
					return;
				}

				try {
					const data = JSON.parse(stdout.trim());
					this.log("Claude usage data:", data);

					// Check for API error response
					if (data.error) {
						this.log("API error:", data.error);
						resolve({
							fiveHour: { utilization: 0, resetsAt: null },
							sevenDay: { utilization: 0, resetsAt: null },
							error: `api_error: ${data.error.message || data.error}`
						});
						return;
					}

					resolve({
						fiveHour: {
							utilization: data.five_hour?.utilization ?? 0,
							resetsAt: data.five_hour?.resets_at ?? null
						},
						sevenDay: {
							utilization: data.seven_day?.utilization ?? 0,
							resetsAt: data.seven_day?.resets_at ?? null
						},
						sevenDayOpus: data.seven_day_opus ? {
							utilization: data.seven_day_opus.utilization ?? 0,
							resetsAt: data.seven_day_opus.resets_at ?? null
						} : undefined,
						sevenDaySonnet: data.seven_day_sonnet ? {
							utilization: data.seven_day_sonnet.utilization ?? 0,
							resetsAt: data.seven_day_sonnet.resets_at ?? null
						} : undefined
					});
				} catch (parseError) {
					this.log("Parse error:", parseError, "stdout:", stdout);
					resolve({
						fiveHour: { utilization: 0, resetsAt: null },
						sevenDay: { utilization: 0, resetsAt: null },
						error: "parse_error"
					});
				}
			});
		});
	}

	// ==================== Codex ====================

	/**
	 * Fetch Codex usage limits by parsing session files in ~/.codex/sessions/
	 * Session files are JSONL with token_count events containing rate_limits
	 */
	async fetchCodexUsage(): Promise<CodexUsageLimits> {
		try {
			const sessionsDir = path.join(os.homedir(), ".codex", "sessions");

			if (!fs.existsSync(sessionsDir)) {
				this.log("Codex sessions dir not found:", sessionsDir);
				return {
					fiveHour: { utilization: 0, resetsAt: null },
					sevenDay: { utilization: 0, resetsAt: null },
					error: "not_authenticated"
				};
			}

			// Find all session files from last 7 days
			const sessionFiles = this.findCodexSessionFiles(sessionsDir);

			if (sessionFiles.length === 0) {
				this.log("No recent Codex session files found");
				return {
					fiveHour: { utilization: 0, resetsAt: null },
					sevenDay: { utilization: 0, resetsAt: null },
					error: "no_sessions"
				};
			}

			this.log("Found", sessionFiles.length, "Codex session files");
			return this.parseCodexSessions(sessionFiles);
		} catch (error) {
			this.log("Codex fetch error:", error);
			return {
				fiveHour: { utilization: 0, resetsAt: null },
				sevenDay: { utilization: 0, resetsAt: null },
				error: "execution_error"
			};
		}
	}

	/**
	 * Find all Codex session files from last 7 days
	 */
	private findCodexSessionFiles(sessionsDir: string): string[] {
		const now = new Date();
		const files: string[] = [];

		// Search last 7 days
		for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
			const date = new Date(now);
			date.setDate(date.getDate() - dayOffset);

			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");

			const dayDir = path.join(sessionsDir, String(year), month, day);

			if (!fs.existsSync(dayDir)) continue;

			try {
				const dayFiles = fs.readdirSync(dayDir)
					.filter(f => f.endsWith(".jsonl"))
					.map(f => path.join(dayDir, f));

				files.push(...dayFiles);
			} catch {
				continue;
			}
		}

		return files;
	}

	/**
	 * Parse all Codex session files and find the most recent token_count event by timestamp
	 */
	private parseCodexSessions(files: string[]): CodexUsageLimits {
		let latestEvent: {
			timestamp: string;
			rate_limits: {
				primary?: { used_percent: number; resets_at: number };
				secondary?: { used_percent: number; resets_at: number };
			};
		} | null = null;

		// Search all files for the most recent token_count event
		for (const filePath of files) {
			try {
				const content = fs.readFileSync(filePath, "utf-8");
				const lines = content.trim().split("\n");

				// Parse from end to find the last token_count in this file
				for (let i = lines.length - 1; i >= 0; i--) {
					const line = lines[i];
					if (!line) continue;

					try {
						const event = JSON.parse(line);
						if (event.type === "event_msg" && event.payload?.type === "token_count") {
							const eventTimestamp = event.timestamp;

							// Keep the most recent by timestamp
							if (!latestEvent || eventTimestamp > latestEvent.timestamp) {
								latestEvent = {
									timestamp: eventTimestamp,
									rate_limits: event.payload.rate_limits
								};
							}
							break; // Only need the last token_count per file
						}
					} catch {
						continue;
					}
				}
			} catch {
				continue;
			}
		}

		if (!latestEvent) {
			this.log("No token_count events found in any session");
			return {
				fiveHour: { utilization: 0, resetsAt: null },
				sevenDay: { utilization: 0, resetsAt: null },
				error: "no_data"
			};
		}

		this.log("Codex rate limits (from", latestEvent.timestamp, "):", latestEvent.rate_limits);

		const rateLimits = latestEvent.rate_limits;
		const now = Date.now();

		// Check if resets_at is in the past (limit has been reset)
		const fiveHourResetTime = rateLimits.primary?.resets_at
			? rateLimits.primary.resets_at * 1000
			: null;
		const fiveHourExpired = fiveHourResetTime && fiveHourResetTime < now;

		const sevenDayResetTime = rateLimits.secondary?.resets_at
			? rateLimits.secondary.resets_at * 1000
			: null;
		const sevenDayExpired = sevenDayResetTime && sevenDayResetTime < now;

		// If expired, utilization is 0 (limit was reset)
		const fiveHourUtilization = fiveHourExpired ? 0 : (rateLimits.primary?.used_percent ?? 0);
		const sevenDayUtilization = sevenDayExpired ? 0 : (rateLimits.secondary?.used_percent ?? 0);

		// For expired limits, don't show reset time (it's already reset)
		const fiveHourReset = fiveHourExpired ? null : (fiveHourResetTime ? new Date(fiveHourResetTime).toISOString() : null);
		const sevenDayReset = sevenDayExpired ? null : (sevenDayResetTime ? new Date(sevenDayResetTime).toISOString() : null);

		if (fiveHourExpired) {
			this.log("5-hour limit has been reset (was at", new Date(fiveHourResetTime!).toISOString(), ")");
		}

		return {
			fiveHour: {
				utilization: fiveHourUtilization,
				resetsAt: fiveHourReset
			},
			sevenDay: {
				utilization: sevenDayUtilization,
				resetsAt: sevenDayReset
			}
		};
	}
}
