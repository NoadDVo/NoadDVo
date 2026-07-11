import { useRef, useState } from "react";
import { Download } from "lucide-react";

import { useAppStore } from "../../../app/store/appStore";
import { useGeometryStore } from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { exportManager } from "../../../core/export";
import { Button } from "../../../ui/primitives";
import { AnchoredOverlay } from "../../../ui/overlay/OverlayPortal";

export function ExportMenu() {
  const appName = useAppStore((state) => state.appName);
  const [exportOpen, setExportOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

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

  return (
    <div>
      <Button
        icon={<Download size={16} strokeWidth={2} />}
        onClick={() => setExportOpen((open) => !open)}
        ref={buttonRef}
        size="sm"
        className="border-[3px] border-black bg-transparent text-black shadow-brutal-sm hover:bg-[#F17A3C] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgb(var(--color-shadow)/1)]"
      >
        Export
      </Button>
      <AnchoredOverlay anchorRef={buttonRef} open={exportOpen} width={176}>
        <div className="overflow-hidden border-[3px] border-arctic-border bg-arctic-surface p-1.5 shadow-brutal">
          <ExportOption
            label="TikZ"
            onClick={() =>
              runExport(() =>
                exportManager.exportTikz(useGeometryStore.getState().objects),
              )
            }
          />
          <ExportOption
            label="TeX"
            onClick={() =>
              runExport(() =>
                exportManager.exportTex(useGeometryStore.getState().objects),
              )
            }
          />
          <ExportOption
            label="SVG"
            onClick={() =>
              runExport(() => {
                const svg = document.querySelector<SVGSVGElement>(
                  'svg[aria-label="Geometry canvas"]',
                );

                if (!svg) {
                  throw new Error("Missing canvas SVG.");
                }

                exportManager.exportSvg(svg);
              })
            }
          />
          <ExportOption
            label="JSON"
            onClick={() =>
              runExport(() => exportManager.exportJson(createProjectSnapshot()))
            }
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
