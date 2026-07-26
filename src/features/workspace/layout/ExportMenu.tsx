import { useRef } from "react";
import { Download } from "lucide-react";

import { useAppStore } from "../../../app/store/appStore";
import { useGeometryStore } from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { useUiStore } from "../../../app/store/uiStore";
import { exportManager } from "../../../core/export";
import { projectManager } from "../../../core/project";
import { Button } from "../../../ui/primitives";
import { AnchoredOverlay } from "../../../ui/overlay/OverlayPortal";

export function ExportMenu() {
  const appName = useAppStore((state) => state.appName);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  
  const activeMenu = useUiStore((state) => state.activeTopBarMenu);
  const setActiveMenu = useUiStore((state) => state.setActiveTopBarMenu);
  const openDialog = useUiStore((state) => state.openDialog);
  
  const exportOpen = activeMenu === "export";
  const setExportOpen = (open: boolean | ((prev: boolean) => boolean)) => {
    const nextOpen = typeof open === "function" ? open(exportOpen) : open;
    setActiveMenu(nextOpen ? "export" : null);
  };
  
  const isDisabled = (activeMenu !== null && activeMenu !== "export") || openDialog !== null;

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

  const runExport = (action: () => void) => {
    try {
      action();
      setExportOpen(false);
    } catch {
      window.alert("Export failed. Please try again.");
    }
  };

  const promptFilename = (extension: string) => {
    const projectName = projectManager.getSnapshot().currentProject.name || "Untitled";
    const suggestedName = `${projectName}.${extension}`;
    const filename = window.prompt("Enter file name (Nhập tên file để lưu):", suggestedName);
    if (!filename) return null;
    return filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;
  };

  return (
    <div>
      <Button
        icon={<Download size={16} strokeWidth={2} />}
        onClick={() => setExportOpen((open) => !open)}
        ref={buttonRef}
        size="sm"
        variant="topbar"
        active={exportOpen}
        disabled={isDisabled}
      >
        Export
      </Button>
      <AnchoredOverlay anchorRef={buttonRef} open={exportOpen} width={176}>
        <div className="overflow-hidden border-[3px] border-arctic-border bg-arctic-surface p-1.5 shadow-brutal">
          <ExportOption
            label="TikZ"
            onClick={() => {
              const filename = promptFilename("tex");
              if (filename) {
                runExport(() => exportManager.exportTikz(useGeometryStore.getState().objects, filename));
              }
            }}
          />
          <ExportOption
            label="TeX"
            onClick={() => {
              const filename = promptFilename("tex");
              if (filename) {
                runExport(() => exportManager.exportTex(useGeometryStore.getState().objects, filename));
              }
            }}
          />
          <ExportOption
            label="JSON"
            onClick={() => {
              const filename = promptFilename("json");
              if (filename) {
                runExport(() => exportManager.exportJson(createProjectSnapshot(), filename));
              }
            }}
          />
        </div>
      </AnchoredOverlay>
    </div>
  );
}

function ExportOption({
  label,
  onClick,
}: {
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className="block w-full border-[3px] border-transparent px-3 py-2 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text transition-colors hover:border-arctic-border hover:bg-[#F4D04C] hover:text-black"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
