"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeasurementRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
exports.MeasurementRenderer = {
    objectType: "measurement",
    render: (object, context) => {
        const position = (0, viewport_1.worldToScreen)((0, geometry_1.getMeasurementAnchorPoint)(object, context.objects), context.viewport);
        const value = (0, geometry_1.formatMeasurementValue)(object, context.objects);
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        const fontSize = object.style.labelSize;
        const width = Math.max(32, value.length * fontSize * 0.62);
        const height = fontSize * 1.45;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [(isSelected || isHovered) && ((0, jsx_runtime_1.jsx)("rect", { x: position.x - width / 2 - 6, y: position.y - height + 4, width: width + 12, height: height, rx: 4, fill: isSelected ? "#7ddcff" : "#a8f0ff", fillOpacity: isSelected ? 0.12 : 0.07, stroke: isSelected ? "#7ddcff" : "#a8f0ff", strokeOpacity: isSelected ? 0.72 : 0.35 })), (0, jsx_runtime_1.jsx)("text", { x: position.x, y: position.y, dominantBaseline: "alphabetic", fill: object.style.stroke, fillOpacity: object.style.strokeOpacity, fontFamily: "Inter, system-ui, sans-serif", fontSize: fontSize, fontWeight: 600, pointerEvents: "none", textAnchor: "middle", children: value })] }));
    },
};
