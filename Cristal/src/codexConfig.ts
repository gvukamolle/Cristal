import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { CodexReasoningLevel } from "./types";

const CODEX_CONFIG_DIR = path.join(os.homedir(), ".codex");
const CODEX_CONFIG_PATH = path.join(CODEX_CONFIG_DIR, "config.toml");

/**
 * Reads and parses ~/.codex/config.toml
 * Returns a simple key-value record (only supports basic TOML)
 */
export function getCodexConfig(): Record<string, string> {
	try {
		if (!fs.existsSync(CODEX_CONFIG_PATH)) {
			return {};
		}
		const content = fs.readFileSync(CODEX_CONFIG_PATH, "utf-8");
		const config: Record<string, string> = {};

		for (const line of content.split("\n")) {
			// Match key = "value" or key = 'value'
			const match = line.match(/^(\w+)\s*=\s*["']([^"']+)["']/);
			if (match && match[1] && match[2]) {
				config[match[1]] = match[2];
			}
		}
		return config;
	} catch {
		return {};
	}
}

/**
 * Gets the current reasoning level from config.toml
 * Maps old values (low/high) to new simplified values (medium/xhigh)
 */
export function getCodexReasoningLevel(): CodexReasoningLevel | null {
	const config = getCodexConfig();
	const level = config["model_reasoning_effort"];
	// Map old values to new simplified ones
	if (level === "low" || level === "medium") {
		return "medium";
	}
	if (level === "high" || level === "xhigh") {
		return "xhigh";
	}
	return null;
}

/**
 * Sets the reasoning level in ~/.codex/config.toml
 * Creates the config directory and file if they don't exist
 */
export function setCodexReasoningLevel(level: CodexReasoningLevel): void {
	try {
		// Ensure config directory exists
		if (!fs.existsSync(CODEX_CONFIG_DIR)) {
			fs.mkdirSync(CODEX_CONFIG_DIR, { recursive: true });
		}

		let content = "";
		if (fs.existsSync(CODEX_CONFIG_PATH)) {
			content = fs.readFileSync(CODEX_CONFIG_PATH, "utf-8");
		}

		// Update or add model_reasoning_effort
		const regex = /model_reasoning_effort\s*=\s*["'][^"']+["']/;
		if (regex.test(content)) {
			// Replace existing value
			content = content.replace(regex, `model_reasoning_effort = "${level}"`);
		} else {
			// Add new line (ensure trailing newline)
			if (content && !content.endsWith("\n")) {
				content += "\n";
			}
			content += `model_reasoning_effort = "${level}"\n`;
		}

		fs.writeFileSync(CODEX_CONFIG_PATH, content, "utf-8");
		console.log(`[CodexConfig] Set model_reasoning_effort = "${level}" in ${CODEX_CONFIG_PATH}`);
	} catch (err) {
		console.error("[CodexConfig] Failed to write config.toml:", err);
	}
}

/**
 * Checks if the config file exists
 */
export function codexConfigExists(): boolean {
	return fs.existsSync(CODEX_CONFIG_PATH);
}
