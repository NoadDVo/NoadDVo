import type { LineObject, PointObject } from "../../geometry";
import { clipLineToBounds, type WorldBounds } from "../../geometry/viewport";
import {
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

const exportBounds: WorldBounds = {
  maxX: 10,
  maxY: 10,
  minX: -10,
  minY: -10,
};

function getPoint(objectId: string, context: TikzExportContext) {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

export const LineExporter: TikzObjectExporter<LineObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context) as PointObject | null;
    const pointB = getPoint(object.pointBId, context) as PointObject | null;

    if (!pointA || !pointB) {
      return;
    }

    const clipped = clipLineToBounds(pointA, pointB, exportBounds);

    if (!clipped) {
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const start = formatPoint(clipped[0], context.options.coordinatePrecision);
    const end = formatPoint(clipped[1], context.options.coordinatePrecision);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} ${start} -- ${end};`,
    );
  },
  objectType: "line",
};
