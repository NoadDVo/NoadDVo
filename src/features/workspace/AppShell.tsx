import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, PanelRightOpen, PanelBottomOpen } from "lucide-react";
import { clsx } from "clsx";

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
  const isLeftPanelOpen = useUiStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useUiStore((state) => state.isRightPanelOpen);
  const toggleLeftPanel = useUiStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useUiStore((state) => state.toggleRightPanel);

  const [collapsedPanels, setCollapsedPanels] = useState({
    tikz: false,
  });
  const centerRows = collapsedPanels.tikz
    ? "grid-rows-[minmax(0,1fr)_40px]"
    : "grid-rows-[minmax(0,0.56fr)_minmax(0,0.44fr)]";

  const setPanelCollapsed = (
    panel: keyof typeof collapsedPanels,
    collapsed: boolean,
  ) => {
    setCollapsedPanels((current) => ({
      ...current,
      [panel]: collapsed,
    }));
  };

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

  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <main className={clsx(
      "h-screen overflow-hidden text-arctic-text font-mono",
      appTheme === "theme1" ? "bg-[#F4EFE6]" : "",
      appTheme === "theme2" ? "bg-[#0D0E12]" : ""
    )}>
      <div className={clsx(
        "relative flex h-full flex-col",
        appTheme === "theme1" ? "bg-[#F4EFE6]" : "",
        appTheme === "theme2" ? "bg-[#0D0E12]" : ""
      )}>
        <TopBar />
        <div className="relative min-h-0 flex-1 px-3 pb-2.5 max-lg:pr-3">
          <div className="flex h-full min-h-0 w-full gap-2.5">
            {/* Left Column: Object Tree */}
            {isLeftPanelOpen && (
              <aside className="w-[280px] min-w-[280px] max-lg:hidden shrink-0">
                <CollapsiblePanelFrame
                  label="Collapse Object Tree"
                  onCollapse={toggleLeftPanel}
                  placement="left"
                >
                  <GeometryTreePanel />
                </CollapsiblePanelFrame>
              </aside>
            )}

            {/* Center Column: Canvas and TikZ Panel */}
            <div className="relative flex-1 min-w-0 flex flex-col gap-2.5">
              <LeftToolbar />
              <div className={`grid flex-1 min-h-0 ${centerRows} gap-2.5 overflow-hidden`}>
                <Canvas />
                {collapsedPanels.tikz ? (
                  <CollapsedPanelRail
                    direction="up"
                    label="Generated TikZ"
                    onExpand={() => setPanelCollapsed("tikz", false)}
                  />
                ) : (
                  <CollapsiblePanelFrame
                    label="Collapse Generated TikZ"
                    onCollapse={() => setPanelCollapsed("tikz", true)}
                    placement="bottom"
                  >
                    <TikzPanel />
                  </CollapsiblePanelFrame>
                )}
              </div>
            </div>

            {/* Right Column: Properties Inspector */}
            {isRightPanelOpen && (
              <aside className="w-[280px] min-w-[280px] max-lg:hidden shrink-0">
                <CollapsiblePanelFrame
                  label="Collapse Inspector"
                  onCollapse={toggleRightPanel}
                  placement="right"
                >
                  <RightPanel />
                </CollapsiblePanelFrame>
              </aside>
            )}
          </div>
          <WorkspaceRestoreControls
            collapsedPanels={collapsedPanels}
            onRestore={(panel) => setPanelCollapsed(panel, false)}
          />
        </div>
        <StatusBar />
        <SettingsDialog />
        <HelpDialog />
        <CommandPalette />
      </div>
    </main>
  );
}

type CollapsedPanelState = {
  readonly tikz: boolean;
};

function WorkspaceRestoreControls({
  collapsedPanels,
  onRestore,
}: {
  readonly collapsedPanels: CollapsedPanelState;
  readonly onRestore: (panel: keyof CollapsedPanelState) => void;
}) {
  return (
    <>
      {collapsedPanels.tikz && (
        <div className="pointer-events-none absolute bottom-3 left-[104px] right-0 z-30 flex justify-center">
          <EdgeRestoreButton
            direction="bottom"
            label="Show Generated TikZ"
            onClick={() => onRestore("tikz")}
          />
        </div>
      )}
    </>
  );
}

import { PanelLeftOpen } from "lucide-react";

function EdgeRestoreButton({
  direction,
  label,
  onClick,
}: {
  readonly direction: "bottom" | "right" | "left";
  readonly label: string;
  readonly onClick: () => void;
}) {
  const Icon = direction === "bottom" ? PanelBottomOpen : direction === "right" ? PanelRightOpen : PanelLeftOpen;
  
  return (
    <button
      aria-label={label}
      className={clsx(
        "group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] transition-all",
        // Position styles
        direction === "right" ? "min-h-11 rounded-l-md border-r-0 px-3" : 
        direction === "left" ? "min-h-11 rounded-r-md border-l-0 px-3" : 
        "h-10 rounded-md px-4",
        // Neo-Brutalism Theme
        "bg-[#F17A3C] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F4D04C]"
      )}
      onClick={onClick}
      style={{ pointerEvents: "auto" }}
      title={label}
      type="button"
    >
      <Icon className="text-black" size={15} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}

function CollapsiblePanelFrame({
  children,
  label,
  onCollapse,
  placement,
}: {
  readonly children: ReactNode;
  readonly label: string;
  readonly onCollapse: () => void;
  readonly placement: "bottom" | "right" | "left";
}) {
  const Icon = placement === "bottom" ? ChevronDown : placement === "right" ? ChevronRight : ChevronLeft;

  return (
    <div className="group/panel relative h-full min-h-0 overflow-hidden">
      <button
        aria-label={label}
        className="absolute right-3 top-3 z-20 inline-flex size-8 items-center justify-center rounded-[11px] border border-arctic-border/10 bg-arctic-background/70 text-arctic-muted opacity-80 shadow-[0_10px_28px_rgb(0_0_0/0.18)] backdrop-blur-panel transition hover:border-arctic-ice/35 hover:bg-arctic-ice/12 hover:text-arctic-text group-hover/panel:opacity-100"
        onClick={onCollapse}
        title={label}
        type="button"
      >
        <Icon size={16} strokeWidth={2.2} />
      </button>
      {children}
    </div>
  );
}

function CollapsedPanelRail({
  direction,
  label,
  onExpand,
}: {
  readonly direction: "right" | "up";
  readonly label: string;
  readonly onExpand: () => void;
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronLeft;

  return (
    <button
      className="flex min-h-0 items-center justify-center gap-2 rounded-[18px] border border-arctic-border/8 bg-arctic-surface/70 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-arctic-muted shadow-[0_16px_46px_rgb(0_0_0/0.18)] backdrop-blur-panel transition hover:border-arctic-ice/28 hover:bg-arctic-ice/10 hover:text-arctic-text"
      onClick={onExpand}
      title={`Expand ${label}`}
      type="button"
    >
      <Icon size={15} strokeWidth={2.2} />
      <span>{label}</span>
    </button>
  );
}
