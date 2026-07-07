"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapToGrid = snapToGrid;
function snapToGrid(point, gridSize) {
    if (gridSize <= 0) {
        return point;
    }
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize,
    };
}
