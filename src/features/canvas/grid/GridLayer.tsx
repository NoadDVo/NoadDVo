import { memo, useMemo } from "react";

import type { Viewport } from "../../../core/geometry/viewport";
import { createGridLines } from "./gridMath";

type GridLayerProps = {
  readonly viewport: Viewport;
};

export const GridLayer = memo(function GridLayer({ viewport }: GridLayerProps) {
  const lines = useMemo(() => createGridLines(viewport), [viewport]);

  return (
    <g data-layer="grid" shapeRendering="crispEdges">
      {lines.map((line) => (
        <line
          key={line.id}
          stroke={line.major ? "rgb(15 23 42 / 0.16)" : "rgb(15 23 42 / 0.045)"}
          strokeWidth={line.major ? 1 : 0.75}
          x1={line.x1}
          x2={line.x2}
          y1={line.y1}
          y2={line.y2}
        />
      ))}
    </g>
  );
});
