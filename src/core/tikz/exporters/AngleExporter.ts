import { angleRadians, isRightAngle, type AngleObject, type PointObject } from "../../geometry";
import {
  formatNumber,
  formatStyleOptions,
  formatTikzOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

const greekLabelMap: Record<string, string> = {
  "\u03b1": "\\alpha",
  "\u03b2": "\\beta",
  "\u03b3": "\\gamma",
  "\u03b8": "\\theta",
};

function getPoint(objectId: string, context: TikzExportContext): PointObject | null {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

function getPointName(objectId: string, context: TikzExportContext): string | null {
  return context.nameRegistry.getPointName(objectId) ?? null;
}

function formatLabel(label: string | undefined, degrees: number): string | null {
  const degreeStr = `${degrees}^\\circ`;
  if (!label) {
    return `"$${degreeStr}$"`;
  }
  const trimmed = label.trim();
  return `"$${greekLabelMap[trimmed] ?? trimmed} = ${degreeStr}$"`;
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
      context.warnings.push({
        code: "TIKZ_INVALID_ANGLE",
        message: "Angle could not be exported because one or more defining points are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const styleOptions = formatStyleOptions(style)
      .replace(/^\[|\]$/g, "")
      .split(", ")
      .filter(Boolean);
    const degrees = Math.round((angleRadians(pointA, vertex, pointC) * 180) / Math.PI);
    const label = formatLabel(object.label ?? object.name, degrees);
    const options = formatTikzOptions([
      ...(styleOptions.length > 0 ? styleOptions : ["draw"]),
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
