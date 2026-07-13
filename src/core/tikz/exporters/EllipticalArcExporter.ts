import type { EllipticalArcObject } from "../../geometry";
import { getEllipticalArcGeometry } from "../../geometry";
import {
  formatNumber,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const EllipticalArcExporter: TikzObjectExporter<EllipticalArcObject> = {
  exportObject: (object, context) => {
    const geometry = getEllipticalArcGeometry(object, context.scene.objects);

    if (!geometry) {
      context.warnings.push({
        code: "TIKZ_INVALID_ELLIPTICAL_ARC",
        message: "Elliptical Arc could not be exported because its dependencies are unavailable or degenerate.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const startAngle = geometry.startAngleDegrees;
    let endAngle = geometry.endAngleDegrees;
    
    if (object.direction === "counterclockwise") {
      if (endAngle < startAngle) {
        endAngle += 360;
      }
    } else {
      if (endAngle > startAngle) {
        endAngle -= 360;
      }
    }

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} (${formatNumber(geometry.startPoint.x, context.options.coordinatePrecision)},${formatNumber(geometry.startPoint.y, context.options.coordinatePrecision)}) arc[start angle=${formatNumber(startAngle, context.options.coordinatePrecision)}, end angle=${formatNumber(endAngle, context.options.coordinatePrecision)}, x radius=${formatNumber(geometry.rx, context.options.coordinatePrecision)}cm, y radius=${formatNumber(geometry.ry, context.options.coordinatePrecision)}cm];`,
    );
  },
  objectType: "elliptical-arc",
};
