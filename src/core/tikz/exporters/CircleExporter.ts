import type { CircleObject } from "../../geometry";
import { EPSILON, getCircleGeometry } from "../../geometry";
import {
  formatNumber,
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const CircleExporter: TikzObjectExporter<CircleObject> = {
  exportObject: (object, context) => {
    const geometry = getCircleGeometry(object, context.scene.objects);

    if (!geometry || geometry.radius <= EPSILON) {
      context.warnings.push({
        code: "TIKZ_INVALID_CIRCLE",
        message: "Circle could not be exported because its radius is zero or dependencies are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const centerExpression =
      object.circleKind === "three-points"
        ? formatPoint(geometry.center, context.options.coordinatePrecision)
        : (() => {
            const centerName = context.nameRegistry.getPointName(object.centerPointId);

            return centerName ? `(${centerName})` : null;
          })();

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);

    if (centerExpression) {
      context.scene.sections.shapes.push(
        `\\draw${formatStyleOptions(style)} ${centerExpression} circle (${formatNumber(geometry.radius, context.options.coordinatePrecision)});`,
      );
    } else {
      context.warnings.push({
        code: "TIKZ_INVALID_CIRCLE",
        message: "Circle could not be exported because its center point is unavailable.",
        objectId: object.id,
      });
    }
  },
  objectType: "circle",
};
