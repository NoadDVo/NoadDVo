import { useEffect } from "react";

import { projectManager } from "../../core/project";
import { Canvas } from "../canvas";
import { CommandPalette } from "../command-palette";
import { GeometryTreePanel } from "../object-tree";
import { RightPanel } from "../properties";
import { SettingsDialog } from "../settings";
import { TikzPanel } from "../tikz-panel";
import { LeftToolbar } from "../toolbar";
import { StatusBar, TopBar } from "./layout";
import { HelpDialog } from "./layout/HelpDialog";
import { resolveThemeMode, useUiStore } from "../../app/store/uiStore";

export function AppShell() {
  const theme = useUiStore((state) => state.theme);

  useEffect(() => {
    projectManager.startAutosave();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => {
      const resolvedTheme = resolveThemeMode(theme, media.matches);

      document.documentElement.dataset.theme = resolvedTheme;
      document.body.dataset.theme = resolvedTheme;
      document.documentElement.style.colorScheme =
        resolvedTheme === "light" ? "light" : "dark";
    };

    applyTheme();

    if (theme !== "system") {
      return undefined;
    }

    media.addEventListener("change", applyTheme);

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  return (
    <main className="h-screen overflow-hidden bg-arctic-background text-arctic-text">
      <div className="relative flex h-full flex-col bg-[radial-gradient(circle_at_50%_-10%,rgb(var(--color-primary)/0.13),transparent_34%),linear-gradient(135deg,rgb(var(--color-bg-secondary)),rgb(var(--color-bg))_65%,rgb(var(--color-canvas)))]">
        <TopBar />
        <div className="grid min-h-0 flex-1 grid-cols-[64px_minmax(0,1fr)_320px] gap-2.5 px-3 pb-2.5 max-lg:grid-cols-[64px_minmax(0,1fr)] max-lg:pr-3">
          <LeftToolbar />
          <div className="grid min-h-0 grid-rows-[minmax(260px,0.56fr)_minmax(238px,0.44fr)] gap-2.5">
            <Canvas />
            <TikzPanel />
          </div>
          <aside className="grid min-h-0 grid-rows-[minmax(190px,0.38fr)_minmax(260px,0.62fr)] gap-2.5 max-lg:hidden">
            <GeometryTreePanel />
            <RightPanel />
          </aside>
        </div>
        <StatusBar />
        <SettingsDialog />
        <HelpDialog />
        <CommandPalette />
      </div>
    </main>
  );
}
