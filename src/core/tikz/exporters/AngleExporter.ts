import { isRightAngle, type AngleObject, type PointObject } from "../../geometry";
import {
  formatNumber,
  formatStyleOptions,
  formatTikzOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

const greekLabelMap: Record<string, string> = {
  α: "\\alpha",
  β: "\\beta",
  γ: "\\gamma",
  θ: "\\theta",
};

function getPoint(objectId: string, context: TikzExportContext): PointObject | null {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

function getPointName(objectId: string, context: TikzExportContext): string | null {
  return context.nameRegistry.getPointName(objectId) ?? null;
}

function formatLabel(label: string | undefined): string | null {
  if (!label) {
    return null;
  }

  return `"$${greekLabelMap[label] ?? label}$"`;
}

export const AngleExporter: TikzObjectExporter<AngleObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context);
    const vertex = getPoint(object.vertexPointId, context);
    const pointC = getPoint(object.pointCId, context);
    const pointAName = getPointName(object.pointAId, context);
    const vertexName = getPointName(object.vertexPointId, context);
    const pointCName = getPointName(object.pointCId, context);

    if (!pointA || !vertex || !pointC || !pointAName || !vertexName || !pointCName) {
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const label = formatLabel(object.label ?? object.name);
    const options = formatTikzOptions([
      ...formatStyleOptions(style).replace(/^\[|\]$/g, "").split(", ").filter(Boolean),
      ...(label ? [label] : []),
      `angle radius=${formatNumber(Math.max(0.15, object.radius), 2)}cm`,
      "angle eccentricity=1.35",
    ]);
    const angleCommand =
      object.showRightAngleMarker || isRightAngle(pointA, vertex, pointC)
        ? "right angle"
        : "angle";

    context.scene.sections.shapes.push(
      `\\pic ${options} {${angleCommand} = ${pointAName}--${vertexName}--${pointCName}};`,
    );
  },
  objectType: "angle",
};
