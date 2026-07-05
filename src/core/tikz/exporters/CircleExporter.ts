import type { CircleObject, PointObject } from "../../geometry";
import { EPSILON, distance } from "../../geometry";
import {
  formatNumber,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

function getPoint(objectId: string, context: TikzExportContext) {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

export const CircleExporter: TikzObjectExporter<CircleObject> = {
  exportObject: (object, context) => {
    if (object.circleKind === "three-points") {
      return;
    }

    const center = getPoint(object.centerPointId, context) as PointObject | null;

    if (!center) {
      return;
    }

    const radius =
      object.circleKind === "center-radius"
        ? object.radius
        : (() => {
            const radiusPoint = getPoint(object.radiusPointId, context);

            return radiusPoint ? distance(center, radiusPoint) : 0;
          })();

    if (radius <= EPSILON) {
      return;
    }

    const centerName = context.nameRegistry.getPointName(center.id);

    if (!centerName) {
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} (${centerName}) circle (${formatNumber(radius, context.options.coordinatePrecision)});`,
    );
  },
  objectType: "circle",
};
