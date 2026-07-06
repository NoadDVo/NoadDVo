import type { PointObject } from "../../geometry";
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
  },
  objectType: "point",
};
