import type { PointObject } from "../../geometry";
import { midpoint, normalize, vectorFromPoints } from "../../geometry/math";
import { formatPoint, formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

function labelAnchor(position: PointObject["style"]["labelPosition"]): string {
  const map: Record<PointObject["style"]["labelPosition"], string> = {
    above: "above",
    "above-left": "above left",
    "above-right": "above right",
    below: "below",
    "below-left": "below left",
    "below-right": "below right",
    left: "left",
    right: "right",
  };

  return map[position];
}

function mathLabel(content: string): string {
  return `$${content.replace(/\\/g, "\\backslash ").replace(/[{}]/g, "")}$`;
}

export const PointExporter: TikzObjectExporter<PointObject> = {
  exportObject: (object, context) => {
    const name = context.nameRegistry.registerPoint(
      object,
      context.scene.points.findIndex((point) => point.id === object.id),
      context.options.usePointNames,
    );

    let coordDef = `\\coordinate (${name}) at ${formatPoint(object, context.options.coordinatePrecision)};`;

    if (object.construction?.type === "point-on-object" && object.construction.bindSliderId) {
      const slider = context.scene.objects[object.construction.bindSliderId];
      const parentObj = context.scene.objects[object.construction.objectId];
      if (slider?.type === "slider" && parentObj) {
        const tVal = slider.value;
        const tMacro = `\\t${name}`;
        context.scene.sections.coordinates.push(`\\pgfmathsetmacro{${tMacro}}{${tVal}}`);

        if (parentObj.type === "segment" || parentObj.type === "line" || parentObj.type === "ray") {
          const pA = context.scene.objects[(parentObj as any).pointAId ?? (parentObj as any).startPointId];
          const pB = context.scene.objects[(parentObj as any).pointBId ?? (parentObj as any).endPointId ?? (parentObj as any).throughPointId];
          if (pA && pB) {
            const nameA = context.nameRegistry.registerPoint(pA as PointObject, -1, false);
            const nameB = context.nameRegistry.registerPoint(pB as PointObject, -1, false);
            coordDef = `\\coordinate (${name}) at ($(${nameA})!${tMacro}!(${nameB})$);`;
          }
        } else if (parentObj.type === "circle") {
          const center = context.scene.objects[(parentObj as any).centerPointId];
          if (center) {
            const centerName = context.nameRegistry.registerPoint(center as PointObject, -1, false);
            const r = typeof (parentObj as any).radius === "number" ? (parentObj as any).radius : 1; // Simplified radius
            // Output parametric angle in deg since tikz cos/sin takes degrees. t is in radians
            context.scene.sections.coordinates.push(`\\pgfmathsetmacro{\\ang${name}}{${tMacro} * 180 / pi}`);
            coordDef = `\\coordinate (${name}) at ($(${centerName}) + ({\\ang${name}}:${r})$);`;
          }
        }
      }
    }

    // angle-given-size-point: tính toạ độ tuyệt đối của B' rồi dùng cú pháp TikZ polar
    if (object.construction?.type === "angle-given-size-point") {
      const { vertexPointId, anchorPointId, angleDeg, direction } = object.construction;
      const vertexObj = context.scene.objects[vertexPointId] as PointObject | undefined;
      const anchorObj = context.scene.objects[anchorPointId] as PointObject | undefined;
      if (vertexObj?.type === "point" && anchorObj?.type === "point") {
        const vName = context.nameRegistry.registerPoint(vertexObj, -1, false);
        const aName = context.nameRegistry.registerPoint(anchorObj, -1, false);
        const dx = anchorObj.x - vertexObj.x;
        const dy = anchorObj.y - vertexObj.y;
        const r = Math.sqrt(dx * dx + dy * dy);
        const alphaRad = Math.atan2(dy, dx); // góc V→A trong toạ độ math (Y-up, đồng bộ với TikZ)
        const thetaRad = (angleDeg * Math.PI) / 180;
        // Đồng bộ với buildAngle(): ccw_screen = alpha - thetaRad trong math/TikZ coords
        const finalAngle = direction === "ccw" ? alphaRad - thetaRad : alphaRad + thetaRad;
        const finalDeg = (finalAngle * 180) / Math.PI;
        const rStr = r.toFixed(context.options.coordinatePrecision);
        const angStr = finalDeg.toFixed(1);
        coordDef = `% Construct angle ${direction === "ccw" ? "-" : "+"}${angleDeg}deg from (${aName})-(${vName})\n\\coordinate (${name}) at ($(${vName}) + (${angStr}:${rStr})$);`;
      }
    }

    // point-by-distance: \coordinate (P) at ($(A)!{d/|AB|}!(B)$);
    if (object.construction?.type === "point-by-distance") {
      const { fromPointId, toPointId, distance } = object.construction;
      const fromObj = context.scene.objects[fromPointId] as PointObject | undefined;
      const toObj = context.scene.objects[toPointId] as PointObject | undefined;
      if (fromObj?.type === "point" && toObj?.type === "point") {
        const fromName = context.nameRegistry.registerPoint(fromObj, -1, false);
        const toName = context.nameRegistry.registerPoint(toObj, -1, false);
        const dx = toObj.x - fromObj.x;
        const dy = toObj.y - fromObj.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1e-9) {
          const t = (distance / len).toFixed(context.options.coordinatePrecision);
          coordDef = `\\coordinate (${name}) at ($(${fromName})!${t}!(${toName})$);`;
        }
      }
    }

    context.scene.sections.coordinates.push(coordDef);

    if (context.options.exportPoints) {
      const colorFor = (color: string) => context.colorRegistry.getColorName(color);
      const style = styleToTikzParts(object.style, context.options, colorFor);
      const options = formatStyleOptions({
        fill: style.draw,
        fillOpacity: object.style.strokeOpacity,
      });
      const defaultRadius = context.options.mode === "olympiad" ? 1.2 : 1.5;
      const pointSizeFactor = (object.style.pointSize ?? 5) / 5;
      const radiusNum = defaultRadius * pointSizeFactor;

      if (radiusNum > 0) {
        const radiusStr = Number.isInteger(radiusNum) ? `${radiusNum}pt` : `${radiusNum.toFixed(2).replace(/\.?0+$/, '')}pt`;
        const styleName = object.style.pointStyle ?? "filled";
        
        if (styleName === "hollow") {
          const hollowOptions = formatStyleOptions({ draw: style.draw, fill: "white", lineWidth: style.lineWidth, strokeOpacity: object.style.strokeOpacity });
          context.scene.sections.points.push(`\\filldraw${hollowOptions} (${name}) circle (${radiusStr});`);
        } else if (styleName === "cross") {
          const crossSize = radiusNum * 0.8;
          const crossStr = Number.isInteger(crossSize) ? `${crossSize}pt` : `${crossSize.toFixed(2).replace(/\.?0+$/, '')}pt`;
          const crossOptions = formatStyleOptions({ draw: style.draw, lineWidth: style.lineWidth, strokeOpacity: object.style.strokeOpacity });
          context.scene.sections.points.push(`\\draw${crossOptions} ([xshift=-${crossStr},yshift=-${crossStr}]${name}) -- ([xshift=${crossStr},yshift=${crossStr}]${name}) ([xshift=-${crossStr},yshift=${crossStr}]${name}) -- ([xshift=${crossStr},yshift=-${crossStr}]${name});`);
        } else if (styleName === "plus") {
          const plusOptions = formatStyleOptions({ draw: style.draw, lineWidth: style.lineWidth, strokeOpacity: object.style.strokeOpacity });
          context.scene.sections.points.push(`\\draw${plusOptions} ([xshift=-${radiusStr},yshift=0]${name}) -- ([xshift=${radiusStr},yshift=0]${name}) ([xshift=0,yshift=-${radiusStr}]${name}) -- ([xshift=0,yshift=${radiusStr}]${name});`);
        } else if (styleName === "square") {
          const sqSize = radiusNum * 0.8;
          const sqStr = Number.isInteger(sqSize) ? `${sqSize}pt` : `${sqSize.toFixed(2).replace(/\.?0+$/, '')}pt`;
          const sqOptions = formatStyleOptions({ draw: style.draw, fill: style.draw, lineWidth: style.lineWidth, strokeOpacity: object.style.strokeOpacity, fillOpacity: object.style.strokeOpacity });
          context.scene.sections.points.push(`\\filldraw${sqOptions} ([xshift=-${sqStr},yshift=-${sqStr}]${name}) rectangle ([xshift=${sqStr},yshift=${sqStr}]${name});`);
        } else {
          // filled
          context.scene.sections.points.push(`\\fill${options} (${name}) circle (${radiusStr});`);
        }
      }
    }

    if (context.options.exportLabels && object.style.labelVisible && object.name) {
      context.scene.sections.labels.push(
        `\\node[${labelAnchor(object.style.labelPosition)}] at (${name}) {${mathLabel(object.name)}};`,
      );
    }

    if (object.showEqualityTicks && object.construction?.type === "midpoint") {
      const pointA = context.scene.objects[object.construction.pointAId] as PointObject | undefined;
      const pointB = context.scene.objects[object.construction.pointBId] as PointObject | undefined;
      if (pointA?.type === "point" && pointB?.type === "point") {
        const allMidpoints = Object.values(context.scene.objects).filter(o => 
          o.type === "point" && 
          o.construction?.type === "midpoint" && 
          o.showEqualityTicks
        ) as PointObject[];
        allMidpoints.sort((a, b) => a.createdAt - b.createdAt);
        const idx = allMidpoints.findIndex(m => m.id === object.id);
        const count = Math.min(idx === -1 ? 1 : idx + 1, 3);
        
        const cp = context.options.coordinatePrecision;
        const u = normalize(vectorFromPoints(pointA, pointB));
        const tickDir = { x: -u.y, y: u.x };
        const tickLen = 0.1;
        const gap = 0.06;
        const mid1 = midpoint(pointA, object);
        const mid2 = midpoint(object, pointB);
        
        const drawTickAt = (center: { x: number; y: number }, c: number) => {
          for (let i = 0; i < c; i++) {
            const offset = (i - (c - 1) / 2) * gap;
            const pt = { x: center.x + u.x * offset, y: center.y + u.y * offset };
            const t1 = { x: pt.x + tickDir.x * tickLen, y: pt.y + tickDir.y * tickLen };
            const t2 = { x: pt.x - tickDir.x * tickLen, y: pt.y - tickDir.y * tickLen };
            const colorOption = context.options.preserveColors ? context.colorRegistry.getColorName(object.style.stroke) : null;
            const colorStr = colorOption ? `, ${colorOption}` : "";
            context.scene.sections.shapes.push(
              `\\draw[line width=0.6pt${colorStr}] ${formatPoint(t1, cp)} -- ${formatPoint(t2, cp)};`
            );
          }
        };
        drawTickAt(mid1, count);
        drawTickAt(mid2, count);
      }
    }
  },
  objectType: "point",
};
