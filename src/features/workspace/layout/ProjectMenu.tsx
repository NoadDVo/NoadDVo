import { useRef, useState, type ChangeEvent } from "react";
import {
  FilePlus2,
  FolderClock,
  Save,
  SaveAll,
  Upload,
} from "lucide-react";

import {
  useGeometryStore,
  type ExampleSceneId,
} from "../../../app/store/geometryStore";
import { projectManager, type ProjectManagerState } from "../../../core/project";
import { Button } from "../../../ui/primitives";

type ProjectMenuProps = {
  readonly projectState: ProjectManagerState;
};

export function ProjectMenu({ projectState }: ProjectMenuProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  const loadExample = (exampleId: ExampleSceneId) => {
    if (!useGeometryStore.getState().loadExample(exampleId)) {
      window.alert("The example scene could not be loaded.");
    }

    setExamplesOpen(false);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    projectManager.openProjectText(await file.text());
  };

  return (
    <>
      <input
        accept=".ndv,application/json"
        className="hidden"
        onChange={handleImport}
        ref={fileInputRef}
        type="file"
      />
      <Button
        icon={<FilePlus2 size={16} strokeWidth={2} />}
        onClick={() => projectManager.newProject()}
        size="sm"
        variant="ghost"
      >
        New Project
      </Button>
      <ExamplesMenu open={examplesOpen} setOpen={setExamplesOpen} loadExample={loadExample} />
      <Button
        icon={<Upload size={16} strokeWidth={2} />}
        onClick={() => fileInputRef.current?.click()}
        size="sm"
        variant="ghost"
      >
        Open
      </Button>
      <Button
        icon={<Save size={16} strokeWidth={2} />}
        onClick={() => projectManager.saveProject()}
        size="sm"
        variant="ghost"
      >
        Save
      </Button>
      <Button
        icon={<SaveAll size={16} strokeWidth={2} />}
        onClick={() => projectManager.saveProjectAs()}
        size="sm"
        variant="ghost"
      >
        Save As
      </Button>
      <RecentProjectsMenu
        open={recentOpen}
        projectState={projectState}
        setOpen={setRecentOpen}
      />
    </>
  );
}

function ExamplesMenu({
  loadExample,
  open,
  setOpen,
}: {
  readonly loadExample: (exampleId: ExampleSceneId) => void;
  readonly open: boolean;
  readonly setOpen: (open: boolean | ((current: boolean) => boolean)) => void;
}) {
  return (
    <div className="relative">
      <Button onClick={() => setOpen((current) => !current)} size="sm" variant="ghost">
        Load Example
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-[16px] border border-white/10 bg-[#101b24]/95 p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.38)] backdrop-blur-panel">
          {[
            ["triangle", "Triangle"],
            ["circle", "Circle"],
            ["olympiad", "Olympiad Sample"],
            ["coordinate", "Coordinate Geometry"],
          ].map(([id, label]) => (
            <button
              className="block w-full rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-white/8 hover:text-arctic-ice"
              key={id}
              onClick={() => loadExample(id as ExampleSceneId)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentProjectsMenu({
  open,
  projectState,
  setOpen,
}: {
  readonly open: boolean;
  readonly projectState: ProjectManagerState;
  readonly setOpen: (open: boolean | ((current: boolean) => boolean)) => void;
}) {
  return (
    <div className="relative">
      <Button
        icon={<FolderClock size={16} strokeWidth={2} />}
        onClick={() => setOpen((current) => !current)}
        size="sm"
        variant="ghost"
      >
        Recent
      </Button>
      {open && (
        <div className="absolute right-0 top-11 z-30 w-72 overflow-hidden rounded-[16px] border border-white/10 bg-[#101b24]/95 p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.38)] backdrop-blur-panel">
          {projectState.recentProjects.length === 0 ? (
            <div className="rounded-[12px] px-3 py-3 text-[11px] font-semibold text-arctic-muted">
              No recent projects yet.
            </div>
          ) : (
            projectState.recentProjects.map((project) => (
              <button
                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left transition hover:bg-white/8"
                key={project.id}
                onClick={() => {
                  projectManager.openRecentProject(project);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-arctic-ice/15 bg-arctic-ice/10 text-[10px] font-black text-arctic-ice">
                  NDV
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text">
                    {project.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-arctic-muted">
                    {new Date(project.modifiedAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

