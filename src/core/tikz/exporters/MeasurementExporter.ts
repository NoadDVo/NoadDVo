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
  return `$${value.replace(/\u00b0|\u00c2\u00b0/g, "^\\circ")}$`;
}

export const MeasurementExporter: TikzObjectExporter<MeasurementObject> = {
  exportObject: (object, context) => {
    const value = formatMeasurementValue(object, context.scene.objects);

    if (value === "Unavailable") {
      context.warnings.push({
        code: "TIKZ_INVALID_MEASUREMENT",
        message: "Measurement could not be exported because its target value is unavailable.",
        objectId: object.id,
      });
      return;
    }

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

    context.scene.sections.measurements.push(
      `\\node${formatTikzOptions(options)} at ${formatPoint(position, context.options.coordinatePrecision)} {${measurementContent(value)}};`,
    );
  },
  objectType: "measurement",
};
