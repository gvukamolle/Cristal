/**
 * Terminal module exports
 */

export { TerminalView, TERMINAL_VIEW_TYPE } from "./TerminalView";
export { TerminalService } from "./TerminalService";
export { XtermWrapper } from "./XtermWrapper";
export { PythonPtyBackend } from "./PythonPtyBackend";
export { FallbackPtyBackend } from "./FallbackPtyBackend";
export type {
	IPtyBackend,
	PtySpawnOptions,
	TerminalProfile,
	TerminalSettings,
	TerminalSession,
	BackendType
} from "./types";
export { getDefaultProfiles, DEFAULT_TERMINAL_SETTINGS } from "./types";
