import { create } from "zustand";

import type { TikzMode } from "../../core/tikz";

type ThemeMode = "dark-arctic" | "light" | "high-contrast";
type SidebarPanel = "tools" | "layers" | "history" | "settings";
type DialogId = "settings" | "export" | "help" | null;
type KeyboardModeHint = "pan" | "snap-off" | "constraint" | null;

type UIState = {
  readonly theme: ThemeMode;
  readonly activeSidebar: SidebarPanel;
  readonly openDialog: DialogId;
  readonly commandPaletteOpen: boolean;
  readonly hoveredToolId: string | null;
  readonly keyboardModeHint: KeyboardModeHint;
  readonly tikzMode: TikzMode;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly setActiveSidebar: (sidebar: SidebarPanel) => void;
  readonly setOpenDialog: (dialog: DialogId) => void;
  readonly setCommandPaletteOpen: (open: boolean) => void;
  readonly setHoveredToolId: (toolId: string | null) => void;
  readonly setKeyboardModeHint: (hint: KeyboardModeHint) => void;
  readonly setTikzMode: (mode: TikzMode) => void;
  readonly resetUi: () => void;
};

const DEFAULT_UI_STATE = {
  activeSidebar: "tools",
  commandPaletteOpen: false,
  hoveredToolId: null,
  keyboardModeHint: null,
  openDialog: null,
  theme: "dark-arctic",
  tikzMode: "academic",
} satisfies Pick<
  UIState,
  | "activeSidebar"
  | "commandPaletteOpen"
  | "hoveredToolId"
  | "keyboardModeHint"
  | "openDialog"
  | "theme"
  | "tikzMode"
>;

export const useUiStore = create<UIState>((set) => ({
  ...DEFAULT_UI_STATE,
  setTheme: (theme) => {
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
