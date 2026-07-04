import { memo } from "react";

import { snapToGrid } from "../../../core/geometry/snap";
import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";
import type { Point2D } from "../../../core/geometry/types";

type PreviewLayerProps = {
  readonly gridSize: number;
  readonly pointerWorld: Point2D;
  readonly viewport: Viewport;
};

export const PreviewLayer = memo(function PreviewLayer({
  gridSize,
  pointerWorld,
  viewport,
}: PreviewLayerProps) {
  const snapped = snapToGrid(pointerWorld, gridSize);
  const screen = worldToScreen(snapped, viewport);

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
    </g>
  );
});
