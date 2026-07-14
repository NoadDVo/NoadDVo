import { useSyncExternalStore } from "react";
import { clsx } from "clsx";

import { useUiStore } from "../../../app/store/uiStore";

import { useAppStore } from "../../../app/store/appStore";
import { projectManager } from "../../../core/project";
import { Divider } from "../../../ui/primitives";
import { ExportMenu } from "./ExportMenu";
import { HelpGroup } from "./HelpGroup";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectDialogs } from "./ProjectDialogs";
import { ThemeGroup } from "./ThemeGroup";
import { UndoRedoGroup } from "./UndoRedoGroup";
import { PanelLeft, PanelRight } from "lucide-react";

export function TopBar() {
  const appName = useAppStore((state) => state.appName);
  const projectState = useSyncExternalStore(
    projectManager.subscribe,
    projectManager.getSnapshot,
    projectManager.getSnapshot,
  );

  const appTheme = useUiStore((state) => state.appTheme);
  const isLeftPanelOpen = useUiStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useUiStore((state) => state.isRightPanelOpen);
  const toggleLeftPanel = useUiStore((state) => state.toggleLeftPanel);
  const toggleRightPanel = useUiStore((state) => state.toggleRightPanel);

  return (
    <>
      <header className={clsx(
        "flex h-[60px] shrink-0 items-center gap-4 px-4 z-40 relative transition-colors duration-200",
        appTheme === "theme1" ? "border-b-[3px] border-black bg-[#F4EFE6] shadow-[0_4px_0_0_rgba(0,0,0,1)]" : "",
        appTheme === "theme2" ? "border-b border-zinc-800/60 bg-[#0D0E12] shadow-sm" : ""
      )}>
        <div className="flex min-w-0 items-center gap-3">
          <div className={clsx(
            "flex size-10 items-center justify-center text-base font-black transition-colors duration-200",
            appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F17A3C] text-black shadow-brutal-sm" : "",
            appTheme === "theme2" ? "rounded-md bg-[#2C2D35] text-zinc-200 border border-zinc-700/50" : ""
          )}>
            N
          </div>
          <div className="min-w-0">
            <p className={clsx(
              "text-[10px] uppercase tracking-[0.22em]",
              appTheme === "theme1" ? "text-black" : "",
              appTheme === "theme2" ? "text-zinc-500" : ""
            )}>
              NoadDVo
            </p>
            <h1 className={clsx(
              "truncate text-base uppercase tracking-[0.1em] leading-none",
              appTheme === "theme1" ? "text-black font-black" : "",
              appTheme === "theme2" ? "text-zinc-200 font-bold" : ""
            )}>
              {projectState.currentProject.name || appName}
            </h1>
          </div>
        </div>

        <Divider orientation="vertical" className="my-4 hidden sm:block" />
        <UndoRedoGroup />

        <div className="ml-auto flex items-center gap-2">
          {/* Panel Toggle Group */}
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={toggleLeftPanel}
              className={clsx(
                "flex h-8 items-center gap-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                appTheme === "theme1" 
                  ? isLeftPanelOpen
                    ? "bg-[#F17A3C] hover:bg-[#F4D04C] text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]"
                    : "bg-[#F4EFE6] hover:bg-[#F4D04C] text-black border-[2px] border-black"
                  : isLeftPanelOpen
                    ? "bg-[#2C2D35] text-cyan-400 border border-zinc-700/50 shadow-sm"
                    : "bg-transparent text-zinc-500 hover:text-zinc-300"
              )}
              title="Toggle Object Tree"
            >
              <PanelLeft size={14} />
              <span className="hidden md:inline">Object Tree</span>
            </button>
            <button
              onClick={toggleRightPanel}
              className={clsx(
                "flex h-8 items-center gap-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                appTheme === "theme1" 
                  ? isRightPanelOpen
                    ? "bg-[#F17A3C] hover:bg-[#F4D04C] text-black border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-x-[1px] -translate-y-[1px]"
                    : "bg-[#F4EFE6] hover:bg-[#F4D04C] text-black border-[2px] border-black"
                  : isRightPanelOpen
                    ? "bg-[#2C2D35] text-cyan-400 border border-zinc-700/50 shadow-sm"
                    : "bg-transparent text-zinc-500 hover:text-zinc-300"
              )}
              title="Toggle Properties"
            >
              <PanelRight size={14} />
              <span className="hidden md:inline">Inspector</span>
            </button>
          </div>

          <ProjectMenu projectState={projectState} />
          <ExportMenu />
          <ThemeGroup />
          <HelpGroup />
        </div>
      </header>
      <ProjectDialogs projectState={projectState} />
    </>
  );
}
