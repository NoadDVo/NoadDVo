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
  angle: 65,
  point: 70,
  text: 80,
  measurement: 90,
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
