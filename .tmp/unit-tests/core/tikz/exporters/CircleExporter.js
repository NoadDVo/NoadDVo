"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
exports.CircleExporter = {
    exportObject: (object, context) => {
        const geometry = (0, geometry_1.getCircleGeometry)(object, context.scene.objects);
        if (!geometry || geometry.radius <= geometry_1.EPSILON) {
            context.warnings.push({
                code: "TIKZ_INVALID_CIRCLE",
                message: "Circle could not be exported because its radius is zero or dependencies are unavailable.",
                objectId: object.id,
            });
            return;
        }
        const centerExpression = object.circleKind === "three-points"
            ? (0, TikzFormatter_1.formatPoint)(geometry.center, context.options.coordinatePrecision)
            : (() => {
                const centerName = context.nameRegistry.getPointName(object.centerPointId);
                return centerName ? `(${centerName})` : null;
            })();
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        if (centerExpression) {
            context.scene.sections.shapes.push(`\\draw${(0, TikzFormatter_1.formatStyleOptions)(style)} ${centerExpression} circle (${(0, TikzFormatter_1.formatNumber)(geometry.radius, context.options.coordinatePrecision)});`);
        }
        else {
            context.warnings.push({
                code: "TIKZ_INVALID_CIRCLE",
                message: "Circle could not be exported because its center point is unavailable.",
                objectId: object.id,
            });
        }
    },
    objectType: "circle",
};
