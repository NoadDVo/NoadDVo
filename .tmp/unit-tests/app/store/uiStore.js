"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUiStore = void 0;
exports.resolveThemeMode = resolveThemeMode;
const zustand_1 = require("zustand");
const DEFAULT_UI_STATE = {
    activeSidebar: "tools",
    commandPaletteOpen: false,
    hoveredToolId: null,
    keyboardModeHint: null,
    openDialog: null,
    theme: "dark-arctic",
    tikzMode: "academic",
};
function readStoredTheme() {
    if (typeof window === "undefined") {
        return DEFAULT_UI_STATE.theme;
    }
    const stored = window.localStorage.getItem("ndv.theme");
    return stored === "dark-arctic" || stored === "dark" || stored === "light" || stored === "system"
        ? stored
        : DEFAULT_UI_STATE.theme;
}
function resolveThemeMode(theme, systemPrefersLight) {
    return theme === "system" ? (systemPrefersLight ? "light" : "dark") : theme;
}
exports.useUiStore = (0, zustand_1.create)((set) => ({
    ...DEFAULT_UI_STATE,
    theme: readStoredTheme(),
    setTheme: (theme) => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("ndv.theme", theme);
        }
        set({ theme });
    },
    setActiveSidebar: (activeSidebar) => {
        set({ activeSidebar });
    },
    setOpenDialog: (openDialog) => {
        set({ openDialog });
    },
    setCommandPaletteOpen: (commandPaletteOpen) => {
        set({ commandPaletteOpen });
    },
    setHoveredToolId: (hoveredToolId) => {
        set({ hoveredToolId });
    },
    setKeyboardModeHint: (keyboardModeHint) => {
        set({ keyboardModeHint });
    },
    setTikzMode: (tikzMode) => {
        set({ tikzMode });
    },
    resetUi: () => {
        set(DEFAULT_UI_STATE);
    },
}));
