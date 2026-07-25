import { angleRadians, isRightAngle, type AngleObject, type PointObject } from "../../geometry";
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

import { formatNumber, getTikzPointReference, formatStyleOptions, styleToTikzParts } from "../TikzFormatter";

function getPointName(objectId: string, context: TikzExportContext): string | null {
  return getTikzPointReference(objectId, context);
}

function formatLabel(label: string | undefined, degrees: number, showMeasure: boolean): string | null {
  const degreeStr = `${degrees}^\\circ`;
  if (!label) {
    return showMeasure ? `\\text{${degreeStr}}` : null;
  }
  const trimmed = label.trim();
  const formattedLabel = greekLabelMap[trimmed] ?? trimmed;
  return showMeasure ? `${formattedLabel} = ${degreeStr}` : formattedLabel;
}

export const AngleExporter: TikzObjectExporter<AngleObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context);
    const vertex = getPoint(object.vertexPointId, context);
    const pointC = getPoint(object.pointCId, context);
    const pointAName = getPointName(object.pointAId, context);
    const vertexName = getPointName(object.vertexPointId, context);

    if (!pointA || !vertex || !pointC || !pointAName || !vertexName) {
      context.warnings.push({
        code: "TIKZ_INVALID_ANGLE",
        message: "Angle could not be exported because one or more defining points are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const startAngleRad = Math.atan2(pointA.y - vertex.y, pointA.x - vertex.x);
    const endAngleRad = Math.atan2(pointC.y - vertex.y, pointC.x - vertex.x);
    
    let deltaRad = endAngleRad - startAngleRad;
    while (deltaRad <= -Math.PI) deltaRad += Math.PI * 2;
    while (deltaRad > Math.PI) deltaRad -= Math.PI * 2;

    const startAngle = (startAngleRad * 180) / Math.PI;
    const endAngle = startAngle + ((deltaRad * 180) / Math.PI);
    
    const midAngle = startAngle + ((deltaRad * 180) / Math.PI) / 2;
    const radius = formatNumber(Math.max(0.15, object.radius), 2);
    const sA = formatNumber(startAngle, 2);
    const eA = formatNumber(endAngle, 2);
    const mA = formatNumber(midAngle, 2);

    const isRight = object.showRightAngleMarker || isRightAngle(pointA, vertex, pointC);
    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const fillVisible = context.options.preserveStyle && object.style.fill !== "transparent" && object.style.fillOpacity > 0;
    const strokeVisible = object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;

    if (fillVisible) {
      const fillOptions = formatStyleOptions({
        ...style,
        draw: undefined,
        lineWidth: undefined,
        strokeOpacity: undefined,
        fill: style.fill,
        fillOpacity: style.fillOpacity,
      });
      if (isRight) {
        context.scene.sections.fills.push(
          `\\fill${fillOptions} (${vertexName}) -- ([shift=({${sA}:${radius}cm})] ${vertexName}) -- ++(${eA}:${radius}cm) -- ([shift=({${eA}:${radius}cm})] ${vertexName}) -- cycle;`
        );
      } else {
        context.scene.sections.fills.push(
          `\\fill${fillOptions} (${vertexName}) -- ([shift=({${sA}:${radius}cm})] ${vertexName}) arc [start angle=${sA}, end angle=${eA}, radius=${radius}cm] -- cycle;`
        );
      }
    }

    if (strokeVisible) {
      const strokeOptions = formatStyleOptions({
        ...style,
        draw: style.draw,
        fill: undefined,
      });
      if (isRight) {
        context.scene.sections.shapes.push(
          `\\draw${strokeOptions} ([shift=({${sA}:${radius}cm})] ${vertexName}) -- ++(${eA}:${radius}cm) -- ([shift=({${eA}:${radius}cm})] ${vertexName});`
        );
      } else {
        context.scene.sections.shapes.push(
          `\\draw${strokeOptions} ([shift=({${sA}:${radius}cm})] ${vertexName}) arc [start angle=${sA}, end angle=${eA}, radius=${radius}cm];`
        );
      }
    }

    // Command 2: Label
    if (object.style.labelVisible) {
      const labelRadius = formatNumber(Math.max(0.15, object.radius) + 0.35, 2);
      const degrees = Math.round((angleRadians(pointA, vertex, pointC) * 180) / Math.PI);
      const labelStr = formatLabel(object.label ?? object.name, degrees, object.showLabel ?? true);
      if (labelStr) {
        context.scene.sections.shapes.push(
          `\\path (${vertexName}) +(${mA}:${labelRadius}cm) node[inner sep=0pt, anchor=center] {$${labelStr}$};`
        );
      }
    }
  },
  objectType: "angle",
};
