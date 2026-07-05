import { useRef, useState, type ChangeEvent } from "react";
import {
  CircleHelp,
  Download,
  FilePlus2,
  Moon,
  Redo2,
  Save,
  Settings,
  Undo2,
  Upload,
} from "lucide-react";

import { useAppStore } from "../../../app/store/appStore";
import {
  useGeometryStore,
  type ExampleSceneId,
} from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { exportManager, importProjectJson } from "../../../core/export";
import { Button, Divider, IconButton } from "../../../ui/primitives";

export function TopBar() {
  const appName = useAppStore((state) => state.appName);
  const canUndo = useGeometryStore((state) => state.canUndo);
  const canRedo = useGeometryStore((state) => state.canRedo);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);

  const createProjectSnapshot = () => {
    const geometry = useGeometryStore.getState();
    const viewport = useViewportStore.getState();

    return {
      objects: geometry.objects,
      projectName: appName,
      selectedObjectIds: geometry.selectedObjectIds,
      settings: {
        gridSize: viewport.gridSize,
        showAxes: viewport.showAxes,
        showGrid: viewport.showGrid,
        snapEnabled: viewport.snapEnabled,
      },
      viewport: viewport.viewport,
    };
  };

  const getCanvasSvg = () =>
    document.querySelector<SVGSVGElement>('svg[aria-label="Geometry canvas"]');

  const runExport = (action: () => void) => {
    try {
      action();
      setExportOpen(false);
    } catch {
      window.alert("Export failed. Please try again.");
    }
  };

  const loadExample = (exampleId: ExampleSceneId) => {
    if (!useGeometryStore.getState().loadExample(exampleId)) {
      window.alert("The example scene could not be loaded.");
    }

    setExamplesOpen(false);
  };

  const handleNewProject = () => {
    const hasObjects = Object.keys(useGeometryStore.getState().objects).length > 0;

    if (
      hasObjects &&
      !window.confirm("Clear the current geometry and start a new project?")
    ) {
      return;
    }

    useGeometryStore.getState().clearProject();
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const result = importProjectJson(await file.text());

    if (!result.valid) {
      window.alert(result.error);

      return;
    }

    const geometry = useGeometryStore.getState();
    const viewport = useViewportStore.getState();

    if (!geometry.setObjects(result.objects, "Import project", result.project.selection)) {
      window.alert("The project contains invalid geometry.");

      return;
    }

    viewport.setViewportState(result.project.viewport, result.project.settings);
  };

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-white/8 bg-[#101b24]/70 px-4 backdrop-blur-panel">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-[12px] border border-arctic-ice/25 bg-arctic-ice/10 text-sm font-black text-arctic-ice shadow-[0_0_24px_rgb(168_216_255/0.14)]">
          N
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-arctic-muted">
            NoadDVo
          </p>
          <h1 className="truncate text-sm font-bold uppercase tracking-[0.12em] text-arctic-text">
            {appName}
          </h1>
        </div>
      </div>

      <Divider orientation="vertical" className="my-4 hidden sm:block" />

      <div className="hidden items-center gap-2 sm:flex">
        <IconButton
          disabled={!canUndo}
          label="Undo"
          onClick={() => useGeometryStore.getState().undo()}
        >
          <Undo2 size={18} strokeWidth={2} />
        </IconButton>
        <IconButton
          disabled={!canRedo}
          label="Redo"
          onClick={() => useGeometryStore.getState().redo()}
        >
          <Redo2 size={18} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <input
          accept=".ndv,application/json"
          className="hidden"
          onChange={handleImport}
          ref={fileInputRef}
          type="file"
        />
        <Button
          icon={<FilePlus2 size={16} strokeWidth={2} />}
          onClick={handleNewProject}
          size="sm"
          variant="ghost"
        >
          New Project
        </Button>
        <div className="relative">
          <Button
            onClick={() => setExamplesOpen((open) => !open)}
            size="sm"
            variant="ghost"
          >
            Load Example
          </Button>
          {examplesOpen && (
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
          onClick={() => exportManager.exportJson(createProjectSnapshot())}
          size="sm"
          variant="ghost"
        >
          Save
        </Button>
        <div className="relative">
          <Button
            icon={<Download size={16} strokeWidth={2} />}
            onClick={() => setExportOpen((open) => !open)}
            size="sm"
            variant="primary"
          >
            Export
          </Button>
          {exportOpen && (
            <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-[16px] border border-white/10 bg-[#101b24]/95 p-1.5 shadow-[0_18px_50px_rgb(0_0_0/0.38)] backdrop-blur-panel">
              <button
                className="block w-full rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-white/8 hover:text-arctic-ice"
                onClick={() =>
                  runExport(() =>
                    exportManager.exportTikz(useGeometryStore.getState().objects),
                  )
                }
                type="button"
              >
                TikZ
              </button>
              <button
                className="block w-full rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-white/8 hover:text-arctic-ice"
                onClick={() =>
                  runExport(() =>
                    exportManager.exportTex(useGeometryStore.getState().objects),
                  )
                }
                type="button"
              >
                TeX
              </button>
              <button
                className="block w-full rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-white/8 hover:text-arctic-ice"
                onClick={() =>
                  runExport(() => {
                    const svg = getCanvasSvg();

                    if (!svg) {
                      throw new Error("Missing canvas SVG.");
                    }

                    exportManager.exportSvg(svg);
                  })
                }
                type="button"
              >
                SVG
              </button>
              <button
                className="block w-full rounded-[12px] px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition hover:bg-white/8 hover:text-arctic-ice"
                onClick={() =>
                  runExport(() => exportManager.exportJson(createProjectSnapshot()))
                }
                type="button"
              >
                JSON
              </button>
            </div>
          )}
        </div>
        <IconButton disabled label="Theme - Coming soon">
          <Moon size={18} strokeWidth={2} />
        </IconButton>
        <IconButton disabled label="Settings - Coming soon">
          <Settings size={18} strokeWidth={2} />
        </IconButton>
        <IconButton disabled label="Help - Coming soon">
          <CircleHelp size={18} strokeWidth={2} />
        </IconButton>
      </div>
    </header>
  );
}
