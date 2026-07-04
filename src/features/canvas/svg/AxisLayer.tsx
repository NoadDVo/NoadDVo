import { memo } from "react";

import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";

type AxisLayerProps = {
  readonly viewport: Viewport;
};

export const AxisLayer = memo(function AxisLayer({ viewport }: AxisLayerProps) {
  const origin = worldToScreen({ x: 0, y: 0 }, viewport);

  return (
    <g data-layer="axes" shapeRendering="crispEdges">
      <line
        stroke="rgb(111 169 216 / 0.34)"
        strokeWidth={1.25}
        x1={0}
        x2={viewport.width}
        y1={origin.y}
        y2={origin.y}
      />
      <line
        stroke="rgb(111 169 216 / 0.34)"
        strokeWidth={1.25}
        x1={origin.x}
        x2={origin.x}
        y1={0}
        y2={viewport.height}
      />
      <circle
        cx={origin.x}
        cy={origin.y}
        fill="rgb(15 24 32)"
        r={4}
        stroke="rgb(168 216 255 / 0.62)"
        strokeWidth={1.5}
      />
    </g>
  );
});
