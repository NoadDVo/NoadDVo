"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArcRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
function getDashArray(dash) {
    if (dash === "dashed") {
        return "10 8";
    }
    if (dash === "dotted") {
        return "2 7";
    }
    return undefined;
}
exports.ArcRenderer = {
    objectType: "arc",
    render: (object, context) => {
        const geometry = (0, geometry_1.getArcGeometry)(object, context.objects);
        if (!geometry) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(geometry.startPoint, context.viewport);
        const end = (0, viewport_1.worldToScreen)(geometry.endPoint, context.viewport);
        const radius = geometry.radius * context.viewport.scale;
        const delta = object.direction === "counterclockwise"
            ? (geometry.endAngleDegrees - geometry.startAngleDegrees + 360) % 360
            : (geometry.startAngleDegrees - geometry.endAngleDegrees + 360) % 360;
        const largeArcFlag = delta > 180 ? 1 : 0;
        const sweepFlag = object.direction === "counterclockwise" ? 0 : 1;
        const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [isSelected && ((0, jsx_runtime_1.jsx)("path", { d: path, fill: "none", stroke: "#7ddcff", strokeLinecap: "round", strokeOpacity: 0.36, strokeWidth: object.style.strokeWidth + 8 })), isHovered && ((0, jsx_runtime_1.jsx)("path", { d: path, fill: "none", stroke: "#a8f0ff", strokeLinecap: "round", strokeOpacity: 0.22, strokeWidth: object.style.strokeWidth + 6 })), (0, jsx_runtime_1.jsx)("path", { d: path, fill: "none", stroke: object.style.stroke, strokeDasharray: getDashArray(object.style.dash), strokeLinecap: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: object.style.strokeWidth })] }));
    },
};
