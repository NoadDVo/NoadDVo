"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircleRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
exports.CircleRenderer = {
    objectType: "circle",
    render: (object, context) => {
        const geometry = (0, geometry_1.getCircleGeometry)(object, context.objects);
        if (!geometry) {
            return null;
        }
        const center = (0, viewport_1.worldToScreen)(geometry.center, context.viewport);
        const radius = geometry.radius * context.viewport.scale;
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("circle", { cx: center.x, cy: center.y, fill: "none", r: radius, stroke: "#7ddcff", strokeOpacity: 0.34, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("circle", { cx: center.x, cy: center.y, fill: "none", r: radius, stroke: "#a8f0ff", strokeOpacity: 0.22, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("circle", { cx: center.x, cy: center.y, fill: object.style.fill, fillOpacity: object.style.fillOpacity, r: radius, stroke: object.style.stroke, strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
    },
};
