"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngleExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
const greekLabelMap = {
    "\u03b1": "\\alpha",
    "\u03b2": "\\beta",
    "\u03b3": "\\gamma",
    "\u03b8": "\\theta",
};
function getPoint(objectId, context) {
    const object = context.scene.objects[objectId];
    return object?.type === "point" ? object : null;
}
function getPointName(objectId, context) {
    return context.nameRegistry.getPointName(objectId) ?? null;
}
function formatLabel(label) {
    if (!label) {
        return null;
    }
    const trimmed = label.trim();
    return `"$${greekLabelMap[trimmed] ?? trimmed}$"`;
}
exports.AngleExporter = {
    exportObject: (object, context) => {
        const pointA = getPoint(object.pointAId, context);
        const vertex = getPoint(object.vertexPointId, context);
        const pointC = getPoint(object.pointCId, context);
        const pointAName = getPointName(object.pointAId, context);
        const vertexName = getPointName(object.vertexPointId, context);
        const pointCName = getPointName(object.pointCId, context);
        if (!pointA || !vertex || !pointC || !pointAName || !vertexName || !pointCName) {
            context.warnings.push({
                code: "TIKZ_INVALID_ANGLE",
                message: "Angle could not be exported because one or more defining points are unavailable.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const styleOptions = (0, TikzFormatter_1.formatStyleOptions)(style)
            .replace(/^\[|\]$/g, "")
            .split(", ")
            .filter(Boolean);
        const label = formatLabel(object.label ?? object.name);
        const options = (0, TikzFormatter_1.formatTikzOptions)([
            ...(styleOptions.length > 0 ? styleOptions : ["draw"]),
            ...(label ? [label] : []),
            `angle radius=${(0, TikzFormatter_1.formatNumber)(Math.max(0.15, object.radius), 2)}cm`,
            "angle eccentricity=1.35",
        ]);
        const angleCommand = object.showRightAngleMarker || (0, geometry_1.isRightAngle)(pointA, vertex, pointC)
            ? "right angle"
            : "angle";
        context.scene.sections.shapes.push(`\\pic ${options} {${angleCommand} = ${pointAName}--${vertexName}--${pointCName}};`);
    },
    objectType: "angle",
};
