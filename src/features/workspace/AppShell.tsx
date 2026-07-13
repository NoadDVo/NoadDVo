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
  const [collapsedPanels, setCollapsedPanels] = useState({
    inspector: false,
    objectTree: false,
    tikz: false,
  });
  const rightPanelVisible = !collapsedPanels.objectTree || !collapsedPanels.inspector;
  const workspaceColumns = rightPanelVisible
    ? "grid-cols-[minmax(0,1fr)_320px]"
    : "grid-cols-[minmax(0,1fr)]";
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
          <div className={`grid h-full min-h-0 ${workspaceColumns} gap-2.5`}>
            <LeftToolbar />
            <div className={`grid min-h-0 ${centerRows} gap-2.5 overflow-hidden`}>
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
            {rightPanelVisible && (
              <aside
                className={
                  collapsedPanels.objectTree
                    ? "grid min-h-0 grid-rows-[40px_minmax(0,1fr)] gap-2.5 overflow-hidden max-lg:hidden"
                    : collapsedPanels.inspector
                      ? "grid min-h-0 grid-rows-[minmax(0,1fr)_40px] gap-2.5 overflow-hidden max-lg:hidden"
                      : "grid min-h-0 grid-rows-[minmax(0,0.38fr)_minmax(0,0.62fr)] gap-2.5 overflow-hidden max-lg:hidden"
                }
              >
                {collapsedPanels.objectTree ? (
                  <CollapsedPanelRail
                    direction="right"
                    label="Object Tree"
                    onExpand={() => setPanelCollapsed("objectTree", false)}
                  />
                ) : (
                  <CollapsiblePanelFrame
                    label="Collapse Object Tree"
                    onCollapse={() => setPanelCollapsed("objectTree", true)}
                    placement="right"
                  >
                    <GeometryTreePanel />
                  </CollapsiblePanelFrame>
                )}
                {collapsedPanels.inspector ? (
                  <CollapsedPanelRail
                    direction="right"
                    label="Inspector"
                    onExpand={() => setPanelCollapsed("inspector", false)}
                  />
                ) : (
                  <CollapsiblePanelFrame
                    label="Collapse Inspector"
                    onCollapse={() => setPanelCollapsed("inspector", true)}
                    placement="right"
                  >
                    <RightPanel />
                  </CollapsiblePanelFrame>
                )}
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
  readonly inspector: boolean;
  readonly objectTree: boolean;
  readonly tikz: boolean;
};

function WorkspaceRestoreControls({
  collapsedPanels,
  onRestore,
}: {
  readonly collapsedPanels: CollapsedPanelState;
  readonly onRestore: (panel: keyof CollapsedPanelState) => void;
}) {
  const rightControls = [
    collapsedPanels.objectTree
      ? {
          label: "Show Object Tree",
          panel: "objectTree" as const,
        }
      : null,
    collapsedPanels.inspector
      ? {
          label: "Show Inspector",
          panel: "inspector" as const,
        }
      : null,
  ].filter((control): control is { readonly label: string; readonly panel: "objectTree" | "inspector" } => Boolean(control));

  return (
    <>
      {rightControls.length > 0 && (
        <div className="absolute right-0 top-3 z-30 hidden max-h-[calc(100%-24px)] flex-col gap-2 overflow-hidden lg:flex">
          {rightControls.map((control) => (
            <EdgeRestoreButton
              direction="right"
              key={control.panel}
              label={control.label}
              onClick={() => onRestore(control.panel)}
            />
          ))}
        </div>
      )}
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

function EdgeRestoreButton({
  direction,
  label,
  onClick,
}: {
  readonly direction: "bottom" | "right";
  readonly label: string;
  readonly onClick: () => void;
}) {
  const Icon = direction === "bottom" ? PanelBottomOpen : PanelRightOpen;
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <button
      aria-label={label}
      className={clsx(
        "group flex items-center gap-2 border border-arctic-border/12 bg-arctic-background/88 text-[10px] font-black uppercase tracking-[0.14em] shadow-[0_16px_42px_rgb(0_0_0/0.28)] backdrop-blur-panel transition hover:border-arctic-ice/34 hover:bg-arctic-ice/12 hover:text-arctic-text",
        direction === "right" ? "min-h-11 rounded-l-[16px] border-r-0 px-3" : "h-10 rounded-[16px] px-4",
        appTheme === "theme2" ? "text-cyan-400" : "text-arctic-muted"
      )}
      onClick={onClick}
      style={{ pointerEvents: "auto" }}
      title={label}
      type="button"
    >
      <Icon className={clsx("transition", appTheme === "theme2" ? "text-cyan-400 group-hover:text-cyan-300" : "text-arctic-ice/80 group-hover:text-arctic-ice")} size={15} strokeWidth={2.2} />
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
  readonly placement: "bottom" | "right";
}) {
  const Icon = placement === "bottom" ? ChevronDown : ChevronRight;

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
