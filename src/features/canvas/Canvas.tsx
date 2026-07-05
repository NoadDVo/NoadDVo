import { useEffect, useRef } from "react";
import { Maximize2 } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { toolManager } from "../../core/tools/ToolManager";
import { IconButton } from "../../ui/primitives";
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
  const isPanning = useViewportStore((state) => state.isPanning);
  const isSpacePressed = useViewportStore((state) => state.isSpacePressed);
  const resetViewport = useViewportStore((state) => state.resetViewport);
  const objects = useGeometryStore((state) => state.objects);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const activeTool = useGeometryStore((state) => state.activeTool);
  const activeToolCursor = toolManager.getTool(activeTool).cursor;
  const hoveredObject = hoveredObjectId ? objects[hoveredObjectId] ?? null : null;
  const gestures = useCanvasGestures(containerRef);

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
      className="relative min-h-0 overflow-hidden rounded-[28px] border border-white/60 bg-[#f2f7fa] shadow-[0_20px_60px_rgb(0_0_0/0.18)]"
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

      <div className="absolute right-4 top-4">
        <IconButton label="Reset View" onClick={resetViewport} size="sm">
          <Maximize2 size={16} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 rounded-[16px] border border-white/8 bg-[#101b24]/72 px-4 py-3 backdrop-blur-panel">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arctic-ice/80">
          SVG Canvas
        </p>
        <p className="mt-1 text-sm font-semibold text-arctic-text">
          Middle mouse or Space + Drag to pan
        </p>
      </div>

      <ContextMenuOverlay />
    </section>
  );
}

