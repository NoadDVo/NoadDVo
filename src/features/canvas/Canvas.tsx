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
import {
  distance,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type SegmentObject,
} from "../../core/geometry";
import { contextMenuManager } from "../../core/context";
import { screenToWorld, worldToScreen } from "../../core/geometry/viewport";
import { keyboardEventRouter } from "../../core/keyboard";
import { hitTest } from "../../core/selection/HitTest";
import { toolManager } from "../../core/tools/ToolManager";
import {
  createToolContext,
  createToolPointerEvent,
  type ToolPointerEvent,
} from "../../core/tools/ToolContext";
import { IconButton } from "../../ui/primitives";
import { ContextMenuOverlay } from "../context-menu/ContextMenuOverlay";
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

function formatHoverNumber(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function getPoint(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

function getCircleRadius(
  object: CircleObject,
  objects: GeometryObjectRecord,
): number | null {
  if (object.circleKind === "center-radius") {
    return object.radius;
  }

  if (object.circleKind === "center-point") {
    const center = getPoint(objects, object.centerPointId);
    const radiusPoint = getPoint(objects, object.radiusPointId);

    return center && radiusPoint ? distance(center, radiusPoint) : null;
  }

  return null;
}

function getSegmentLength(
  object: SegmentObject,
  objects: GeometryObjectRecord,
): number | null {
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  return start && end ? distance(start, end) : null;
}

function getHoverInfo(
  object: GeometryObject | null,
  objects: GeometryObjectRecord,
): { readonly title: string; readonly detail: string } | null {
  if (!object) {
    return null;
  }

  if (object.type === "point") {
    return {
      detail: `(${formatHoverNumber(object.x)}, ${formatHoverNumber(object.y)})`,
      title: object.name ?? "Point",
    };
  }

  if (object.type === "segment") {
    const length = getSegmentLength(object, objects);

    return {
      detail: length === null ? "Length unavailable" : `Length ${formatHoverNumber(length)}`,
      title: object.name ?? "Segment",
    };
  }

  if (object.type === "circle") {
    const radius = getCircleRadius(object, objects);

    return {
      detail: radius === null ? "Radius unavailable" : `Radius ${formatHoverNumber(radius)}`,
      title: object.name ?? "Circle",
    };
  }

  return {
    detail: object.type,
    title: object.name ?? object.id,
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
  const objects = useGeometryStore((state) => state.objects);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const activeTool = useGeometryStore((state) => state.activeTool);
  const activeToolCursor = toolManager.getTool(activeTool).cursor;
  const hoveredObject = hoveredObjectId ? objects[hoveredObjectId] ?? null : null;
  const hoverInfo = getHoverInfo(hoveredObject, objects);
  const hoverScreen = worldToScreen(pointerWorld, viewport);

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
    keyboardEventRouter.attach(window);

    return () => {
      keyboardEventRouter.detach();
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

      if (event.button === 2) {
        event.preventDefault();

        const screenPoint = getLocalPoint(event, element);
        const viewportState = useViewportStore.getState();
        const geometryState = useGeometryStore.getState();
        const worldPoint = screenToWorld(screenPoint, viewportState.viewport);
        const hit = hitTest(
          screenPoint,
          worldPoint,
          geometryState.objects,
          viewportState.viewport,
        );

        contextMenuManager.open({
          bounds: {
            height: element.clientHeight,
            width: element.clientWidth,
          },
          target: hit
            ? {
                kind: "object",
                objectId: hit.objectId,
                objectType: hit.object.type,
                screenPoint,
                worldPoint,
              }
            : {
                kind: "canvas",
                screenPoint,
                worldPoint,
              },
        });

        return;
      }

      if (!isMiddleMouse && !isSpaceDrag) {
        contextMenuManager.close();
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
      className="relative min-h-0 overflow-hidden rounded-[28px] border border-white/60 bg-[#f2f7fa] shadow-[0_20px_60px_rgb(0_0_0/0.18)]"
      onContextMenu={(event) => event.preventDefault()}
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

      {hoverInfo && (
        <div
          className="pointer-events-none absolute z-10 rounded-[12px] border border-slate-900/10 bg-white/[0.82] px-3 py-2 text-slate-950 shadow-[0_16px_38px_rgb(15_23_42/0.16)] backdrop-blur-panel"
          style={{
            left: Math.max(
              12,
              Math.min(hoverScreen.x + 16, Math.max(12, viewport.width - 180)),
            ),
            top: Math.max(
              12,
              Math.min(hoverScreen.y + 16, Math.max(12, viewport.height - 72)),
            ),
          }}
        >
          <p className="text-[11px] font-black uppercase tracking-[0.12em]">
            {hoverInfo.title}
          </p>
          <p className="mt-1 font-mono text-[12px] font-semibold text-slate-700">
            {hoverInfo.detail}
          </p>
        </div>
      )}

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
