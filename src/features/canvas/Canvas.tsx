import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { useUiStore } from "../../app/store/uiStore";
import { useTranslation } from "../../lib/useTranslation";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { toolManager } from "../../core/tools/ToolManager";
import { Button } from "../../ui/primitives";
import { ContextMenuOverlay } from "../context-menu/ContextMenuOverlay";
import { GridLayer } from "./grid";
import { useCanvasGestures } from "./interactions/GestureLayer";
import { HoverInfoLayer } from "./overlays/HoverInfoLayer";
import { PreviewLayer } from "./overlays";
import { SelectionLayer } from "./overlays/SelectionLayer";
import { TextCreationOverlay } from "./overlays/TextCreationOverlay";
import { GeometryLayer } from "./renderers";
import { AxisLayer } from "./svg";
import { SVGPatternDefs } from "./svg/SVGPatternDefs";

export function Canvas() {
  const containerRef = useRef<HTMLElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewport = useViewportStore((state) => state.viewport);
  const pointerWorld = useViewportStore((state) => state.pointerWorld);
  const showGrid = useViewportStore((state) => state.showGrid);
  const showAxes = useViewportStore((state) => state.showAxes);
  const canvasBackground = useViewportStore((state) => state.canvasBackground);
  const isPanning = useViewportStore((state) => state.isPanning);
  const isSpacePressed = useViewportStore((state) => state.isSpacePressed);
  const objects = useGeometryStore((state) => state.objects);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const activeTool = useGeometryStore((state) => state.activeTool);
  const activeToolCursor = toolManager.getTool(activeTool).cursor;
  const hoveredObject = hoveredObjectId ? objects[hoveredObjectId] ?? null : null;
  const gestures = useCanvasGestures(svgRef);
  const objectCount = Object.keys(objects).length;
  const appTheme = useUiStore((state) => state.appTheme);

  useEffect(() => {
    const element = svgRef.current;

    if (!element) {
      return undefined;
    }

    const updateCanvasSize = () => {
      const rect = element.getBoundingClientRect();

      useViewportStore
        .getState()
        .setCanvasSize(rect.width, rect.height);
    };
    const observer = new ResizeObserver(updateCanvasSize);

    observer.observe(element);
    updateCanvasSize();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      className="relative min-h-0 overflow-hidden rounded-[28px] border border-arctic-border/20 bg-arctic-canvas shadow-[0_20px_60px_rgb(0_0_0/0.18)]"
      onContextMenu={(event) => event.preventDefault()}
      onPointerCancel={gestures.handlePointerUp}
      onPointerDown={gestures.handlePointerDown}
      onPointerLeave={gestures.handlePointerMove}
      onPointerMove={gestures.handlePointerMove}
      onPointerUp={gestures.handlePointerUp}
      onWheel={gestures.handleWheel}
      ref={containerRef}
      style={{
        cursor: isPanning ? "grabbing" : isSpacePressed ? "grab" : activeToolCursor,
        backgroundColor: appTheme === "theme2" ? "#F0F2F5" : canvasBackground,
      }}
    >
      <svg
        aria-label="Geometry canvas"
        className="absolute inset-0 size-full touch-none select-none"
        ref={svgRef}
        role="img"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        {showGrid && <GridLayer viewport={viewport} />}
        {showAxes && <AxisLayer viewport={viewport} />}
        <SVGPatternDefs objects={objects} />
        <GeometryLayer viewport={viewport} />
        <SelectionLayer />
        <PreviewLayer
          pointerWorld={pointerWorld}
          viewport={viewport}
        />
      </svg>

      <HoverInfoLayer
        hoveredObject={hoveredObject}
        objects={objects}
        pointerWorld={pointerWorld}
        viewport={viewport}
      />

      {objectCount === 0 && (
        <EmptyWorkspacePrompt
          startPointTool={() => toolManager.activateTool("point")}
        />
      )}

      <ContextMenuOverlay />
      <TextCreationOverlay viewport={viewport} />
    </section>
  );
}

function EmptyWorkspacePrompt({
  startPointTool,
}: {
  readonly startPointTool: () => void;
}) {
  const appTheme = useUiStore((state) => state.appTheme);
  const setObjects = useGeometryStore((state) => state.setObjects);
  
  const [isHidden, setIsHidden] = useState(false);
  const [mode, setMode] = useState<"default" | "examples">("default");
  const { t } = useTranslation();

  if (isHidden) return null;

  const handleCreate = () => {
    setIsHidden(true);
    startPointTool();
  };

  let content;
  if (mode === "default") {
    content = (
      <>
        <p className={clsx(
          "text-[10px] font-black uppercase tracking-[0.18em] mb-2",
          appTheme === "theme1" ? "text-arctic-text bg-arctic-primary-hover inline-block px-2 py-0.5 border-[3px] border-arctic-border" : "",
          appTheme === "theme2" ? "text-zinc-500" : ""
        )}>
          {t("landing.title")}
        </p>
        <p className={clsx(
          "mt-1",
          appTheme === "theme1" ? "text-base font-black uppercase tracking-[0.05em]" : "text-sm font-bold"
        )}>{t("landing.subtitle")}</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button onClick={handleCreate} size="sm" variant="primary">
            {t("landing.createPoint")}
          </Button>
          <Button onClick={() => setMode("examples")} size="sm" variant="secondary">
            {t("landing.loadExample")}
          </Button>
        </div>
      </>
    );
  } else {
    // Examples mode
    const examplesGlob = import.meta.glob('/EXAMPLE/*.json', { eager: true });
    const examplesList = Object.entries(examplesGlob).map(([path, mod]: [string, any]) => {
      const filename = path.split('/').pop()?.replace('.json', '') || 'Unknown';
      return { name: filename, data: mod.default || mod };
    });

    content = (
      <>
        <p className={clsx(
          "text-[10px] font-black uppercase tracking-[0.18em] mb-2",
          appTheme === "theme1" ? "text-arctic-text bg-arctic-primary-hover inline-block px-2 py-0.5 border-[3px] border-arctic-border" : "",
          appTheme === "theme2" ? "text-zinc-500" : ""
        )}>
          {t("landing.selectExample")}
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2 max-h-48 overflow-y-auto w-full px-2">
          {examplesList.length === 0 ? (
            <p className="text-sm text-gray-500 my-2">{t("landing.noExamples")}</p>
          ) : (
            examplesList.map(ex => (
              <Button 
                key={ex.name} 
                className="w-full text-center" 
                size="sm" 
                variant="secondary"
                onClick={() => {
                  if (ex.data && ex.data.objects) {
                    setObjects(ex.data.objects, `Load Example: ${ex.name}`);
                  } else {
                    setObjects(ex.data, `Load Example: ${ex.name}`);
                  }
                  setIsHidden(true);
                }}
              >
                {ex.name}
              </Button>
            ))
          )}
        </div>
        <div className="mt-3">
          <Button onClick={() => setMode("default")} size="sm" variant="primary">
            {t("landing.back")}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6">
      <div
        className={clsx(
          "pointer-events-auto px-4 py-3 text-center min-w-[280px]",
          appTheme === "theme1" ? "rounded-none border-[3px] border-arctic-border bg-arctic-surface text-arctic-text shadow-brutal-lg" : "",
          appTheme === "theme2" ? "rounded-xl border border-zinc-800/60 bg-[#18191E]/90 backdrop-blur text-zinc-200 shadow-2xl" : ""
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
