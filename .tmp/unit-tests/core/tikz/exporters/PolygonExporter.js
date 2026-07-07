"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolygonExporter = void 0;
const TikzFormatter_1 = require("../TikzFormatter");
function hasVisibleFill(object) {
    return object.style.fill !== "transparent" && object.style.fillOpacity > 0;
}
function hasVisibleStroke(object) {
    return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}
exports.PolygonExporter = {
    exportObject: (object, context) => {
        const names = object.pointIds
            .map((pointId) => context.nameRegistry.getPointName(pointId))
            .filter((name) => Boolean(name));
        if (names.length < 3) {
            context.warnings.push({
                code: "TIKZ_INVALID_POLYGON",
                message: "Polygon could not be exported because fewer than three boundary points are available.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const fillVisible = context.options.preserveStyle && hasVisibleFill(object);
        const strokeVisible = hasVisibleStroke(object);
        const options = (0, TikzFormatter_1.formatStyleOptions)({
            ...style,
            draw: strokeVisible ? style.draw : undefined,
            fill: fillVisible ? style.fill : undefined,
            fillOpacity: fillVisible ? style.fillOpacity : undefined,
        });
        const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
        const targetSection = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;
        targetSection.push(`${command}${options} ${names.map((name) => `(${name})`).join(" -- ")} -- cycle;`);
    },
    objectType: "polygon",
};
