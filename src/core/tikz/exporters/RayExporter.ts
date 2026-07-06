import type { PointObject, RayObject } from "../../geometry";
import { clipRayToBounds, type WorldBounds } from "../../geometry/viewport";
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

function getPoint(objectId: string, context: TikzExportContext): PointObject | null {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

export const RayExporter: TikzObjectExporter<RayObject> = {
  exportObject: (object, context) => {
    const startPoint = getPoint(object.startPointId, context);
    const throughPoint = getPoint(object.throughPointId, context);

    if (!startPoint || !throughPoint) {
      context.warnings.push({
        code: "TIKZ_INVALID_RAY",
        message: "Ray could not be exported because one or both defining points are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const clipped = clipRayToBounds(startPoint, throughPoint, exportBounds);

    if (!clipped) {
      context.warnings.push({
        code: "TIKZ_INVALID_RAY",
        message: "Ray could not be exported because it is degenerate or outside export bounds.",
        objectId: object.id,
      });
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
  objectType: "ray",
};
