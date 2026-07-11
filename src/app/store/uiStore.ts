import { create } from "zustand";

import type { TikzMode } from "../../core/tikz";

export type ThemeMode = "dark-arctic" | "dark" | "light" | "system";
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;
export type AppTheme = "theme1" | "theme2";
type SidebarPanel = "tools" | "layers" | "history" | "settings";
type DialogId = "settings" | "export" | "help" | null;
type KeyboardModeHint = "pan" | "snap-off" | "constraint" | null;

type UIState = {
  readonly appTheme: AppTheme;
  readonly theme: ThemeMode;
  readonly activeSidebar: SidebarPanel;
  readonly openDialog: DialogId;
  readonly commandPaletteOpen: boolean;
  readonly hoveredToolId: string | null;
  readonly keyboardModeHint: KeyboardModeHint;
  readonly tikzMode: TikzMode;
  readonly inspectorLocked: boolean;
  readonly lockedObjectId: string | null;
  readonly setAppTheme: (theme: AppTheme) => void;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly setActiveSidebar: (sidebar: SidebarPanel) => void;
  readonly setOpenDialog: (dialog: DialogId) => void;
  readonly setCommandPaletteOpen: (open: boolean) => void;
  readonly setHoveredToolId: (toolId: string | null) => void;
  readonly setKeyboardModeHint: (hint: KeyboardModeHint) => void;
  readonly setTikzMode: (mode: TikzMode) => void;
  readonly setInspectorLocked: (locked: boolean) => void;
  readonly setLockedObjectId: (id: string | null) => void;
  readonly resetUi: () => void;
};

const DEFAULT_UI_STATE = {
  activeSidebar: "tools",
  appTheme: "theme1" as AppTheme,
  commandPaletteOpen: false,
  hoveredToolId: null,
  keyboardModeHint: null,
  openDialog: null,
  theme: "dark-arctic",
  tikzMode: "academic",
  inspectorLocked: false,
  lockedObjectId: null,
} satisfies Pick<
  UIState,
  | "activeSidebar"
  | "appTheme"
  | "commandPaletteOpen"
  | "hoveredToolId"
  | "keyboardModeHint"
  | "openDialog"
  | "theme"
  | "tikzMode"
  | "inspectorLocked"
  | "lockedObjectId"
>;

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return DEFAULT_UI_STATE.theme;
  }

  const stored = window.localStorage.getItem("ndv.theme");

  return stored === "dark-arctic" || stored === "dark" || stored === "light" || stored === "system"
    ? stored
    : DEFAULT_UI_STATE.theme;
}

export function resolveThemeMode(
  theme: ThemeMode,
  systemPrefersLight: boolean,
): ResolvedThemeMode {
  return theme === "system" ? (systemPrefersLight ? "light" : "dark") : theme;
}

export const useUiStore = create<UIState>((set) => ({
  ...DEFAULT_UI_STATE,
  theme: readStoredTheme(),
  setAppTheme: (appTheme) => {
    set({ appTheme });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ndv.appTheme", appTheme);
    }
  },
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
  setInspectorLocked: (inspectorLocked) => {
    set({ inspectorLocked });
  },
  setLockedObjectId: (lockedObjectId) => {
    set({ lockedObjectId });
  },
  resetUi: () => {
    set(DEFAULT_UI_STATE);
  },
}));
