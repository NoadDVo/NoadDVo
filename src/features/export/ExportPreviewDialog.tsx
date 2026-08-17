import { useEffect, useRef, useState } from "react";
import { Download, X, Copy } from "lucide-react";
import { useUiStore } from "../../app/store/uiStore";
import { useTranslation } from "../../lib/useTranslation";
import { IconButton, Button } from "../../ui/primitives";
import { exportManager } from "../../core/export";
import { projectManager } from "../../core/project";

export function ExportPreviewDialog() {
  const open = useUiStore((state) => state.openDialog === "exportPreview");
  const close = useUiStore((state) => state.setOpenDialog);
  const exportFormat = useUiStore((state) => state.exportFormat);
  const { t } = useTranslation();

  const [svgBody, setSvgBody] = useState("");
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const [draggingHandle, setDraggingHandle] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!open) {
      setSvgBody("");
      return;
    }
    
    const svgElement = document.getElementById("geometry-canvas") as SVGSVGElement | null;
    if (svgElement) {
      const clone = svgElement.cloneNode(true) as SVGSVGElement;
      
      const w = svgElement.viewBox.baseVal.width || svgElement.clientWidth || 800;
      const h = svgElement.viewBox.baseVal.height || svgElement.clientHeight || 600;
      setNaturalWidth(w);
      setNaturalHeight(h);

      // Remove unwanted layers
      const selectorsToRemove = ['[data-layer="preview"]', '[data-layer="grid"]', '[data-layer="axes"]'];
      selectorsToRemove.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((node) => node.remove());
      });

      // Auto crop to geometry
      const geomLayer = clone.querySelector('[data-layer="geometry"]') as SVGGElement | null;
      if (geomLayer) {
        try {
          // getBBox works if the element is in DOM. Since clone is not in DOM, getBBox might fail.
          // We must query the original svgElement instead.
          const origGeomLayer = svgElement.querySelector('[data-layer="geometry"]') as SVGGElement | null;
          if (origGeomLayer) {
            const bbox = origGeomLayer.getBBox();
            const pad = 20;
            // Ensure we don't end up with negative width/height if empty
            if (bbox.width > 0 && bbox.height > 0) {
              setCrop({
                x: bbox.x - pad,
                y: bbox.y - pad,
                w: bbox.width + pad * 2,
                h: bbox.height + pad * 2,
              });
            } else {
              setCrop({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 });
            }
          }
        } catch (e) {
          setCrop({ x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 });
        }
      }

      setSvgBody(clone.innerHTML);
    }
  }, [open]);

  if (!open) return null;

  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingHandle(handle);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingHandle || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());

    setCrop((prev) => {
      let { x, y, w, h } = prev;
      
      if (draggingHandle.includes("w")) {
        const right = x + w;
        x = Math.min(svgP.x, right - 10);
        w = right - x;
      }
      if (draggingHandle.includes("e")) {
        w = Math.max(10, svgP.x - x);
      }
      if (draggingHandle.includes("n")) {
        const bottom = y + h;
        y = Math.min(svgP.y, bottom - 10);
        h = bottom - y;
      }
      if (draggingHandle.includes("s")) {
        h = Math.max(10, svgP.y - y);
      }
      if (draggingHandle === "center") {
        x = svgP.x - w / 2;
        y = svgP.y - h / 2;
      }

      return { x, y, w, h };
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDraggingHandle(null);
    if (e.target instanceof Element && e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const handleCopy = async () => {
    const svgElement = document.getElementById("geometry-canvas") as SVGSVGElement | null;
    if (!svgElement) return;

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(crop.w));
    clone.setAttribute("height", String(crop.h));
    clone.setAttribute("viewBox", `${crop.x} ${crop.y} ${crop.w} ${crop.h}`);

    const success = await exportManager.copyPng(clone);
    if (success) {
      close(null);
    }
  };

  const handleDownload = () => {
    const svgElement = document.getElementById("geometry-canvas") as SVGSVGElement | null;
    if (!svgElement) return;

    const projectName = projectManager.getSnapshot().currentProject.name || "Untitled";
    const filename = `${projectName}.${exportFormat}`;

    const clone = svgElement.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(crop.w));
    clone.setAttribute("height", String(crop.h));
    clone.setAttribute("viewBox", `${crop.x} ${crop.y} ${crop.w} ${crop.h}`);

    if (exportFormat === "png") {
      exportManager.exportPng(clone, filename);
    } else {
      exportManager.exportSvg(clone, filename);
    }
    
    close(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-[900px] max-w-full flex-col overflow-hidden rounded-[22px] border border-arctic-border/10 bg-arctic-background/96 shadow-[0_24px_80px_rgb(0_0_0/0.42)]">
        <header className="flex items-center justify-between border-b border-arctic-border/8 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arctic-muted">
              {t("export.preview" as any) || "Preview"}
            </p>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-arctic-text">
              {exportFormat.toUpperCase()} {t("export.title")}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {exportFormat === "png" && (
              <Button
                icon={<Copy size={16} strokeWidth={2} />}
                onClick={handleCopy}
                size="sm"
                variant="outline"
              >
                Copy
              </Button>
            )}
            <Button
              icon={<Download size={16} strokeWidth={2} />}
              onClick={handleDownload}
              size="sm"
            >
              Download {exportFormat.toUpperCase()}
            </Button>
            <IconButton label={t("btn.close")} onClick={() => close(null)} size="sm">
              <X size={16} />
            </IconButton>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden bg-arctic-surface p-6">
          <div className="w-full h-full border border-arctic-border/20 shadow-sm bg-[#ffffff] relative flex items-center justify-center overflow-hidden touch-none select-none">
            <svg
              ref={svgRef}
              className="w-full h-full max-w-full max-h-full"
              viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Render the cloned geometry */}
              <g dangerouslySetInnerHTML={{ __html: svgBody }} />
              
              {/* Dark overlay outside crop box */}
              <path 
                d={`M 0 0 h ${naturalWidth} v ${naturalHeight} h -${naturalWidth} Z M ${crop.x} ${crop.y} v ${crop.h} h ${crop.w} v -${crop.h} Z`} 
                fill="rgba(0,0,0,0.4)" 
                fillRule="evenodd" 
              />
              
              {/* Crop box border */}
              <rect 
                x={crop.x} 
                y={crop.y} 
                width={crop.w} 
                height={crop.h} 
                fill="transparent" 
                stroke="#3B82F6" 
                strokeWidth={2 * (naturalWidth / 800)} 
                strokeDasharray="4 4"
                onPointerDown={(e) => handlePointerDown(e, "center")}
                style={{ cursor: "move" }}
              />
              
              {/* Handles */}
              {[
                { id: "nw", cx: crop.x, cy: crop.y, cursor: "nwse-resize" },
                { id: "ne", cx: crop.x + crop.w, cy: crop.y, cursor: "nesw-resize" },
                { id: "sw", cx: crop.x, cy: crop.y + crop.h, cursor: "nesw-resize" },
                { id: "se", cx: crop.x + crop.w, cy: crop.y + crop.h, cursor: "nwse-resize" },
                { id: "n", cx: crop.x + crop.w / 2, cy: crop.y, cursor: "ns-resize" },
                { id: "s", cx: crop.x + crop.w / 2, cy: crop.y + crop.h, cursor: "ns-resize" },
                { id: "w", cx: crop.x, cy: crop.y + crop.h / 2, cursor: "ew-resize" },
                { id: "e", cx: crop.x + crop.w, cy: crop.y + crop.h / 2, cursor: "ew-resize" },
              ].map((h) => (
                <circle
                  key={h.id}
                  cx={h.cx}
                  cy={h.cy}
                  r={6 * (naturalWidth / 800)}
                  fill="#ffffff"
                  stroke="#3B82F6"
                  strokeWidth={2 * (naturalWidth / 800)}
                  onPointerDown={(e) => handlePointerDown(e, h.id)}
                  style={{ cursor: h.cursor }}
                />
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
