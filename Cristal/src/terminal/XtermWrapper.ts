/**
 * xterm.js wrapper for Obsidian terminal
 *
 * Handles terminal rendering, addons, and theme integration
 */

import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import type { IPtyBackend } from "./types";

export interface XtermOptions {
	fontSize?: number;
	fontFamily?: string;
	cursorStyle?: "block" | "underline" | "bar";
	scrollback?: number;
}

export class XtermWrapper {
	private terminal: Terminal;
	private fitAddon: FitAddon;
	private searchAddon: SearchAddon;
	private container: HTMLElement;
	private backend: IPtyBackend | null = null;
	private resizeObserver: ResizeObserver;
	private disposed: boolean = false;

	constructor(container: HTMLElement, options?: XtermOptions) {
		this.container = container;

		// Create terminal with options
		this.terminal = new Terminal({
			fontSize: options?.fontSize ?? 14,
			fontFamily: options?.fontFamily ?? 'Menlo, Monaco, "Courier New", monospace',
			cursorStyle: options?.cursorStyle ?? "block",
			scrollback: options?.scrollback ?? 1000,
			theme: this.getTheme(),
			cursorBlink: true,
			allowProposedApi: true,
			convertEol: false, // Let PTY handle line endings
			// Better rendering
			smoothScrollDuration: 0,
			// Accessibility
			screenReaderMode: false,
			// Scrolling behavior
			scrollOnUserInput: true
		});

		// Load addons
		this.fitAddon = new FitAddon();
		this.terminal.loadAddon(this.fitAddon);

		// Search addon for find functionality
		this.searchAddon = new SearchAddon();
		this.terminal.loadAddon(this.searchAddon);

		// Web links addon for clickable URLs
		this.terminal.loadAddon(new WebLinksAddon((_, uri) => {
			// Open links in default browser
			window.open(uri, "_blank");
		}));

		// Open terminal in container
		this.terminal.open(container);

		// Initial fit
		this.fitAddon.fit();

		// Handle resize
		this.resizeObserver = new ResizeObserver(() => {
			if (!this.disposed) {
				this.fit();
			}
		});
		this.resizeObserver.observe(container);

		// Handle user input
		this.terminal.onData((data) => {
			this.backend?.write(data);
		});
	}

	/**
	 * Get theme from Obsidian CSS variables
	 */
	private getTheme() {
		const style = getComputedStyle(document.body);

		const getVar = (name: string, fallback: string): string => {
			const value = style.getPropertyValue(name).trim();
			return value || fallback;
		};

		return {
			background: getVar("--background-primary", "#1e1e1e"),
			foreground: getVar("--text-normal", "#d4d4d4"),
			cursor: getVar("--text-accent", "#aeafad"),
			cursorAccent: getVar("--background-primary", "#1e1e1e"),
			selectionBackground: getVar("--text-selection", "#264f78"),
			selectionForeground: undefined,
			// ANSI colors
			black: "#000000",
			red: "#cd3131",
			green: "#0dbc79",
			yellow: "#e5e510",
			blue: "#2472c8",
			magenta: "#bc3fbc",
			cyan: "#11a8cd",
			white: "#e5e5e5",
			brightBlack: "#666666",
			brightRed: "#f14c4c",
			brightGreen: "#23d18b",
			brightYellow: "#f5f543",
			brightBlue: "#3b8eea",
			brightMagenta: "#d670d6",
			brightCyan: "#29b8db",
			brightWhite: "#e5e5e5"
		};
	}

	/**
	 * Filter out problematic escape sequences that xterm.js doesn't handle well
	 */
	private filterEscapeSequences(data: string): string {
		// Remove OSC sequences if present (ESC ] ... BEL or ESC ] ... ST)
		// BEL = \x07, ST = ESC \ = \x1b\\
		let filtered = data.replace(/\x1b\].*?\x07/g, "");
		filtered = filtered.replace(/\x1b\].*?\x1b\\/g, "");

		return filtered;
	}

	/**
	 * Attach a PTY backend to this terminal
	 */
	attach(backend: IPtyBackend): void {
		this.backend = backend;

		// Handle output from PTY
		backend.on("data", (data: string) => {
			if (!this.disposed) {
				// Filter problematic escape sequences before writing
				const filtered = this.filterEscapeSequences(data);
				if (filtered) {
					this.terminal.write(filtered);
				}
			}
		});

		// Handle PTY exit
		backend.on("exit", (code: number) => {
			if (!this.disposed) {
				this.terminal.write(`\r\n\x1b[90m[Process exited with code ${code}]\x1b[0m\r\n`);
			}
		});

		// Handle PTY errors
		backend.on("error", (error: Error) => {
			if (!this.disposed) {
				this.terminal.write(`\r\n\x1b[31m[Error: ${error.message}]\x1b[0m\r\n`);
			}
		});

		// Initial resize will be sent by ResizeObserver when container is ready
		// Don't send it here - dimensions may not be valid yet
		setTimeout(() => {
			// Trigger fit after a short delay to ensure terminal is rendered
			this.fit();
		}, 50);
	}

	/**
	 * Fit terminal to container and notify backend of resize
	 */
	fit(): void {
		if (this.disposed) return;

		try {
			this.fitAddon.fit();
			const dims = this.fitAddon.proposeDimensions();
			if (dims && dims.cols > 0 && dims.rows > 0 && !isNaN(dims.cols) && !isNaN(dims.rows) && this.backend) {
				this.backend.resize(dims.cols, dims.rows);
			}
		} catch {
			// Ignore fit errors during disposal
		}
	}

	/**
	 * Write data directly to terminal (bypassing PTY)
	 */
	write(data: string): void {
		if (!this.disposed) {
			this.terminal.write(data);
		}
	}

	/**
	 * Write a line with automatic CRLF
	 */
	writeln(data: string): void {
		if (!this.disposed) {
			this.terminal.writeln(data);
		}
	}

	/**
	 * Clear terminal screen
	 */
	clear(): void {
		if (!this.disposed) {
			this.terminal.clear();
		}
	}

	/**
	 * Focus the terminal
	 */
	focus(): void {
		if (!this.disposed) {
			this.terminal.focus();
		}
	}

	/**
	 * Scroll to bottom
	 */
	scrollToBottom(): void {
		if (!this.disposed) {
			this.terminal.scrollToBottom();
		}
	}

	/**
	 * Get current terminal dimensions
	 */
	getDimensions(): { cols: number; rows: number } | null {
		return this.fitAddon.proposeDimensions() || null;
	}

	/**
	 * Update theme (e.g., when Obsidian theme changes)
	 */
	updateTheme(): void {
		if (!this.disposed) {
			this.terminal.options.theme = this.getTheme();
		}
	}

	/**
	 * Search for text in terminal
	 */
	findNext(term: string): boolean {
		if (this.disposed) return false;
		return this.searchAddon.findNext(term);
	}

	/**
	 * Search backwards for text in terminal
	 */
	findPrevious(term: string): boolean {
		if (this.disposed) return false;
		return this.searchAddon.findPrevious(term);
	}

	/**
	 * Cleanup resources
	 */
	dispose(): void {
		this.disposed = true;
		this.resizeObserver.disconnect();
		this.terminal.dispose();
	}
}
