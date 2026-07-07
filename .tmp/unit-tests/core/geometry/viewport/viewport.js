"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_VIEWPORT_SCALE = exports.MIN_VIEWPORT_SCALE = exports.DEFAULT_VIEWPORT = void 0;
exports.clampScale = clampScale;
exports.worldToScreen = worldToScreen;
exports.screenToWorld = screenToWorld;
exports.getViewportWorldBounds = getViewportWorldBounds;
exports.zoomViewportAtScreenPoint = zoomViewportAtScreenPoint;
exports.panViewport = panViewport;
exports.resizeViewport = resizeViewport;
exports.DEFAULT_VIEWPORT = {
    scale: 48,
    offsetX: 0,
    offsetY: 0,
    width: 1,
    height: 1,
};
exports.MIN_VIEWPORT_SCALE = 8;
exports.MAX_VIEWPORT_SCALE = 320;
function clampScale(scale) {
    return Math.min(exports.MAX_VIEWPORT_SCALE, Math.max(exports.MIN_VIEWPORT_SCALE, scale));
}
function worldToScreen(point, viewport) {
    return {
        x: viewport.width / 2 + viewport.offsetX + point.x * viewport.scale,
        y: viewport.height / 2 + viewport.offsetY - point.y * viewport.scale,
    };
}
function screenToWorld(point, viewport) {
    return {
        x: (point.x - viewport.width / 2 - viewport.offsetX) / viewport.scale,
        y: -(point.y - viewport.height / 2 - viewport.offsetY) / viewport.scale,
    };
}
function getViewportWorldBounds(viewport) {
    const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
    const bottomRight = screenToWorld({ x: viewport.width, y: viewport.height }, viewport);
    return {
        minX: Math.min(topLeft.x, bottomRight.x),
        maxX: Math.max(topLeft.x, bottomRight.x),
        minY: Math.min(topLeft.y, bottomRight.y),
        maxY: Math.max(topLeft.y, bottomRight.y),
    };
}
function zoomViewportAtScreenPoint(viewport, screenPoint, zoomFactor) {
    const worldPoint = screenToWorld(screenPoint, viewport);
    const scale = clampScale(viewport.scale * zoomFactor);
    return {
        ...viewport,
        scale,
        offsetX: screenPoint.x - viewport.width / 2 - worldPoint.x * scale,
        offsetY: screenPoint.y - viewport.height / 2 + worldPoint.y * scale,
    };
}
function panViewport(viewport, delta) {
    return {
        ...viewport,
        offsetX: viewport.offsetX + delta.x,
        offsetY: viewport.offsetY + delta.y,
    };
}
function resizeViewport(viewport, width, height) {
    return {
        ...viewport,
        width: Math.max(1, width),
        height: Math.max(1, height),
    };
}
