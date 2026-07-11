"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
exports.VectorExporter = {
    exportObject: (object, context) => {
        const startName = context.nameRegistry.getPointName(object.startPointId);
        const endName = context.nameRegistry.getPointName(object.endPointId);
        if (!startName || !endName) {
            context.warnings.push({
                code: "TIKZ_INVALID_VECTOR",
                message: "Vector could not be exported because one or both endpoints are unavailable.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const arrow = (0, geometry_1.vectorArrowStyleToTikz)((0, geometry_1.getVectorArrowStyle)(object), (0, geometry_1.getVectorArrowSize)(object));
        const options = (0, TikzFormatter_1.formatTikzOptions)([
            ...(arrow ? [arrow] : []),
            ...(0, TikzFormatter_1.stylePartsToOptions)(style),
        ]);
        context.scene.sections.shapes.push(`\\draw${options} (${startName}) -- (${endName});`);
    },
    objectType: "vector",
};
