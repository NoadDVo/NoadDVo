"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointExporter = void 0;
const TikzFormatter_1 = require("../TikzFormatter");
function labelAnchor(position) {
    const map = {
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
function mathLabel(content) {
    return `$${content.replace(/\\/g, "\\backslash ").replace(/[{}]/g, "")}$`;
}
exports.PointExporter = {
    exportObject: (object, context) => {
        const name = context.nameRegistry.registerPoint(object, context.scene.points.findIndex((point) => point.id === object.id), context.options.usePointNames);
        context.scene.sections.coordinates.push(`\\coordinate (${name}) at ${(0, TikzFormatter_1.formatPoint)(object, context.options.coordinatePrecision)};`);
        if (context.options.exportPoints) {
            const colorFor = (color) => context.colorRegistry.getColorName(color);
            const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
            const options = (0, TikzFormatter_1.formatStyleOptions)({
                fill: style.draw,
                fillOpacity: object.style.strokeOpacity,
            });
            const radius = context.options.mode === "olympiad" ? "1.2pt" : "1.5pt";
            context.scene.sections.points.push(`\\fill${options} (${name}) circle (${radius});`);
        }
        if (context.options.exportLabels && object.style.labelVisible && object.name) {
            context.scene.sections.labels.push(`\\node[${labelAnchor(object.style.labelPosition)}] at (${name}) {${mathLabel(object.name)}};`);
        }
    },
    objectType: "point",
};
