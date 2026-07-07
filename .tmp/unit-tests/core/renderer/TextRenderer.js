"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
function svgAnchor(alignment) {
    if (alignment === "center") {
        return "middle";
    }
    return alignment === "right" ? "end" : "start";
}
function displayText(object) {
    if (object.textMode === "math" && object.content.startsWith("$") && object.content.endsWith("$")) {
        return object.content.slice(1, -1);
    }
    return object.content;
}
exports.TextRenderer = {
    objectType: "text",
    render: (object, context) => {
        const position = (0, geometry_1.getTextPosition)(object, context.objects);
        const screen = (0, viewport_1.worldToScreen)(position, context.viewport);
        const fontSize = (0, geometry_1.getTextFontSize)(object);
        const rotation = (0, geometry_1.getTextRotation)(object);
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        const text = displayText(object);
        const width = Math.max(36, text.length * fontSize * 0.62);
        const height = fontSize * 1.5;
        const x = screen.x;
        const y = screen.y;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, transform: `rotate(${rotation} ${x} ${y})`, children: [(isSelected || isHovered) && ((0, jsx_runtime_1.jsx)("rect", { x: x - 6, y: y - height + 4, width: width + 12, height: height, rx: 4, fill: isSelected ? "#7ddcff" : "#a8f0ff", fillOpacity: isSelected ? 0.12 : 0.07, stroke: isSelected ? "#7ddcff" : "#a8f0ff", strokeOpacity: isSelected ? 0.72 : 0.35 })), (0, jsx_runtime_1.jsx)("text", { x: x, y: y, dominantBaseline: "alphabetic", fill: object.style.stroke, fillOpacity: (0, geometry_1.getTextOpacity)(object), fontFamily: "Inter, system-ui, sans-serif", fontSize: fontSize, fontWeight: object.textMode === "plain" ? 500 : 600, pointerEvents: "none", textAnchor: svgAnchor((0, geometry_1.getTextAlignment)(object)), children: text })] }));
    },
};
