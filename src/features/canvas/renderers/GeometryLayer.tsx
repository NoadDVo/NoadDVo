import { Fragment, memo } from "react";

import { useGeometryStore } from "../../../app/store/geometryStore";
import { geometryRendererRegistry } from "../../../core/renderer/RendererRegistry";
import type { Viewport } from "../../../core/geometry/viewport";

type GeometryLayerProps = {
  readonly viewport: Viewport;
};

const RENDER_ORDER = {
  polygon: 10,
  circle: 20,
  line: 30,
  ray: 40,
  segment: 50,
  vector: 60,
  point: 70,
  angle: 80,
} as const;

export const GeometryLayer = memo(function GeometryLayer({
  viewport,
}: GeometryLayerProps) {
  const objects = useGeometryStore((state) => state.objects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const orderedObjects = Object.values(objects).sort(
    (a, b) => RENDER_ORDER[a.type] - RENDER_ORDER[b.type],
  );

  return (
    <g data-layer="geometry">
      <defs>
        <marker
          id="ndv-vector-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
          viewBox="0 0 8 8"
        >
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#dff6ff" />
        </marker>
        <marker
          id="ndv-vector-selection-arrow"
          markerHeight="10"
          markerWidth="10"
          orient="auto"
          refX="9"
          refY="5"
          viewBox="0 0 10 10"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7ddcff" fillOpacity={0.55} />
        </marker>
      </defs>
      {orderedObjects.map((object) => (
        <Fragment key={object.id}>
          {geometryRendererRegistry.renderObject(object, {
            objects,
            hoveredObjectId,
            selectedObjectIds,
            viewport,
          })}
        </Fragment>
      ))}
    </g>
  );
});
