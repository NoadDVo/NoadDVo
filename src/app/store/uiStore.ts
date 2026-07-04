import { create } from "zustand";

type ThemeMode = "dark-arctic" | "light" | "high-contrast";
type SidebarPanel = "tools" | "layers" | "history" | "settings";
type DialogId = "settings" | "export" | "help" | null;

type UIState = {
  readonly theme: ThemeMode;
  readonly activeSidebar: SidebarPanel;
  readonly openDialog: DialogId;
  readonly commandPaletteOpen: boolean;
  readonly hoveredToolId: string | null;
  readonly setTheme: (theme: ThemeMode) => void;
  readonly setActiveSidebar: (sidebar: SidebarPanel) => void;
  readonly setOpenDialog: (dialog: DialogId) => void;
  readonly setCommandPaletteOpen: (open: boolean) => void;
  readonly setHoveredToolId: (toolId: string | null) => void;
  readonly resetUi: () => void;
};

const DEFAULT_UI_STATE = {
  activeSidebar: "tools",
  commandPaletteOpen: false,
  hoveredToolId: null,
  openDialog: null,
  theme: "dark-arctic",
} satisfies Pick<
  UIState,
  "activeSidebar" | "commandPaletteOpen" | "hoveredToolId" | "openDialog" | "theme"
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
  resetUi: () => {
    set(DEFAULT_UI_STATE);
  },
}));
