import type { CircleObject } from "../../geometry";
import { EPSILON, getCircleGeometry } from "../../geometry";
import {
  formatNumber,
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
  getTikzPointReference,
  formatPatternFill,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

function hasVisibleStroke(object: CircleObject): boolean {
  return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}

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
            const centerName = getTikzPointReference(object.centerPointId, context);

            return centerName ? `(${centerName})` : null;
          })();

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);

    if (centerExpression) {
      const path = `${centerExpression} circle (${formatNumber(geometry.radius, context.options.coordinatePrecision)})`;
      if (object.style.fill !== "transparent" && object.style.fillOpacity > 0) {
        context.scene.sections.shapes.push(`\\fill[${context.options.preserveColors ? colorFor(object.style.fill) : "white"}, fill opacity=${object.style.fillOpacity}] ${path};`);
      }

      const hasPattern = object.style.pattern && object.style.pattern.type !== "none";

      if (hasPattern) {
        const bb = {
          xMin: geometry.center.x - geometry.radius,
          xMax: geometry.center.x + geometry.radius,
          yMin: geometry.center.y - geometry.radius,
          yMax: geometry.center.y + geometry.radius,
        };
        const patternLines = formatPatternFill(
          path,
          object.style,
          context.options,
          colorFor,
          bb
        );
        
        patternLines.forEach(line => {
          context.scene.sections.fills.push(line);
        });

        if (hasVisibleStroke(object)) {
          const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
          const strokeOptions = formatStyleOptions(
            styleToTikzParts(strokeStyle, context.options, colorFor)
          );
          context.scene.sections.shapes.push(`\\draw${strokeOptions} ${path};`);
        }
      } else {
        if (hasVisibleStroke(object)) {
          const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
          context.scene.sections.shapes.push(
            `\\draw${formatStyleOptions(styleToTikzParts(strokeStyle, context.options, colorFor))} ${path};`,
          );
        }
      }
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
