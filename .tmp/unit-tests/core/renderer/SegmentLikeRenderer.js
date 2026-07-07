"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRendererPoint = getRendererPoint;
exports.renderSegmentLike = renderSegmentLike;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
function getRendererPoint(objectId, context) {
    const object = context.objects[objectId];
    return object?.type === "point" ? object : null;
}
function getDashArray(dash) {
    if (dash === "dashed") {
        return "10 8";
    }
    if (dash === "dotted") {
        return "2 7";
    }
    return undefined;
}
function renderSegmentLike({ context, end, markerEnd, object, selectionMarkerEnd, start, }) {
    const startScreen = (0, viewport_1.worldToScreen)(start, context.viewport);
    const endScreen = (0, viewport_1.worldToScreen)(end, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("line", { markerEnd: selectionMarkerEnd, x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: "#7ddcff", strokeLinecap: "round", strokeOpacity: 0.38, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("line", { markerEnd: selectionMarkerEnd, x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: "#a8f0ff", strokeLinecap: "round", strokeOpacity: 0.24, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("line", { markerEnd: markerEnd, x1: startScreen.x, x2: endScreen.x, y1: startScreen.y, y2: endScreen.y, stroke: object.style.stroke, strokeDasharray: getDashArray(object.style.dash), strokeLinecap: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
}
