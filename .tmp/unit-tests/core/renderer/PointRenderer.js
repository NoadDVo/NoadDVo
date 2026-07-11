"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
exports.PointRenderer = {
    objectType: "point",
    render: (object, context) => {
        const point = (0, viewport_1.worldToScreen)(object, context.viewport);
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        const radius = object.style.pointSize;
        const isDerived = object.pointKind === "derived";
        const fill = object.style.fill === "transparent"
            ? isDerived
                ? "#f8fafc"
                : "#0b0f14"
            : object.style.fill;
        const fillOpacity = object.style.fill === "transparent" ? 1 : object.style.fillOpacity;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("circle", { className: "ndv-selection-glow", cx: point.x, cy: point.y, fill: "none", r: radius + 7, stroke: "#7ddcff", strokeOpacity: 0.42, strokeWidth: 3 })), isHovered && ((0, jsx_runtime_1.jsx)("circle", { cx: point.x, cy: point.y, fill: "none", r: radius + 5, stroke: "#a8f0ff", strokeOpacity: 0.28, strokeWidth: 2 })), (0, jsx_runtime_1.jsx)("circle", { cx: point.x, cy: point.y, fill: fill, fillOpacity: fillOpacity, r: radius, stroke: isDerived ? "#747b84" : object.style.stroke, strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth }), object.locked && ((0, jsx_runtime_1.jsx)("text", { fill: "#0b0f14", fontFamily: "Inter, ui-sans-serif, system-ui", fontSize: 10, fontWeight: 800, x: point.x + radius + 4, y: point.y + radius + 10, children: "L" })), object.style.labelVisible && object.name && ((0, jsx_runtime_1.jsx)("text", { fill: "#0b0f14", fontFamily: "Inter, ui-sans-serif, system-ui", fontSize: object.style.labelSize ?? 12, fontWeight: 700, paintOrder: "stroke", stroke: "#f2f7fa", strokeWidth: 3, x: point.x + radius + 8, y: point.y - radius - 6, children: object.name }))] }));
    },
};
