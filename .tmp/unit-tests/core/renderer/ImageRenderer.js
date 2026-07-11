"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const viewport_1 = require("../geometry/viewport");
exports.ImageRenderer = {
    objectType: "image",
    render: (object, context) => {
        const center = (0, viewport_1.worldToScreen)(object, context.viewport);
        const width = object.width * context.viewport.scale;
        const height = object.height * context.viewport.scale;
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [(0, jsx_runtime_1.jsx)("image", { height: height, href: object.src, opacity: object.opacity, preserveAspectRatio: object.preserveAspectRatio ? "xMidYMid meet" : "none", width: width, x: center.x - width / 2, y: center.y - height / 2 }), (isSelected || isHovered) && ((0, jsx_runtime_1.jsx)("rect", { fill: "none", height: height, rx: 6, ry: 6, stroke: isSelected ? "#7ddcff" : "#a8f0ff", strokeDasharray: isSelected ? "8 5" : "5 5", strokeOpacity: isSelected ? 0.8 : 0.44, strokeWidth: 2, width: width, x: center.x - width / 2, y: center.y - height / 2 }))] }));
    },
};
