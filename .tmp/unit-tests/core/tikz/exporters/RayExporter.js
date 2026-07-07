"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RayExporter = void 0;
const viewport_1 = require("../../geometry/viewport");
const TikzFormatter_1 = require("../TikzFormatter");
const exportBounds = {
    maxX: 10,
    maxY: 10,
    minX: -10,
    minY: -10,
};
function getPoint(objectId, context) {
    const object = context.scene.objects[objectId];
    return object?.type === "point" ? object : null;
}
exports.RayExporter = {
    exportObject: (object, context) => {
        const startPoint = getPoint(object.startPointId, context);
        const throughPoint = getPoint(object.throughPointId, context);
        if (!startPoint || !throughPoint) {
            context.warnings.push({
                code: "TIKZ_INVALID_RAY",
                message: "Ray could not be exported because one or both defining points are unavailable.",
                objectId: object.id,
            });
            return;
        }
        const clipped = (0, viewport_1.clipRayToBounds)(startPoint, throughPoint, exportBounds);
        if (!clipped) {
            context.warnings.push({
                code: "TIKZ_INVALID_RAY",
                message: "Ray could not be exported because it is degenerate or outside export bounds.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const start = (0, TikzFormatter_1.formatPoint)(clipped[0], context.options.coordinatePrecision);
        const end = (0, TikzFormatter_1.formatPoint)(clipped[1], context.options.coordinatePrecision);
        context.scene.sections.shapes.push(`\\draw${(0, TikzFormatter_1.formatStyleOptions)(style)} ${start} -- ${end};`);
    },
    objectType: "ray",
};
