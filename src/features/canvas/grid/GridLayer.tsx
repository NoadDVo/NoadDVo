import { memo, useMemo } from "react";

import { useViewportStore } from "../../../app/store/viewportStore";
import type { Viewport } from "../../../core/geometry/viewport";
import { createGridLines } from "./gridMath";

type GridLayerProps = {
  readonly viewport: Viewport;
};

export const GridLayer = memo(function GridLayer({ viewport }: GridLayerProps) {
  const adaptiveGrid = useViewportStore((state) => state.adaptiveGrid);
  const gridColor = useViewportStore((state) => state.gridColor);
  const gridSize = useViewportStore((state) => state.gridSize);
  const majorGrid = useViewportStore((state) => state.majorGrid);
  const minorGrid = useViewportStore((state) => state.minorGrid);
  const lines = useMemo(
    () => createGridLines(viewport, { adaptiveGrid, gridSize, majorGrid, minorGrid }),
    [adaptiveGrid, gridSize, majorGrid, minorGrid, viewport],
  );

  return (
    <g data-layer="grid" shapeRendering="crispEdges">
      {lines.map((line) => (
        <line
          key={line.id}
          stroke={line.major ? `${gridColor}33` : `${gridColor}14`}
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
