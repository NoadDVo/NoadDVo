"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPSILON = void 0;
exports.almostEqual = almostEqual;
exports.isFiniteNumber = isFiniteNumber;
exports.cleanNumber = cleanNumber;
exports.pointsAlmostEqual = pointsAlmostEqual;
exports.distance = distance;
exports.distanceSquared = distanceSquared;
exports.midpoint = midpoint;
exports.vectorFromPoints = vectorFromPoints;
exports.dot = dot;
exports.cross = cross;
exports.vectorLength = vectorLength;
exports.normalize = normalize;
exports.perpendicular = perpendicular;
exports.addVectors = addVectors;
exports.scaleVector = scaleVector;
exports.polygonArea = polygonArea;
exports.angleRadians = angleRadians;
exports.angleDegrees = angleDegrees;
exports.isRightAngle = isRightAngle;
exports.EPSILON = 1e-9;
function almostEqual(a, b, eps = exports.EPSILON) {
    return Math.abs(a - b) <= eps;
}
function isFiniteNumber(value) {
    return Number.isFinite(value);
}
function cleanNumber(value, precision = 6) {
    const rounded = Number(value.toFixed(precision));
    return Object.is(rounded, -0) ? 0 : rounded;
}
function pointsAlmostEqual(a, b, eps = exports.EPSILON) {
    return almostEqual(a.x, b.x, eps) && almostEqual(a.y, b.y, eps);
}
function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}
function distanceSquared(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}
function midpoint(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
}
function vectorFromPoints(a, b) {
    return {
        x: b.x - a.x,
        y: b.y - a.y,
    };
}
function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}
function cross(a, b) {
    return a.x * b.y - a.y * b.x;
}
function vectorLength(vector) {
    return Math.hypot(vector.x, vector.y);
}
function normalize(vector) {
    const length = vectorLength(vector);
    if (length < exports.EPSILON) {
        return { x: 0, y: 0 };
    }
    return {
        x: vector.x / length,
        y: vector.y / length,
    };
}
function perpendicular(vector) {
    return {
        x: -vector.y,
        y: vector.x,
    };
}
function addVectors(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y,
    };
}
function scaleVector(vector, scalar) {
    return {
        x: vector.x * scalar,
        y: vector.y * scalar,
    };
}
function polygonArea(points) {
    let sum = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        if (!current || !next) {
            continue;
        }
        sum += current.x * next.y - next.x * current.y;
    }
    return sum / 2;
}
function angleRadians(pointA, vertex, pointC) {
    const vectorA = vectorFromPoints(vertex, pointA);
    const vectorC = vectorFromPoints(vertex, pointC);
    const unsigned = Math.atan2(Math.abs(cross(vectorA, vectorC)), dot(vectorA, vectorC));
    return unsigned < 0 ? unsigned + Math.PI * 2 : unsigned;
}
function angleDegrees(pointA, vertex, pointC) {
    return (angleRadians(pointA, vertex, pointC) * 180) / Math.PI;
}
function isRightAngle(pointA, vertex, pointC, toleranceDegrees = 1) {
    return Math.abs(angleDegrees(pointA, vertex, pointC) - 90) <= toleranceDegrees;
}
