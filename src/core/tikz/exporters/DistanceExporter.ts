import { distance, type DistanceObject } from "../../geometry";
import { formatNumber, getTikzPointReference } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const DistanceExporter: TikzObjectExporter<DistanceObject> = {
  objectType: "distance",
  exportObject: (object, context) => {
    let point1;
    let point2;
    let labelPrefix = "";

    if (object.distanceKind === "segment" && object.segmentId) {
      const segment = context.scene.objects[object.segmentId];
      if (segment && segment.type === "segment") {
        point1 = context.scene.objects[segment.startPointId];
        point2 = context.scene.objects[segment.endPointId];
        labelPrefix = segment.name ? `${segment.name} = ` : "";
      }
    } else if (object.distanceKind === "two-points" && object.pointAId && object.pointBId) {
      point1 = context.scene.objects[object.pointAId];
      point2 = context.scene.objects[object.pointBId];
      const nameA = point1?.name ?? "A";
      const nameB = point2?.name ?? "B";
      labelPrefix = `${nameA}${nameB} = `;
    }

    if (!point1 || point1.type !== "point" || !point2 || point2.type !== "point") {
      return;
    }

    const dist = distance(point1, point2);
    const precision = object.precision ?? 2;
    const value = formatNumber(dist, precision);

    const pt1Id = getTikzPointReference(point1.id, context);
    const pt2Id = getTikzPointReference(point2.id, context);

    // Calculate mid point for absolute positioning if needed, or use midway
    const options = [`${object.labelPosition}`];
    
    // Using midway node
    context.scene.sections.measurements.push(
      `\\path (${pt1Id}) -- (${pt2Id}) node[midway, ${options.join(", ")}] {${labelPrefix}${value}};`
    );
  },
};
