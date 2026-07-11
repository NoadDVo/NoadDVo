"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGridStep = getGridStep;
exports.createGridLines = createGridLines;
const viewport_1 = require("../../../core/geometry/viewport");
const GRID_TARGET_PX = 42;
function getNiceStep(rawStep) {
    const exponent = Math.floor(Math.log10(rawStep));
    const magnitude = 10 ** exponent;
    const normalized = rawStep / magnitude;
    if (normalized <= 1) {
        return magnitude;
    }
    if (normalized <= 2) {
        return 2 * magnitude;
    }
    if (normalized <= 5) {
        return 5 * magnitude;
    }
    return 10 * magnitude;
}
function getGridStep(viewport) {
    return getNiceStep(GRID_TARGET_PX / viewport.scale);
}
function createGridLines(viewport, options = {
    adaptiveGrid: true,
    gridSize: 1,
    majorGrid: true,
    minorGrid: true,
}) {
    const bounds = (0, viewport_1.getViewportWorldBounds)(viewport);
    const step = options.adaptiveGrid ? getGridStep(viewport) : options.gridSize;
    const startX = Math.floor(bounds.minX / step) * step;
    const endX = Math.ceil(bounds.maxX / step) * step;
    const startY = Math.floor(bounds.minY / step) * step;
    const endY = Math.ceil(bounds.maxY / step) * step;
    const lines = [];
    for (let x = startX; x <= endX; x += step) {
        const screen = (0, viewport_1.worldToScreen)({ x, y: 0 }, viewport);
        const index = Math.round(x / step);
        const major = index % 5 === 0;
        if ((major && !options.majorGrid) || (!major && !options.minorGrid)) {
            continue;
        }
        lines.push({
            id: `x-${x.toFixed(6)}`,
            major,
            x1: screen.x,
            x2: screen.x,
            y1: 0,
            y2: viewport.height,
        });
    }
    for (let y = startY; y <= endY; y += step) {
        const screen = (0, viewport_1.worldToScreen)({ x: 0, y }, viewport);
        const index = Math.round(y / step);
        const major = index % 5 === 0;
        if ((major && !options.majorGrid) || (!major && !options.minorGrid)) {
            continue;
        }
        lines.push({
            id: `y-${y.toFixed(6)}`,
            major,
            x1: 0,
            x2: viewport.width,
            y1: screen.y,
            y2: screen.y,
        });
    }
    return lines;
}
