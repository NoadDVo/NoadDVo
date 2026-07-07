"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
exports.ArcExporter = {
    exportObject: (object, context) => {
        const geometry = (0, geometry_1.getArcGeometry)(object, context.scene.objects);
        if (!geometry) {
            context.warnings.push({
                code: "TIKZ_INVALID_ARC",
                message: "Arc could not be exported because its dependencies are unavailable or degenerate.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const startAngle = geometry.startAngleDegrees;
        const endAngle = object.direction === "counterclockwise"
            ? geometry.endAngleDegrees
            : geometry.endAngleDegrees - 360;
        context.scene.sections.shapes.push(`\\draw${(0, TikzFormatter_1.formatStyleOptions)(style)} (${(0, TikzFormatter_1.formatNumber)(geometry.startPoint.x, context.options.coordinatePrecision)},${(0, TikzFormatter_1.formatNumber)(geometry.startPoint.y, context.options.coordinatePrecision)}) arc[start angle=${(0, TikzFormatter_1.formatNumber)(startAngle, context.options.coordinatePrecision)}, end angle=${(0, TikzFormatter_1.formatNumber)(endAngle, context.options.coordinatePrecision)}, radius=${(0, TikzFormatter_1.formatNumber)(geometry.radius, context.options.coordinatePrecision)}];`);
    },
    objectType: "arc",
};
