import type { LineObject, PointObject, Point2D } from "../../geometry";
import { normalize, vectorFromPoints, midpoint } from "../../geometry/math";
import { intersectLinearObjects } from "../../geometry/constructions/ConstructionAlgorithms";
import { getBoundedLineEndpoints } from "../../geometry/derivedGeometry";
import {
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";



function getPoint(objectId: string, context: TikzExportContext) {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

export const LineExporter: TikzObjectExporter<LineObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context) as PointObject | null;
    const pointB = getPoint(object.pointBId, context) as PointObject | null;

    if (!pointA || !pointB) {
      context.warnings.push({
        code: "TIKZ_INVALID_LINE",
        message: "Line could not be exported because one or both defining points are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const boundedLine = getBoundedLineEndpoints(object, context.scene.objects);

    if (!boundedLine) {
      context.warnings.push({
        code: "TIKZ_INVALID_LINE",
        message: "Line could not be exported because it is degenerate or zero-length.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const start = formatPoint(boundedLine[0], context.options.coordinatePrecision);
    const end = formatPoint(boundedLine[1], context.options.coordinatePrecision);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} ${start} -- ${end};`,
    );

    function getLineKindIndex(line: LineObject, context: TikzExportContext): number {
      const allLines = Object.values(context.scene.objects).filter(o => o.type === "line" && o.lineKind === line.lineKind) as LineObject[];
      allLines.sort((a, b) => a.createdAt - b.createdAt);
      const index = allLines.findIndex(l => l.id === line.id);
      return index === -1 ? 1 : index + 1;
    }

    if (object.lineKind === "perpendicular" && object.sourceLineId) {
      const sourceLine = context.scene.objects[object.sourceLineId];
      if (sourceLine && (sourceLine.type === "line" || sourceLine.type === "segment" || sourceLine.type === "ray")) {
        const intersections = intersectLinearObjects(object, sourceLine as any, context.scene.objects);
        if (intersections.length > 0) {
          const footWorld = intersections[0] as Point2D;
          const sourcePointA = getPoint((sourceLine as any).pointAId || (sourceLine as any).startPointId, context);
          const sourcePointB = getPoint((sourceLine as any).pointBId || (sourceLine as any).endPointId || (sourceLine as any).throughPointId, context);
          
          if (sourcePointA && sourcePointB && pointA && pointB) {
            const u = normalize(vectorFromPoints(sourcePointA, sourcePointB));
            const v = normalize(vectorFromPoints(pointA, pointB));
            
            const index = getLineKindIndex(object, context);
            const size = 0.3 + (index > 1 ? (index - 1) * 0.1 : 0);
            
            const p1 = { x: footWorld.x + u.x * size, y: footWorld.y + u.y * size };
            const p2 = { x: footWorld.x + u.x * size + v.x * size, y: footWorld.y + u.y * size + v.y * size };
            const p3 = { x: footWorld.x + v.x * size, y: footWorld.y + v.y * size };
            
            context.scene.sections.shapes.push(
              `\\draw[line width=0.6pt, draw=black] ${formatPoint(p1, context.options.coordinatePrecision)} -- ${formatPoint(p2, context.options.coordinatePrecision)} -- ${formatPoint(p3, context.options.coordinatePrecision)};`
            );
          }
        }
      }
    } else if (object.lineKind === "perpendicular-bisector" && object.sourceSegmentAId && object.sourceSegmentBId) {
      const pA = getPoint(object.sourceSegmentAId, context);
      const pB = getPoint(object.sourceSegmentBId, context);
      if (pA && pB && pointA && pointB) {
        const mid = midpoint(pA, pB);
        const u = normalize(vectorFromPoints(pA, pB));
        const v = normalize(vectorFromPoints(pointA, pointB));
        
        const index = getLineKindIndex(object, context);
        const size = 0.3;
        const p1 = { x: mid.x + u.x * size, y: mid.y + u.y * size };
        const p2 = { x: mid.x + u.x * size + v.x * size, y: mid.y + u.y * size + v.y * size };
        const p3 = { x: mid.x + v.x * size, y: mid.y + v.y * size };
        
        context.scene.sections.shapes.push(
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(p1, context.options.coordinatePrecision)} -- ${formatPoint(p2, context.options.coordinatePrecision)} -- ${formatPoint(p3, context.options.coordinatePrecision)};`
        );

        const vLine = { x: v.x, y: v.y };
        const drawTick = (center: {x: number, y: number}) => {
          const tickLen = 0.1;
          const t1 = { x: center.x + vLine.x * tickLen, y: center.y + vLine.y * tickLen };
          const t2 = { x: center.x - vLine.x * tickLen, y: center.y - vLine.y * tickLen };
          return `\\draw[line width=0.6pt, draw=black] ${formatPoint(t1, context.options.coordinatePrecision)} -- ${formatPoint(t2, context.options.coordinatePrecision)};`;
        };
        const drawTicksAt = (center: {x: number, y: number}, count: number) => {
          const spacing = 0.08;
          if (count === 1) {
            context.scene.sections.shapes.push(drawTick(center));
          } else if (count === 2) {
            context.scene.sections.shapes.push(drawTick({ x: center.x - vLine.x * spacing, y: center.y - vLine.y * spacing }));
            context.scene.sections.shapes.push(drawTick({ x: center.x + vLine.x * spacing, y: center.y + vLine.y * spacing }));
          } else {
            context.scene.sections.shapes.push(drawTick({ x: center.x - vLine.x * spacing * 1.5, y: center.y - vLine.y * spacing * 1.5 }));
            context.scene.sections.shapes.push(drawTick(center));
            context.scene.sections.shapes.push(drawTick({ x: center.x + vLine.x * spacing * 1.5, y: center.y + vLine.y * spacing * 1.5 }));
          }
        };

        const midA = midpoint(pA, mid);
        const midB = midpoint(mid, pB);
        const tickCount = index > 3 ? 3 : index;
        drawTicksAt(midA, tickCount);
        drawTicksAt(midB, tickCount);
      }
    } else if (object.lineKind === "angle-bisector" && object.vertexPointId && object.anglePointAId && object.anglePointBId) {
      const v = getPoint(object.vertexPointId, context);
      const pA = getPoint(object.anglePointAId, context);
      const pB = getPoint(object.anglePointBId, context);
      if (v && pA && pB) {
        const u = normalize(vectorFromPoints(v, pA));
        const w = normalize(vectorFromPoints(v, pB));

        const angleU = Math.atan2(u.y, u.x) * 180 / Math.PI;
        const angleW = Math.atan2(w.y, w.x) * 180 / Math.PI;

        let diff = (angleW - angleU) % 360;
        if (diff < -180) diff += 360;
        if (diff > 180) diff -= 360;
        
        let sA = angleU;
        if (diff < 0) {
          sA = angleW;
          diff = -diff;
        }
        const eA = sA + diff;
        const midA = sA + diff / 2;

        const r1 = 0.4;
        const r2 = 0.55;

        const startPt1 = { x: v.x + Math.cos(sA * Math.PI / 180) * r1, y: v.y + Math.sin(sA * Math.PI / 180) * r1 };
        context.scene.sections.shapes.push(
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(startPt1, context.options.coordinatePrecision)} arc [start angle=${sA.toFixed(2)}, end angle=${midA.toFixed(2)}, radius=${r1}cm];`
        );

        const startPt2 = { x: v.x + Math.cos(midA * Math.PI / 180) * r2, y: v.y + Math.sin(midA * Math.PI / 180) * r2 };
        context.scene.sections.shapes.push(
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(startPt2, context.options.coordinatePrecision)} arc [start angle=${midA.toFixed(2)}, end angle=${eA.toFixed(2)}, radius=${r2}cm];`
        );
      }
    }
  },
  objectType: "line",
};
