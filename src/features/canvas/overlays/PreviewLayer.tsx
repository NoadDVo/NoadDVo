import { memo, useEffect, useState } from "react";

import { toolManager } from "../../../core/tools/ToolManager";
import { createToolContext } from "../../../core/tools/ToolContext";
import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";
import type { Point2D } from "../../../core/geometry/types";
import { useGeometryStore } from "../../../app/store/geometryStore";

import { getClosestPointOnObject } from "../../../core/selection/closestPoint";

type PreviewLayerProps = {
  readonly gridSize: number;
  readonly pointerWorld: Point2D;
  readonly viewport: Viewport;
};

export const PreviewLayer = memo(function PreviewLayer({
  pointerWorld,
  viewport,
}: Omit<PreviewLayerProps, "gridSize">) {
  const context = createToolContext();
  const snapped = context.snapPoint(pointerWorld);
  const screen = worldToScreen(snapped, viewport);
  const toolPreview = toolManager.renderPreview(context);

  const activeSnappedPointId = useGeometryStore((state) => state.activeSnappedPointId);
  const activeSnappedPoint = activeSnappedPointId ? useGeometryStore.getState().objects[activeSnappedPointId] : null;
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (!activeSnappedPointId) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Only flash on main button click
      if (e.button !== 0) return;
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 300);
      return () => clearTimeout(timer);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [activeSnappedPointId]);

  let activeSnappedScreen = null;
  if (activeSnappedPoint && activeSnappedPoint.type === "point") {
    activeSnappedScreen = worldToScreen(activeSnappedPoint, viewport);
  }

  let hoveredPointScreen = null;
  const activeToolId = toolManager.getActiveTool().id;
  if (
    hoveredObjectId &&
    !activeSnappedPointId &&
    activeToolId !== "move" &&
    activeToolId !== "select"
  ) {
    const hoveredObject = useGeometryStore.getState().objects[hoveredObjectId];
    if (
      hoveredObject &&
      hoveredObject.type !== "point" &&
      hoveredObject.type !== "image" &&
      hoveredObject.type !== "slider" &&
      hoveredObject.type !== "region" &&
      hoveredObject.type !== "text"
    ) {
      const closest = getClosestPointOnObject(
        hoveredObject,
        pointerWorld,
        useGeometryStore.getState().objects
      );
      if (closest) {
        const screenPos = worldToScreen(closest, viewport);
        // Only show if it's within tolerance (10px)
        const dist = Math.hypot(screenPos.x - screen.x, screenPos.y - screen.y);
        if (dist <= 10) {
          hoveredPointScreen = screenPos;
        }
      }
    }
  }

  return (
    <g data-layer="preview">
      <circle
        cx={screen.x}
        cy={screen.y}
        fill="rgb(168 216 255 / 0.16)"
        r={8}
        stroke="rgb(168 216 255 / 0.68)"
        strokeDasharray="3 3"
        strokeWidth={1.5}
      />
      {activeSnappedScreen && (
        <circle
          cx={activeSnappedScreen.x}
          cy={activeSnappedScreen.y}
          fill="#EF4444"
          r={isFlashing ? 6 : 4}
          style={{
            transition: "r 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease",
            opacity: isFlashing ? 0.8 : 1,
            pointerEvents: "none",
          }}
        />
      )}
      {hoveredPointScreen && (
        <circle
          cx={hoveredPointScreen.x}
          cy={hoveredPointScreen.y}
          fill="#10B981"
          r={3.5}
          stroke="#000000"
          strokeWidth={1}
          style={{ pointerEvents: "none" }}
        />
      )}
      {toolPreview}
    </g>
  );
});
