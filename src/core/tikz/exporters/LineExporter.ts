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

function getLineKindIndex(line: LineObject, context: TikzExportContext): number {
  const allLines = Object.values(context.scene.objects).filter(o => o.type === "line" && o.lineKind === line.lineKind) as LineObject[];
  allLines.sort((a, b) => a.createdAt - b.createdAt);
  const index = allLines.findIndex(l => l.id === line.id);
  return index === -1 ? 1 : index + 1;
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
    const cp = context.options.coordinatePrecision;

    // The altitude, median, and angle-bisector special cases have been moved to SegmentExporter.ts
    // because SpecialLineTool now creates SegmentObjects for them.

    // Special case: Angle Bisector 4-step
    if (object.lineKind === "angle-bisector-4step") {
      const depPt = context.scene.objects[object.pointBId];
      if (depPt?.type === "point" && depPt.construction?.type === "angle-bisector-endpoint") {
        const construction = depPt.construction as any;
        const nameVertex = context.nameRegistry.getPointName(object.pointAId);
        const nameA = context.nameRegistry.getPointName(construction.pointAId);
        const nameC = context.nameRegistry.getPointName(construction.pointCId);
        const pVertex = getPoint(object.pointAId, context);
        const pA = getPoint(construction.pointAId, context);
        const pC = getPoint(construction.pointCId, context);
        const pP = depPt; // hidden endpoint - use world coordinates

        if (nameVertex && nameA && nameC && pVertex && pA && pC && pP) {
          const coordP = formatPoint({ x: pP.x, y: pP.y }, cp);
          context.scene.sections.shapes.push(
            `\\draw${formatStyleOptions(style)} (${nameVertex}) -- ${coordP};`
          );

          // Arc marks: Cartesian coordinates
          const angleA   = Math.atan2(pA.y - pVertex.y, pA.x - pVertex.x) * (180 / Math.PI);
          const angleBis = Math.atan2(pP.y - pVertex.y, pP.x - pVertex.x) * (180 / Math.PI);
          const angleC   = Math.atan2(pC.y - pVertex.y, pC.x - pVertex.x) * (180 / Math.PI);

          const norm = (a: number) => { while (a <= -180) a += 360; while (a > 180) a -= 360; return a; };
          const d1 = norm(angleBis - angleA);
          const d2 = norm(angleC - angleBis);
          const end1 = angleA + d1;
          const end2 = end1 + d2;

          const r1 = 0.50;
          const r2 = 0.65;
          const index = getLineKindIndex(object, context);
          const tickCount = Math.min(index, 3);

          context.scene.sections.shapes.push(
            `\\draw[line width=0.6pt] ([shift=(${angleA.toFixed(2)}:${r1}cm)] ${nameVertex}) arc [start angle=${angleA.toFixed(2)}, end angle=${end1.toFixed(2)}, radius=${r1}cm];`
          );
          context.scene.sections.shapes.push(
            `\\draw[line width=0.6pt] ([shift=(${end1.toFixed(2)}:${r2}cm)] ${nameVertex}) arc [start angle=${end1.toFixed(2)}, end angle=${end2.toFixed(2)}, radius=${r2}cm];`
          );

          const drawArcTicks = (midAng: number, radius: number) => {
            const tickLen = 0.08;
            const gap = 0.06;
            const angleGap = (gap / radius) * (180 / Math.PI);
            for (let i = 0; i < tickCount; i++) {
              const a = midAng + (i - (tickCount - 1) / 2) * angleGap;
              context.scene.sections.shapes.push(
                `\\draw[line width=0.6pt] ([shift=(${a.toFixed(2)}:${(radius - tickLen).toFixed(2)}cm)] ${nameVertex}) -- ([shift=(${a.toFixed(2)}:${(radius + tickLen).toFixed(2)}cm)] ${nameVertex});`
              );
            }
          };

          drawArcTicks(angleA + d1 / 2, r1);
          drawArcTicks(end1 + d2 / 2, r2);
          return;
        }
      }
    }

    // Special case: Perpendicular Bisector 3-step
    if (object.lineKind === "perpendicular-bisector-3step") {
      const midPt = context.scene.objects[object.pointAId];
      const depPt = context.scene.objects[object.pointBId];
      if (midPt?.type === "point" && midPt.construction?.type === "midpoint" && depPt?.type === "point") {
        const construction = midPt.construction as any;
        const pA = getPoint(construction.pointAId, context);
        const pB = getPoint(construction.pointBId, context);
        if (pA && pB) {
          const coordM = formatPoint({ x: midPt.x, y: midPt.y }, cp);
          const coordP = formatPoint({ x: depPt.x, y: depPt.y }, cp);

          // Draw bisector line M -> P using world coordinates
          context.scene.sections.shapes.push(
            `\\draw${formatStyleOptions(style)} ${coordM} -- ${coordP};`
          );

          // Right angle mark using world coordinates (same method as old perpendicular tool)
          const uDir = normalize(vectorFromPoints(pA, pB));
          const vDir = normalize(vectorFromPoints({ x: midPt.x, y: midPt.y }, { x: depPt.x, y: depPt.y }));
          const sqSize = 0.2;
          const mid = { x: midPt.x, y: midPt.y };
          const sq1 = { x: mid.x + uDir.x * sqSize, y: mid.y + uDir.y * sqSize };
          const sq2 = { x: sq1.x + vDir.x * sqSize, y: sq1.y + vDir.y * sqSize };
          const sq3 = { x: mid.x + vDir.x * sqSize, y: mid.y + vDir.y * sqSize };
          context.scene.sections.shapes.push(
            `\\draw[line width=0.5pt] ${formatPoint(sq1, cp)} -- ${formatPoint(sq2, cp)} -- ${formatPoint(sq3, cp)};`
          );

          // Tick marks on each half of AB using world coordinates
          const index = getLineKindIndex(object, context);
          const tickCount = Math.min(index, 3);
          const tickLen = 0.1;
          const tickDir = { x: -uDir.y, y: uDir.x };
          const mid1 = midpoint(pA, { x: midPt.x, y: midPt.y });
          const mid2 = midpoint({ x: midPt.x, y: midPt.y }, pB);
          const drawTickAt = (center: { x: number; y: number }, count: number) => {
            const gap = 0.06;
            for (let i = 0; i < count; i++) {
              const offset = (i - (count - 1) / 2) * gap;
              const c = { x: center.x + uDir.x * offset, y: center.y + uDir.y * offset };
              const t1 = { x: c.x + tickDir.x * tickLen, y: c.y + tickDir.y * tickLen };
              const t2 = { x: c.x - tickDir.x * tickLen, y: c.y - tickDir.y * tickLen };
              context.scene.sections.shapes.push(
                `\\draw[line width=0.6pt] ${formatPoint(t1, cp)} -- ${formatPoint(t2, cp)};`
              );
            }
          };
          drawTickAt(mid1, tickCount);
          drawTickAt(mid2, tickCount);
          return;
        }
      }
    }

    // Default perpendicular (old-style)
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
              `\\draw[line width=0.6pt, draw=black] ${formatPoint(p1, cp)} -- ${formatPoint(p2, cp)} -- ${formatPoint(p3, cp)};`
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
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(p1, cp)} -- ${formatPoint(p2, cp)} -- ${formatPoint(p3, cp)};`
        );
        const vLine = { x: v.x, y: v.y };
        const drawTick = (center: {x: number, y: number}) => {
          const tickLen = 0.1;
          const t1 = { x: center.x + vLine.x * tickLen, y: center.y + vLine.y * tickLen };
          const t2 = { x: center.x - vLine.x * tickLen, y: center.y - vLine.y * tickLen };
          return `\\draw[line width=0.6pt, draw=black] ${formatPoint(t1, cp)} -- ${formatPoint(t2, cp)};`;
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
        if (diff < 0) { sA = angleW; diff = -diff; }
        const eA = sA + diff;
        const midA = sA + diff / 2;
        const r1 = 0.4;
        const r2 = 0.55;
        const startPt1 = { x: v.x + Math.cos(sA * Math.PI / 180) * r1, y: v.y + Math.sin(sA * Math.PI / 180) * r1 };
        context.scene.sections.shapes.push(
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(startPt1, cp)} arc [start angle=${sA.toFixed(2)}, end angle=${midA.toFixed(2)}, radius=${r1}cm];`
        );
        const startPt2 = { x: v.x + Math.cos(midA * Math.PI / 180) * r2, y: v.y + Math.sin(midA * Math.PI / 180) * r2 };
        context.scene.sections.shapes.push(
          `\\draw[line width=0.6pt, draw=black] ${formatPoint(startPt2, cp)} arc [start angle=${midA.toFixed(2)}, end angle=${eA.toFixed(2)}, radius=${r2}cm];`
        );
      }
    }

    // Default draw
    const start = formatPoint(boundedLine[0], cp);
    const end = formatPoint(boundedLine[1], cp);
    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} ${start} -- ${end};`,
    );
  },
  objectType: "line",
};
