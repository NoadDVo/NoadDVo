import { useSyncExternalStore } from "react";

import { useAppStore } from "../../../app/store/appStore";
import { projectManager } from "../../../core/project";
import { Divider } from "../../../ui/primitives";
import { ExportMenu } from "./ExportMenu";
import { HelpGroup } from "./HelpGroup";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectDialogs } from "./ProjectDialogs";
import { ThemeGroup } from "./ThemeGroup";
import { UndoRedoGroup } from "./UndoRedoGroup";

export function TopBar() {
  const appName = useAppStore((state) => state.appName);
  const projectState = useSyncExternalStore(
    projectManager.subscribe,
    projectManager.getSnapshot,
    projectManager.getSnapshot,
  );

  return (
    <>
      <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-arctic-border/8 bg-arctic-surface/72 px-4 backdrop-blur-panel">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-[12px] border border-arctic-ice/25 bg-arctic-ice/10 text-sm font-black text-arctic-ice shadow-[0_0_24px_rgb(168_216_255/0.14)]">
            N
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-muted">
              NoadDVo
            </p>
            <h1 className="truncate text-sm font-bold uppercase tracking-[0.12em] text-arctic-text">
              {projectState.currentProject.name || appName}
            </h1>
          </div>
        </div>

        <Divider orientation="vertical" className="my-4 hidden sm:block" />
        <UndoRedoGroup />

        <div className="ml-auto flex items-center gap-2">
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
