"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolygonRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
function getPoint(objectId, context) {
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
exports.PolygonRenderer = {
    objectType: "polygon",
    render: (object, context) => {
        const points = object.pointIds
            .map((pointId) => getPoint(pointId, context))
            .filter((point) => Boolean(point))
            .map((point) => (0, viewport_1.worldToScreen)(point, context.viewport));
        if (points.length < 3) {
            return null;
        }
        const path = `${points
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ")} Z`;
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("path", { d: path, fill: "#7ddcff", fillOpacity: 0.08, stroke: "#7ddcff", strokeLinejoin: "round", strokeOpacity: 0.38, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("path", { d: path, fill: "#a8f0ff", fillOpacity: 0.05, stroke: "#a8f0ff", strokeLinejoin: "round", strokeOpacity: 0.22, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("path", { d: path, fill: object.style.fill, fillOpacity: object.style.fillOpacity, stroke: object.style.stroke, strokeDasharray: getDashArray(object.style.dash), strokeLinejoin: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
    },
};
