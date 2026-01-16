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

/**
 * Service for fetching account usage limits from Claude Code CLI
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

}
