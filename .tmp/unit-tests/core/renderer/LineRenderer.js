"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
function getPoint(objectId, context) {
    const object = context.objects[objectId];
    return object?.type === "point" ? object : null;
}
function getDashArray(dash) {
    if (dash === "dashed") {
        return "12 10";
    }
    if (dash === "dotted") {
        return "2 8";
    }
    return undefined;
}
exports.LineRenderer = {
    objectType: "line",
    render: (object, context) => {
        const pointA = getPoint(object.pointAId, context);
        const pointB = getPoint(object.pointBId, context);
        if (!pointA || !pointB) {
            return null;
        }
        const clippedLine = (0, viewport_1.clipLineToBounds)(pointA, pointB, (0, viewport_1.getViewportWorldBounds)(context.viewport));
        if (!clippedLine) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(clippedLine[0], context.viewport);
        const end = (0, viewport_1.worldToScreen)(clippedLine[1], context.viewport);
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("line", { x1: start.x, x2: end.x, y1: start.y, y2: end.y, stroke: "#7ddcff", strokeLinecap: "round", strokeOpacity: 0.32, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("line", { x1: start.x, x2: end.x, y1: start.y, y2: end.y, stroke: "#a8f0ff", strokeLinecap: "round", strokeOpacity: 0.2, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("line", { x1: start.x, x2: end.x, y1: start.y, y2: end.y, stroke: object.style.stroke, strokeDasharray: getDashArray(object.style.dash), strokeLinecap: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
    },
};
