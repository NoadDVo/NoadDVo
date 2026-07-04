import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { Maximize2 } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { toolManager } from "../../core/tools/ToolManager";
import {
  createToolContext,
  createToolPointerEvent,
  type ToolPointerEvent,
} from "../../core/tools/ToolContext";
import { IconButton } from "../../ui/primitives";
import { GridLayer } from "./grid";
import { PreviewLayer } from "./overlays";
import { GeometryLayer } from "./renderers";
import { AxisLayer } from "./svg";

function getLocalPoint(
  event: PointerEvent<HTMLElement> | WheelEvent<HTMLElement>,
  element: HTMLElement,
) {
  const rect = element.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function getToolPointerEvent(
  event: PointerEvent<HTMLElement>,
  element: HTMLElement,
): ToolPointerEvent {
  return createToolPointerEvent(
    {
      altKey: event.altKey,
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pointerId: event.pointerId,
      screenPoint: getLocalPoint(event, element),
      shiftKey: event.shiftKey,
    },
    createToolContext(),
  );
}

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
  const activeTool = useGeometryStore((state) => state.activeTool);
  const activeToolCursor = toolManager.getTool(activeTool).cursor;

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        useViewportStore.getState().setSpacePressed(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        useViewportStore.getState().setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", toolManager.cancel);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", toolManager.cancel);
    };
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        toolManager.cancel();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const point = getLocalPoint(event, element);
    const store = useViewportStore.getState();

    store.setPointerScreen(point);
    store.panTo(point);

    if (!store.isPanning) {
      toolManager.pointerMove(getToolPointerEvent(event, element));
    }
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const element = containerRef.current;

      if (!element) {
        return;
      }

      const isMiddleMouse = event.button === 1;
      const isSpaceDrag = useViewportStore.getState().isSpacePressed && event.button === 0;

      if (!isMiddleMouse && !isSpaceDrag) {
        element.setPointerCapture(event.pointerId);
        toolManager.pointerDown(getToolPointerEvent(event, element));

        return;
      }

      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      useViewportStore.getState().startPan(getLocalPoint(event, element));
    },
    [],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = containerRef.current;

    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    const store = useViewportStore.getState();
    const wasPanning = store.isPanning;

    store.endPan();

    if (element && !wasPanning) {
      toolManager.pointerUp(getToolPointerEvent(event, element));
    }
  }, []);

  const handleWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    event.preventDefault();

    const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    useViewportStore
      .getState()
      .zoomAt(getLocalPoint(event, element), zoomFactor);
  }, []);

  return (
    <section
      className="relative min-h-0 overflow-hidden rounded-[28px] border border-white/8 bg-arctic-canvas shadow-[0_20px_60px_rgb(0_0_0/0.26)]"
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerMove}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
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
        <PreviewLayer
          gridSize={gridSize}
          pointerWorld={pointerWorld}
          viewport={viewport}
        />
      </svg>

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
    </section>
  );
}
