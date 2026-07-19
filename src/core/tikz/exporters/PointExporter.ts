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

    context.scene.sections.coordinates.push(
      `\\coordinate (${name}) at ${formatPoint(object, context.options.coordinatePrecision)};`,
    );

    if (context.options.exportPoints) {
      const colorFor = (color: string) => context.colorRegistry.getColorName(color);
      const style = styleToTikzParts(object.style, context.options, colorFor);
      const options = formatStyleOptions({
        fill: style.draw,
        fillOpacity: object.style.strokeOpacity,
      });
      const radius = context.options.mode === "olympiad" ? "1.2pt" : "1.5pt";

      context.scene.sections.points.push(`\\fill${options} (${name}) circle (${radius});`);
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
