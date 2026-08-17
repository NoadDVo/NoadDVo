import { useCallback, useEffect, type PointerEvent, type RefObject, type WheelEvent } from "react";

import { useGeometryStore } from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { contextMenuManager } from "../../../core/context";
import { screenToWorld } from "../../../core/geometry/viewport";
import { keyboardEventRouter } from "../../../core/keyboard";
import { hitTest } from "../../../core/selection/HitTest";
import { toolManager } from "../../../core/tools/ToolManager";
import { getLocalPoint, getToolPointerEvent } from "./PointerLayer";

export function useCanvasGestures(interactionSurfaceRef: RefObject<SVGSVGElement | null>) {
  useEffect(() => {
    keyboardEventRouter.attach(window);

    return () => {
      keyboardEventRouter.detach();
    };
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = interactionSurfaceRef.current;

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
  }, [interactionSurfaceRef]);


/** Drawing tools where right-click should pan instead of opening context menu */
const DRAWING_TOOL_IDS = new Set([
  "polygon",
  "point",
  "segment",
  "line",
  "ray",
  "vector",
  "circle",
  "angle",
  "three-point-circle",
  "three-point-arc",
  "semicircle",
  "circular-sector",
  "compass",
  "ellipse",
  "hyperbola",
  "polynomial",
  "locus",
  "regular-polygon",
  "midpoint",
  "intersection",
  "parallel",
  "perpendicular",
  "perpendicular-bisector",
  "angle-bisector",
  "median",
  "altitude",
  "circumcircle",
  "incircle",
  "elliptical-arc",
  "angle-given-size",
  "point-by-distance",
]);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const element = interactionSurfaceRef.current;

      if (!element) {
        return;
      }

      const isMiddleMouse = event.button === 1;
      const activeTool = toolManager.getActiveTool();
      const isPanTool = activeTool.id === "pan";
      const isSpaceDrag = (useViewportStore.getState().isSpacePressed || isPanTool) && event.button === 0;
      const isDrawingTool = DRAWING_TOOL_IDS.has(activeTool.id);

      if (event.button === 2) {
        event.preventDefault();
        // Right-click pans when a drawing tool is active (instead of context menu)
        if (isDrawingTool) {
          element.setPointerCapture(event.pointerId);
          useViewportStore.getState().startPan(getLocalPoint(event, element));
        } else {
          openContextMenu(event, element);
        }
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
    [interactionSurfaceRef],
  );


  const handlePointerUp = useCallback((event: PointerEvent<HTMLElement>) => {
    const element = interactionSurfaceRef.current;

    if (element?.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    const store = useViewportStore.getState();
    const wasPanning = store.isPanning;

    store.endPan();

    if (element && !wasPanning) {
      toolManager.pointerUp(getToolPointerEvent(event, element));
    }
  }, [interactionSurfaceRef]);

  const handleWheel = useCallback((event: WheelEvent<HTMLElement>) => {
    const element = interactionSurfaceRef.current;

    if (!element) {
      return;
    }

    event.preventDefault();

    const zoomFactor = event.deltaY < 0 ? 1.08 : 1 / 1.08;
    useViewportStore
      .getState()
      .zoomAt(getLocalPoint(event, element), zoomFactor);
  }, [interactionSurfaceRef]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
  };
}

function openContextMenu(event: PointerEvent<HTMLElement>, element: Element): void {
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
      height: window.innerHeight,
      width: window.innerWidth,
    },
    position: { x: event.clientX, y: event.clientY },
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
}
