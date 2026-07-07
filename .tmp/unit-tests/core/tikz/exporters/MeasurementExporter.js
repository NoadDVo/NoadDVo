"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
function measurementContent(value) {
    return `$${value.replace(/\u00b0|\u00c2\u00b0/g, "^\\circ")}$`;
}
exports.MeasurementExporter = {
    exportObject: (object, context) => {
        const value = (0, geometry_1.formatMeasurementValue)(object, context.scene.objects);
        if (value === "Unavailable") {
            context.warnings.push({
                code: "TIKZ_INVALID_MEASUREMENT",
                message: "Measurement could not be exported because its target value is unavailable.",
                objectId: object.id,
            });
            return;
        }
        const position = (0, geometry_1.getMeasurementAnchorPoint)(object, context.scene.objects);
        const color = context.options.preserveColors
            ? context.colorRegistry.getColorName(object.style.stroke)
            : null;
        const options = [
            "anchor=center",
            ...(color ? [`text=${color}`] : []),
            ...(object.style.strokeOpacity < 1
                ? [`opacity=${(0, TikzFormatter_1.formatNumber)(object.style.strokeOpacity, 3)}`]
                : []),
            `font=\\fontsize{${(0, TikzFormatter_1.formatNumber)(object.style.labelSize, 2)}}{${(0, TikzFormatter_1.formatNumber)(object.style.labelSize * 1.2, 2)}}\\selectfont`,
        ];
        context.scene.sections.measurements.push(`\\node${(0, TikzFormatter_1.formatTikzOptions)(options)} at ${(0, TikzFormatter_1.formatPoint)(position, context.options.coordinatePrecision)} {${measurementContent(value)}};`);
    },
    objectType: "measurement",
};
