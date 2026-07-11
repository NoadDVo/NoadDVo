"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPreviewPoint = renderPreviewPoint;
exports.renderPreviewPolyline = renderPreviewPolyline;
exports.renderPointSequencePreview = renderPointSequencePreview;
const react_1 = require("react");
const viewport_1 = require("../geometry/viewport");
const previewStroke = "#7ddcff";
function renderPreviewPoint({ point, r = 5, viewport, }) {
    const screen = (0, viewport_1.worldToScreen)(point, viewport);
    return (0, react_1.createElement)("circle", {
        cx: screen.x,
        cy: screen.y,
        fill: previewStroke,
        fillOpacity: 0.16,
        r,
        stroke: previewStroke,
        strokeOpacity: 0.82,
        strokeWidth: 1.5,
    });
}
function renderPreviewPolyline({ points, viewport, }) {
    if (points.length < 2) {
        return null;
    }
    const path = points
        .map((point, index) => {
        const screen = (0, viewport_1.worldToScreen)(point, viewport);
        return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
    })
        .join(" ");
    return (0, react_1.createElement)("path", {
        d: path,
        fill: "none",
        stroke: previewStroke,
        strokeDasharray: "7 6",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeOpacity: 0.74,
        strokeWidth: 2,
    });
}
function renderPointSequencePreview({ points, pointerWorld, viewport, }) {
    if (points.length === 0) {
        return null;
    }
    const previewPoints = [...points, pointerWorld];
    return (0, react_1.createElement)("g", null, renderPreviewPolyline({ points: previewPoints, viewport }), ...points.map((point) => (0, react_1.createElement)("g", { key: point.id }, renderPreviewPoint({ point, viewport }))));
}
