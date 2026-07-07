"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AngleRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
function getPoint(objectId, context) {
    const object = context.objects[objectId];
    return object?.type === "point" ? object : null;
}
function polarAngle(point, vertex) {
    return Math.atan2(point.y - vertex.y, point.x - vertex.x);
}
function normalizeDelta(delta) {
    let nextDelta = delta;
    while (nextDelta <= -Math.PI) {
        nextDelta += Math.PI * 2;
    }
    while (nextDelta > Math.PI) {
        nextDelta -= Math.PI * 2;
    }
    return nextDelta;
}
function createArcPoints(pointA, vertex, pointC, radius) {
    const start = polarAngle(pointA, vertex);
    const delta = normalizeDelta(polarAngle(pointC, vertex) - start);
    const steps = Math.max(8, Math.ceil((Math.abs(delta) * 180) / Math.PI / 10));
    return Array.from({ length: steps + 1 }, (_, index) => {
        const angle = start + (delta * index) / steps;
        return {
            x: vertex.x + Math.cos(angle) * radius,
            y: vertex.y + Math.sin(angle) * radius,
        };
    });
}
function createArcPath(pointA, vertex, pointC, radius, context) {
    return createArcPoints(pointA, vertex, pointC, radius)
        .map((point, index) => {
        const screen = (0, viewport_1.worldToScreen)(point, context.viewport);
        return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
    })
        .join(" ");
}
function labelPoint(pointA, vertex, pointC, radius) {
    const start = polarAngle(pointA, vertex);
    const delta = normalizeDelta(polarAngle(pointC, vertex) - start);
    const angle = start + delta / 2;
    return {
        x: vertex.x + Math.cos(angle) * radius,
        y: vertex.y + Math.sin(angle) * radius,
    };
}
function rightAngleMarkerPath(pointA, vertex, pointC, radius, context) {
    const vectorA = (0, geometry_1.normalize)((0, geometry_1.vectorFromPoints)(vertex, pointA));
    const vectorC = (0, geometry_1.normalize)((0, geometry_1.vectorFromPoints)(vertex, pointC));
    const markerSize = radius * 0.48;
    const first = {
        x: vertex.x + (0, geometry_1.scaleVector)(vectorA, markerSize).x,
        y: vertex.y + (0, geometry_1.scaleVector)(vectorA, markerSize).y,
    };
    const corner = {
        x: first.x + (0, geometry_1.scaleVector)(vectorC, markerSize).x,
        y: first.y + (0, geometry_1.scaleVector)(vectorC, markerSize).y,
    };
    const second = {
        x: vertex.x + (0, geometry_1.scaleVector)(vectorC, markerSize).x,
        y: vertex.y + (0, geometry_1.scaleVector)(vectorC, markerSize).y,
    };
    const screenFirst = (0, viewport_1.worldToScreen)(first, context.viewport);
    const screenCorner = (0, viewport_1.worldToScreen)(corner, context.viewport);
    const screenSecond = (0, viewport_1.worldToScreen)(second, context.viewport);
    return `M ${screenFirst.x} ${screenFirst.y} L ${screenCorner.x} ${screenCorner.y} L ${screenSecond.x} ${screenSecond.y}`;
}
exports.AngleRenderer = {
    objectType: "angle",
    render: (object, context) => {
        const pointA = getPoint(object.pointAId, context);
        const vertex = getPoint(object.vertexPointId, context);
        const pointC = getPoint(object.pointCId, context);
        if (!pointA || !vertex || !pointC) {
            return null;
        }
        const isSelected = context.selectedObjectIds.includes(object.id);
        const isHovered = context.hoveredObjectId === object.id && !isSelected;
        const radius = Math.max(0.15, object.radius);
        const stroke = isSelected ? "#7ddcff" : object.style.stroke;
        const strokeWidth = object.style.strokeWidth + (isSelected ? 1.25 : 0);
        const label = object.label ?? object.name;
        const labelScreen = (0, viewport_1.worldToScreen)(labelPoint(pointA, vertex, pointC, radius * 1.34), context.viewport);
        const isRight = (0, geometry_1.isRightAngle)(pointA, vertex, pointC);
        const arcPath = createArcPath(pointA, vertex, pointC, radius, context);
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [(isSelected || isHovered) && ((0, jsx_runtime_1.jsx)("path", { className: isSelected ? "ndv-selection-glow" : undefined, d: arcPath, fill: "none", stroke: isSelected ? "#7ddcff" : "#a8f0ff", strokeLinecap: "round", strokeOpacity: isSelected ? 0.42 : 0.24, strokeWidth: strokeWidth + 6 })), isRight ? ((0, jsx_runtime_1.jsx)("path", { d: rightAngleMarkerPath(pointA, vertex, pointC, radius, context), fill: "none", stroke: stroke, strokeLinecap: "round", strokeLinejoin: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: strokeWidth })) : ((0, jsx_runtime_1.jsx)("path", { d: arcPath, fill: "none", stroke: stroke, strokeLinecap: "round", strokeOpacity: object.style.strokeOpacity, strokeWidth: strokeWidth })), object.style.labelVisible && label && ((0, jsx_runtime_1.jsx)("text", { fill: "#0b0f14", fontFamily: "Inter, ui-sans-serif, system-ui", fontSize: object.style.labelSize ?? 13, fontWeight: 800, paintOrder: "stroke", stroke: "#f2f7fa", strokeWidth: 3, textAnchor: "middle", x: labelScreen.x, y: labelScreen.y, children: label })), isSelected && ((0, jsx_runtime_1.jsx)("circle", { cx: (0, viewport_1.worldToScreen)(vertex, context.viewport).x, cy: (0, viewport_1.worldToScreen)(vertex, context.viewport).y, fill: "#7ddcff", fillOpacity: 0.18, r: 4 })), (0, jsx_runtime_1.jsx)("title", { children: `${label ?? "Angle"} ${Math.round(((0, geometry_1.angleRadians)(pointA, vertex, pointC) * 180) / Math.PI)} degrees` })] }));
    },
};
