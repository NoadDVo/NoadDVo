import { useEffect, useRef } from "react";
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { fitViewportToObjects } from "../../core/context/actions/CanvasActions";
import { toolManager } from "../../core/tools/ToolManager";
import { Button, IconButton } from "../../ui/primitives";
import { ContextMenuOverlay } from "../context-menu/ContextMenuOverlay";
import { GridLayer } from "./grid";
import { useCanvasGestures } from "./interactions/GestureLayer";
import { HoverInfoLayer } from "./overlays/HoverInfoLayer";
import { PreviewLayer } from "./overlays";
import { SelectionLayer } from "./overlays/SelectionLayer";
import { GeometryLayer } from "./renderers";
import { AxisLayer } from "./svg";

export function Canvas() {
  const containerRef = useRef<HTMLElement | null>(null);
  const viewport = useViewportStore((state) => state.viewport);
  const pointerWorld = useViewportStore((state) => state.pointerWorld);
  const gridSize = useViewportStore((state) => state.gridSize);
  const showGrid = useViewportStore((state) => state.showGrid);
  const showAxes = useViewportStore((state) => state.showAxes);
  const canvasBackground = useViewportStore((state) => state.canvasBackground);
  const isPanning = useViewportStore((state) => state.isPanning);
  const isSpacePressed = useViewportStore((state) => state.isSpacePressed);
  const resetViewport = useViewportStore((state) => state.resetViewport);
  const zoomAt = useViewportStore((state) => state.zoomAt);
  const objects = useGeometryStore((state) => state.objects);
  const loadExample = useGeometryStore((state) => state.loadExample);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const activeTool = useGeometryStore((state) => state.activeTool);
  const activeToolCursor = toolManager.getTool(activeTool).cursor;
  const hoveredObject = hoveredObjectId ? objects[hoveredObjectId] ?? null : null;
  const gestures = useCanvasGestures(containerRef);
  const objectCount = Object.keys(objects).length;

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      useViewportStore
        .getState()
        .setCanvasSize(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(element);

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
        backgroundColor: canvasBackground,
      }}
    >
      <svg
        aria-label="Geometry canvas"
        className="absolute inset-0 size-full touch-none select-none"
        role="img"
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      >
        {showGrid && <GridLayer viewport={viewport} />}
        {showAxes && <AxisLayer viewport={viewport} />}
        <GeometryLayer viewport={viewport} />
        <SelectionLayer />
        <PreviewLayer
          gridSize={gridSize}
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
          loadExample={() => loadExample("triangle")}
          startPointTool={() => toolManager.activateTool("point")}
        />
      )}

      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-[14px] border border-arctic-border/10 bg-arctic-surface/80 p-1 shadow-[0_14px_34px_rgb(15_23_42/0.14)] backdrop-blur-panel">
        <IconButton
          className="border-arctic-border/10 bg-arctic-surface/70 text-arctic-muted hover:bg-arctic-surface hover:text-arctic-text"
          label="Zoom In"
          onClick={() => zoomAt({ x: viewport.width / 2, y: viewport.height / 2 }, 1.18)}
          size="sm"
        >
          <ZoomIn size={16} strokeWidth={2} />
        </IconButton>
        <IconButton
          className="border-arctic-border/10 bg-arctic-surface/70 text-arctic-muted hover:bg-arctic-surface hover:text-arctic-text"
          label="Zoom Out"
          onClick={() => zoomAt({ x: viewport.width / 2, y: viewport.height / 2 }, 1 / 1.18)}
          size="sm"
        >
          <ZoomOut size={16} strokeWidth={2} />
        </IconButton>
        <IconButton
          className="border-arctic-border/10 bg-arctic-surface/70 text-arctic-muted hover:bg-arctic-surface hover:text-arctic-text"
          label="Reset View"
          onClick={resetViewport}
          size="sm"
        >
          <RotateCcw size={16} strokeWidth={2} />
        </IconButton>
        <IconButton
          className="border-arctic-border/10 bg-arctic-surface/70 text-arctic-muted hover:bg-arctic-surface hover:text-arctic-text"
          label="Fit View"
          onClick={() => fitViewportToObjects(objects)}
          size="sm"
        >
          <Maximize2 size={16} strokeWidth={2} />
        </IconButton>
      </div>

      <ContextMenuOverlay />
    </section>
  );
}

function EmptyWorkspacePrompt({
  loadExample,
  startPointTool,
}: {
  readonly loadExample: () => void;
  readonly startPointTool: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6">
      <div className="pointer-events-auto rounded-[18px] border border-arctic-border/10 bg-arctic-surface/82 px-4 py-3 text-center text-arctic-text shadow-[0_18px_48px_rgb(15_23_42/0.14)] backdrop-blur-panel">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-arctic-muted">
          Empty Workspace
        </p>
        <p className="mt-1 text-sm font-bold">Create your first object</p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            className="border-arctic-border/10 bg-arctic-ice text-arctic-background hover:bg-arctic-ice/85"
            onClick={startPointTool}
            size="sm"
            variant="secondary"
          >
            Create a point
          </Button>
          <Button
            className="border-arctic-border/10 bg-arctic-surface text-arctic-text hover:bg-arctic-surface/85"
            onClick={loadExample}
            size="sm"
            variant="secondary"
          >
            Load an example
          </Button>
        </div>
      </div>
    </div>
  );
}
