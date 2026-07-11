"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipLineToBounds = clipLineToBounds;
exports.clipRayToBounds = clipRayToBounds;
const math_1 = require("../math");
function isInsideBounds(point, bounds) {
    const tolerance = 1e-8;
    return (point.x >= bounds.minX - tolerance &&
        point.x <= bounds.maxX + tolerance &&
        point.y >= bounds.minY - tolerance &&
        point.y <= bounds.maxY + tolerance);
}
function uniquePush(points, point) {
    if (!points.some((candidate) => (0, math_1.pointsAlmostEqual)(candidate, point))) {
        points.push(point);
    }
}
function collectRayCandidate(candidates, point, bounds) {
    if (point.t < 0 || !isInsideBounds(point, bounds)) {
        return;
    }
    if (!candidates.some((candidate) => Math.abs(candidate.t - point.t) < 1e-8)) {
        candidates.push(point);
    }
}
function clipLineToBounds(pointA, pointB, bounds) {
    const dx = pointB.x - pointA.x;
    const dy = pointB.y - pointA.y;
    const points = [];
    if (Math.abs(dx) > 1e-10) {
        const leftT = (bounds.minX - pointA.x) / dx;
        const rightT = (bounds.maxX - pointA.x) / dx;
        uniquePush(points, { x: bounds.minX, y: pointA.y + leftT * dy });
        uniquePush(points, { x: bounds.maxX, y: pointA.y + rightT * dy });
    }
    if (Math.abs(dy) > 1e-10) {
        const bottomT = (bounds.minY - pointA.y) / dy;
        const topT = (bounds.maxY - pointA.y) / dy;
        uniquePush(points, { x: pointA.x + bottomT * dx, y: bounds.minY });
        uniquePush(points, { x: pointA.x + topT * dx, y: bounds.maxY });
    }
    const visiblePoints = points.filter((point) => isInsideBounds(point, bounds));
    const first = visiblePoints[0];
    const second = visiblePoints[1];
    return first && second ? [first, second] : null;
}
function clipRayToBounds(start, through, bounds) {
    const dx = through.x - start.x;
    const dy = through.y - start.y;
    const candidates = [];
    if (Math.abs(dx) > 1e-10) {
        const leftT = (bounds.minX - start.x) / dx;
        const rightT = (bounds.maxX - start.x) / dx;
        collectRayCandidate(candidates, { t: leftT, x: bounds.minX, y: start.y + leftT * dy }, bounds);
        collectRayCandidate(candidates, { t: rightT, x: bounds.maxX, y: start.y + rightT * dy }, bounds);
    }
    if (Math.abs(dy) > 1e-10) {
        const bottomT = (bounds.minY - start.y) / dy;
        const topT = (bounds.maxY - start.y) / dy;
        collectRayCandidate(candidates, { t: bottomT, x: start.x + bottomT * dx, y: bounds.minY }, bounds);
        collectRayCandidate(candidates, { t: topT, x: start.x + topT * dx, y: bounds.maxY }, bounds);
    }
    const farPoint = candidates.sort((a, b) => b.t - a.t)[0];
    return farPoint ? [start, farPoint] : null;
}
