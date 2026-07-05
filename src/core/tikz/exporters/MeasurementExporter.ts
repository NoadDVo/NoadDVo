import {
  formatMeasurementValue,
  getMeasurementAnchorPoint,
  type MeasurementObject,
} from "../../geometry";
import {
  formatNumber,
  formatPoint,
  formatTikzOptions,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

function measurementContent(value: string): string {
  return `$${value.replace("°", "^\\circ")}$`;
}

export const MeasurementExporter: TikzObjectExporter<MeasurementObject> = {
  exportObject: (object, context) => {
    const value = formatMeasurementValue(object, context.scene.objects);
    const position = getMeasurementAnchorPoint(object, context.scene.objects);
    const color = context.options.preserveColors
      ? context.colorRegistry.getColorName(object.style.stroke)
      : null;
    const options = [
      "anchor=center",
      ...(color ? [`text=${color}`] : []),
      ...(object.style.strokeOpacity < 1
        ? [`opacity=${formatNumber(object.style.strokeOpacity, 3)}`]
        : []),
      `font=\\fontsize{${formatNumber(object.style.labelSize, 2)}}{${formatNumber(object.style.labelSize * 1.2, 2)}}\\selectfont`,
    ];

    context.scene.sections.labels.push(
      `\\node${formatTikzOptions(options)} at ${formatPoint(position, context.options.coordinatePrecision)} {${measurementContent(value)}};`,
    );
  },
  objectType: "measurement",
};
