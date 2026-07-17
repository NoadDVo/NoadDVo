import type { SegmentObject, PointObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const SegmentExporter: TikzObjectExporter<SegmentObject> = {
  exportObject: (object, context) => {
    const getLineKindIndex = (seg: SegmentObject) => {
      const all = Object.values(context.scene.objects).filter(o => o.type === "segment" && o.specialLineKind === seg.specialLineKind) as SegmentObject[];
      all.sort((a, b) => a.createdAt - b.createdAt);
      const index = all.findIndex(l => l.id === seg.id);
      return index === -1 ? 1 : index + 1;
    };

    const startName = context.nameRegistry.getPointName(object.startPointId);
    const endName = context.nameRegistry.getPointName(object.endPointId);

    if (!startName || !endName) {
      context.warnings.push({
        code: "TIKZ_INVALID_SEGMENT",
        message: "Segment could not be exported because one or both endpoints are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} (${startName}) -- (${endName});`,
    );

    if (object.specialLineKind === "altitude") {
      const depPt = context.scene.objects[object.endPointId];
      if (depPt?.type === "point" && depPt.construction?.type === "special-line-projection") {
        const segment = context.scene.objects[(depPt.construction as any).segmentId];
        if (segment?.type === "segment") {
          const nameA = context.nameRegistry.getPointName(object.startPointId);
          const nameB = context.nameRegistry.getPointName(segment.startPointId);
          const nameC = context.nameRegistry.getPointName(segment.endPointId);
          if (nameA && nameB && nameC) {
            context.scene.sections.shapes.push(
              `\\draw[line width=0.5pt] ($($(${nameB})!(${nameA})!(${nameC})$)!0.15cm!(${nameA})$) -- ($($($(${nameB})!(${nameA})!(${nameC})$)!0.15cm!(${nameA})$)!0.15cm!90:($(${nameB})!(${nameA})!(${nameC})$)$) -- ($($(${nameB})!(${nameA})!(${nameC})$)!0.15cm!(${nameB})$);`
            );
          }
        }
      }
    } else if (object.specialLineKind === "median") {
      const depPt = context.scene.objects[object.endPointId];
      if (depPt?.type === "point" && depPt.construction?.type === "special-line-midpoint") {
        const segment = context.scene.objects[(depPt.construction as any).segmentId];
        if (segment?.type === "segment") {
          const nameA = context.nameRegistry.getPointName(object.startPointId);
          const nameB = context.nameRegistry.getPointName(segment.startPointId);
          const nameC = context.nameRegistry.getPointName(segment.endPointId);
          if (nameA && nameB && nameC && endName) {
            const index = getLineKindIndex(object);
            const tickCount = Math.min(index, 3);
            const drawTickAt = (p1: string, p2: string) => {
              const gap = 0.06;
              for (let i = 0; i < tickCount; i++) {
                const offset = (i - (tickCount - 1) / 2) * gap;
                context.scene.sections.shapes.push(
                  `\\draw[line width=0.6pt] ($($($(${p1})!0.5!(${p2})$)!${offset}cm!(${p2})$)!0.1cm!90:(${p2})$) -- ($($($(${p1})!0.5!(${p2})$)!${offset}cm!(${p2})$)!0.1cm!-90:(${p2})$);`
                );
              }
            };
            drawTickAt(nameB, endName);
            drawTickAt(endName, nameC);
          }
        }
      }
    } else if (object.specialLineKind === "angle-bisector") {
      const depPt = context.scene.objects[object.endPointId];
      if (depPt?.type === "point") {
        let pA: PointObject | undefined;
        let pC: PointObject | undefined;

        if (depPt.construction?.type === "special-line-bisector") {
          const segment = context.scene.objects[(depPt.construction as any).segmentId];
          if (segment?.type === "segment") {
            pA = context.scene.objects[segment.startPointId] as PointObject;
            pC = context.scene.objects[segment.endPointId] as PointObject;
          }
        } else if (depPt.construction?.type === "angle-bisector-endpoint") {
          pA = context.scene.objects[(depPt.construction as any).pointAId] as PointObject;
          pC = context.scene.objects[(depPt.construction as any).pointCId] as PointObject;
        }

        const pVertex = context.scene.objects[object.startPointId];
        const pP = depPt;

        const nameVertex = context.nameRegistry.getPointName(object.startPointId);

        if (nameVertex && pVertex?.type === "point" && pA?.type === "point" && pC?.type === "point" && pP.type === "point") {
          // Arc marks: Cartesian coordinates
          const angleA   = Math.atan2(pA.y - pVertex.y, pA.x - pVertex.x) * (180 / Math.PI);
          const angleBis = Math.atan2(pP.y - pVertex.y, pP.x - pVertex.x) * (180 / Math.PI);
          const angleC   = Math.atan2(pC.y - pVertex.y, pC.x - pVertex.x) * (180 / Math.PI);

          const norm = (a: number) => { while (a <= -180) a += 360; while (a > 180) a -= 360; return a; };
          const d1 = norm(angleBis - angleA);
          const d2 = norm(angleC - angleBis);
          const end1 = angleA + d1;
          const end2 = end1 + d2;

          const r1 = 0.40;
          const r2 = 0.55;
          const index = getLineKindIndex(object);
          const tickCount = Math.min(index, 3);

          const radA = angleA * Math.PI / 180;
          const x_start1 = pVertex.x + r1 * Math.cos(radA);
          const y_start1 = pVertex.y + r1 * Math.sin(radA);

          const radEnd1 = end1 * Math.PI / 180;
          const x_start2 = pVertex.x + r2 * Math.cos(radEnd1);
          const y_start2 = pVertex.y + r2 * Math.sin(radEnd1);

          context.scene.sections.shapes.push(
            `\\draw[line width=0.6pt, draw=black] (${x_start1.toFixed(2)}, ${y_start1.toFixed(2)}) arc [start angle=${angleA.toFixed(2)}, end angle=${end1.toFixed(2)}, radius=${r1}cm];`
          );
          context.scene.sections.shapes.push(
            `\\draw[line width=0.6pt, draw=black] (${x_start2.toFixed(2)}, ${y_start2.toFixed(2)}) arc [start angle=${end1.toFixed(2)}, end angle=${end2.toFixed(2)}, radius=${r2}cm];`
          );

          const drawArcTicks = (midAng: number, radius: number) => {
            const tickLen = 0.08;
            const gap = 0.06;
            const angleGap = (gap / radius) * (180 / Math.PI);
            for (let i = 0; i < tickCount; i++) {
              const a = midAng + (i - (tickCount - 1) / 2) * angleGap;
              const radA = a * Math.PI / 180;
              const tx1 = pVertex.x + (radius - tickLen) * Math.cos(radA);
              const ty1 = pVertex.y + (radius - tickLen) * Math.sin(radA);
              const tx2 = pVertex.x + (radius + tickLen) * Math.cos(radA);
              const ty2 = pVertex.y + (radius + tickLen) * Math.sin(radA);
              context.scene.sections.shapes.push(
                `\\draw[line width=0.6pt] (${tx1.toFixed(2)}, ${ty1.toFixed(2)}) -- (${tx2.toFixed(2)}, ${ty2.toFixed(2)});`
              );
            }
          };

          drawArcTicks(angleA + d1 / 2, r1);
          drawArcTicks(end1 + d2 / 2, r2);
        }
      }
    } else if (object.specialLineKind === "perpendicular-bisector-3step") {
      const midPt = context.scene.objects[object.startPointId];
      if (midPt?.type === "point" && midPt.construction?.type === "midpoint") {
        const pA = context.scene.objects[midPt.construction.pointAId] as PointObject;
        const pB = context.scene.objects[midPt.construction.pointBId] as PointObject;
        const pDep = context.scene.objects[object.endPointId] as PointObject;
        const nameA = context.nameRegistry.getPointName(midPt.construction.pointAId);
        const nameB = context.nameRegistry.getPointName(midPt.construction.pointBId);
        const nameMid = context.nameRegistry.getPointName(object.startPointId);
        const nameDep = context.nameRegistry.getPointName(object.endPointId);
        if (pA && pB && pDep && nameA && nameB && nameMid && nameDep) {
          const uA = { x: pA.x - midPt.x, y: pA.y - midPt.y };
          const uALen = Math.sqrt(uA.x * uA.x + uA.y * uA.y);
          const u = { x: uA.x / uALen, y: uA.y / uALen };

          const vDep = { x: pDep.x - midPt.x, y: pDep.y - midPt.y };
          const vDepLen = Math.sqrt(vDep.x * vDep.x + vDep.y * vDep.y);
          const v = { x: vDep.x / vDepLen, y: vDep.y / vDepLen };

          const sqSize = 0.2;
          const sq1 = { x: midPt.x + u.x * sqSize, y: midPt.y + u.y * sqSize };
          const sq2 = { x: sq1.x + v.x * sqSize, y: sq1.y + v.y * sqSize };
          const sq3 = { x: midPt.x + v.x * sqSize, y: midPt.y + v.y * sqSize };

          context.scene.sections.shapes.push(
            `\\draw[line width=0.5pt, draw=black] (${sq1.x.toFixed(2)}, ${sq1.y.toFixed(2)}) -- (${sq2.x.toFixed(2)}, ${sq2.y.toFixed(2)}) -- (${sq3.x.toFixed(2)}, ${sq3.y.toFixed(2)});`
          );

          const index = getLineKindIndex(object);
          const tickCount = Math.min(index, 3);
          const drawTickAt = (p1: string, p2: string) => {
            const gap = 0.06;
            for (let i = 0; i < tickCount; i++) {
              const offset = (i - (tickCount - 1) / 2) * gap;
              context.scene.sections.shapes.push(
                `\\draw[line width=0.6pt] ($($($(${p1})!0.5!(${p2})$)!${offset}cm!(${p2})$)!0.1cm!90:(${p2})$) -- ($($($(${p1})!0.5!(${p2})$)!${offset}cm!(${p2})$)!0.1cm!-90:(${p2})$);`
              );
            }
          };
          drawTickAt(nameA, nameMid);
          drawTickAt(nameMid, nameB);
        }
      }
    }
  },
  objectType: "segment",
};
