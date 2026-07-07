"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentExporter = void 0;
const TikzFormatter_1 = require("../TikzFormatter");
exports.SegmentExporter = {
    exportObject: (object, context) => {
        const startName = context.nameRegistry.getPointName(object.startPointId);
        const endName = context.nameRegistry.getPointName(object.endPointId);
        if (!startName || !endName) {
            context.warnings.push({
                code: "TIKZ_INVALID_SEGMENT",
                message: "Segment could not be exported because one or both endpoints are unavailable.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        context.scene.sections.shapes.push(`\\draw${(0, TikzFormatter_1.formatStyleOptions)(style)} (${startName}) -- (${endName});`);
    },
    objectType: "segment",
};
