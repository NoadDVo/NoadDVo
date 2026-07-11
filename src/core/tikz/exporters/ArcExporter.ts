import type { ArcObject } from "../../geometry";
import { getArcGeometry } from "../../geometry";
import {
  formatNumber,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const ArcExporter: TikzObjectExporter<ArcObject> = {
  exportObject: (object, context) => {
    const geometry = getArcGeometry(object, context.scene.objects);

    if (!geometry) {
      context.warnings.push({
        code: "TIKZ_INVALID_ARC",
        message: "Arc could not be exported because its dependencies are unavailable or degenerate.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const startAngle = geometry.startAngleDegrees;
    const endAngle =
      object.direction === "counterclockwise"
        ? geometry.endAngleDegrees
        : geometry.endAngleDegrees - 360;

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} (${formatNumber(geometry.startPoint.x, context.options.coordinatePrecision)},${formatNumber(geometry.startPoint.y, context.options.coordinatePrecision)}) arc[start angle=${formatNumber(startAngle, context.options.coordinatePrecision)}, end angle=${formatNumber(endAngle, context.options.coordinatePrecision)}, radius=${formatNumber(geometry.radius, context.options.coordinatePrecision)}];`,
    );
  },
  objectType: "arc",
};
