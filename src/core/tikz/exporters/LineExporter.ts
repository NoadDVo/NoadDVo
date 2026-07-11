import type { LineObject, PointObject } from "../../geometry";
import { getBoundedLineEndpoints } from "../../geometry/derivedGeometry";
import {
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";



function getPoint(objectId: string, context: TikzExportContext) {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

export const LineExporter: TikzObjectExporter<LineObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context) as PointObject | null;
    const pointB = getPoint(object.pointBId, context) as PointObject | null;

    if (!pointA || !pointB) {
      context.warnings.push({
        code: "TIKZ_INVALID_LINE",
        message: "Line could not be exported because one or both defining points are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const boundedLine = getBoundedLineEndpoints(object, context.scene.objects);

    if (!boundedLine) {
      context.warnings.push({
        code: "TIKZ_INVALID_LINE",
        message: "Line could not be exported because it is degenerate or zero-length.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const start = formatPoint(boundedLine[0], context.options.coordinatePrecision);
    const end = formatPoint(boundedLine[1], context.options.coordinatePrecision);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} ${start} -- ${end};`,
    );
  },
  objectType: "line",
};
