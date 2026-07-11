import { polygonArea, type AreaObject } from "../../geometry";
import { getPolygonPoints } from "../../geometry/derivedGeometry";
import { formatNumber } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const AreaExporter: TikzObjectExporter<AreaObject> = {
  objectType: "area",
  exportObject: (object, context) => {
    const polygon = context.scene.objects[object.polygonId];
    if (!polygon || polygon.type !== "polygon") {
      return;
    }

    const points = getPolygonPoints(polygon, context.scene.objects);
    if (!points || points.length < 3) {
      return;
    }

    const area = Math.abs(polygonArea(points));
    const precision = object.precision ?? 2;
    const value = formatNumber(area, precision);

    // Calculate centroid
    const centroidWorld = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 },
    );
    centroidWorld.x /= points.length;
    centroidWorld.y /= points.length;

    const labelPrefix = polygon.name ? `S_{${polygon.name}} = ` : "S = ";

    context.scene.sections.measurements.push(
      `\\node[${object.labelPosition}] at (${formatNumber(centroidWorld.x, 2)}, ${formatNumber(
        centroidWorld.y,
        2,
      )}) {$${labelPrefix}${value}$};`
    );
  },
};
