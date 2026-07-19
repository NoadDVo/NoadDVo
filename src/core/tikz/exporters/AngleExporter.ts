import { angleRadians, isRightAngle, type AngleObject, type PointObject } from "../../geometry";
import { formatNumber } from "../TikzFormatter";
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

import { getTikzPointReference } from "../TikzFormatter";

function getPointName(objectId: string, context: TikzExportContext): string | null {
  return getTikzPointReference(objectId, context);
}

function formatLabel(label: string | undefined, degrees: number): string | null {
  const degreeStr = `${degrees}^\\circ`;
  if (!label) {
    return `\\text{${degreeStr}}`;
  }
  const trimmed = label.trim();
  return `${greekLabelMap[trimmed] ?? trimmed} = ${degreeStr}`;
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
    
    if (isRight) {
      context.scene.sections.shapes.push(
        `\\draw[line width=0.8pt, draw=black] ([shift=({${sA}:${radius}cm})] ${vertexName}) -- ++(${eA}:${radius}cm) -- ([shift=({${eA}:${radius}cm})] ${vertexName});`
      );
    } else {
      context.scene.sections.shapes.push(
        `\\draw[line width=0.8pt, draw=black] ([shift=({${sA}:${radius}cm})] ${vertexName}) arc [start angle=${sA}, end angle=${eA}, radius=${radius}cm];`
      );
    }

    // Command 2: Label
    if (object.showLabel ?? true) {
      const labelRadius = formatNumber(Math.max(0.15, object.radius) + 0.35, 2);
      const degrees = Math.round((angleRadians(pointA, vertex, pointC) * 180) / Math.PI);
      const labelStr = formatLabel(object.label ?? object.name, degrees);
      context.scene.sections.shapes.push(
        `\\path (${vertexName}) +(${mA}:${labelRadius}cm) node[inner sep=0pt, anchor=center] {$${labelStr}$};`
      );
    }
  },
  objectType: "angle",
};
