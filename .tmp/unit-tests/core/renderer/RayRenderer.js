"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RayRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
function getPoint(objectId, context) {
    const object = context.objects[objectId];
    return object?.type === "point" ? object : null;
}
exports.RayRenderer = {
    objectType: "ray",
    render: (object, context) => {
        const start = getPoint(object.startPointId, context);
        const through = getPoint(object.throughPointId, context);
        if (!start || !through) {
            return null;
        }
        const clippedRay = (0, viewport_1.clipRayToBounds)(start, through, (0, viewport_1.getViewportWorldBounds)(context.viewport));
        if (!clippedRay) {
            return null;
        }
        const startScreen = (0, viewport_1.worldToScreen)(clippedRay[0], context.viewport);
        const endScreen = (0, viewport_1.worldToScreen)(clippedRay[1], context.viewport);
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("line", { x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: "#7ddcff", strokeLinecap: "round", strokeOpacity: 0.32, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("line", { x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: "#a8f0ff", strokeLinecap: "round", strokeOpacity: 0.2, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("line", { x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: object.style.stroke, strokeLinecap: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
    },
};
