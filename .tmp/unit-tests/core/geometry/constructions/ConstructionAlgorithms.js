"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineLineIntersection = lineLineIntersection;
exports.intersectLinearObjects = intersectLinearObjects;
exports.intersectLineCircle = intersectLineCircle;
exports.intersectCircles = intersectCircles;
exports.getIntersectionPoints = getIntersectionPoints;
exports.projectPointToLine = projectPointToLine;
exports.angleBisectorDirectionPoint = angleBisectorDirectionPoint;
exports.incenterPoint = incenterPoint;
exports.recomputeConstructedPoint = recomputeConstructedPoint;
const math_1 = require("../math");
function getPoint(objects, objectId) {
    const object = objects[objectId];
    return object?.type === "point" ? object : null;
}
function getLinearPoints(object, objects) {
    const pointAId = object.type === "line" ? object.pointAId : object.startPointId;
    const pointBId = object.type === "line" ? object.pointBId : object.endPointId;
    const pointA = getPoint(objects, pointAId);
    const pointB = getPoint(objects, pointBId);
    return pointA && pointB ? [pointA, pointB] : null;
}
function getCircleGeometry(object, objects) {
    if (object.circleKind === "three-points") {
        return null;
    }
    const center = getPoint(objects, object.centerPointId);
    if (!center) {
        return null;
    }
    if (object.circleKind === "center-radius") {
        return { center, radius: object.radius };
    }
    const radiusPoint = getPoint(objects, object.radiusPointId);
    return radiusPoint ? { center, radius: (0, math_1.distance)(center, radiusPoint) } : null;
}
function isBetween01(value) {
    return value >= -math_1.EPSILON && value <= 1 + math_1.EPSILON;
}
function lineLineIntersection(pointA, pointB, pointC, pointD) {
    const r = (0, math_1.vectorFromPoints)(pointA, pointB);
    const s = (0, math_1.vectorFromPoints)(pointC, pointD);
    const denominator = (0, math_1.cross)(r, s);
    if (Math.abs(denominator) <= math_1.EPSILON) {
        return null;
    }
    const cMinusA = (0, math_1.vectorFromPoints)(pointA, pointC);
    const t = (0, math_1.cross)(cMinusA, s) / denominator;
    const u = (0, math_1.cross)(cMinusA, r) / denominator;
    return {
        point: {
            x: pointA.x + t * r.x,
            y: pointA.y + t * r.y,
        },
        t,
        u,
    };
}
function intersectLinearObjects(first, second, objects) {
    const firstPoints = getLinearPoints(first, objects);
    const secondPoints = getLinearPoints(second, objects);
    if (!firstPoints || !secondPoints) {
        return [];
    }
    const result = lineLineIntersection(firstPoints[0], firstPoints[1], secondPoints[0], secondPoints[1]);
    if (!result) {
        return [];
    }
    if (first.type === "segment" && !isBetween01(result.t)) {
        return [];
    }
    if (second.type === "segment" && !isBetween01(result.u)) {
        return [];
    }
    return [result.point];
}
function intersectLineCircle(line, circle, objects) {
    const linePoints = getLinearPoints(line, objects);
    const circleGeometry = getCircleGeometry(circle, objects);
    if (!linePoints || !circleGeometry) {
        return [];
    }
    const direction = (0, math_1.vectorFromPoints)(linePoints[0], linePoints[1]);
    const fromCenter = (0, math_1.vectorFromPoints)(circleGeometry.center, linePoints[0]);
    const a = direction.x * direction.x + direction.y * direction.y;
    const b = 2 * (fromCenter.x * direction.x + fromCenter.y * direction.y);
    const c = fromCenter.x * fromCenter.x +
        fromCenter.y * fromCenter.y -
        circleGeometry.radius * circleGeometry.radius;
    const discriminant = b * b - 4 * a * c;
    if (a <= math_1.EPSILON || discriminant < -math_1.EPSILON) {
        return [];
    }
    if (Math.abs(discriminant) <= math_1.EPSILON) {
        const t = -b / (2 * a);
        return [{ x: linePoints[0].x + t * direction.x, y: linePoints[0].y + t * direction.y }];
    }
    const sqrt = Math.sqrt(discriminant);
    const firstT = (-b - sqrt) / (2 * a);
    const secondT = (-b + sqrt) / (2 * a);
    return [
        { x: linePoints[0].x + firstT * direction.x, y: linePoints[0].y + firstT * direction.y },
        { x: linePoints[0].x + secondT * direction.x, y: linePoints[0].y + secondT * direction.y },
    ];
}
function intersectCircles(first, second, objects) {
    const firstCircle = getCircleGeometry(first, objects);
    const secondCircle = getCircleGeometry(second, objects);
    if (!firstCircle || !secondCircle) {
        return [];
    }
    const centerDistance = (0, math_1.distance)(firstCircle.center, secondCircle.center);
    if (centerDistance <= math_1.EPSILON ||
        centerDistance > firstCircle.radius + secondCircle.radius + math_1.EPSILON ||
        centerDistance < Math.abs(firstCircle.radius - secondCircle.radius) - math_1.EPSILON) {
        return [];
    }
    const a = (firstCircle.radius * firstCircle.radius -
        secondCircle.radius * secondCircle.radius +
        centerDistance * centerDistance) /
        (2 * centerDistance);
    const hSquared = firstCircle.radius * firstCircle.radius - a * a;
    if (hSquared < -math_1.EPSILON) {
        return [];
    }
    const h = Math.sqrt(Math.max(0, hSquared));
    const direction = (0, math_1.vectorFromPoints)(firstCircle.center, secondCircle.center);
    const base = {
        x: firstCircle.center.x + (a * direction.x) / centerDistance,
        y: firstCircle.center.y + (a * direction.y) / centerDistance,
    };
    if (h <= math_1.EPSILON) {
        return [base];
    }
    const offset = {
        x: (-direction.y * h) / centerDistance,
        y: (direction.x * h) / centerDistance,
    };
    return [
        { x: base.x + offset.x, y: base.y + offset.y },
        { x: base.x - offset.x, y: base.y - offset.y },
    ].sort((aPoint, bPoint) => aPoint.x - bPoint.x || aPoint.y - bPoint.y);
}
function getIntersectionPoints(first, second, objects) {
    if ((first.type === "line" && second.type === "line") ||
        (first.type === "segment" && second.type === "segment")) {
        return intersectLinearObjects(first, second, objects);
    }
    if (first.type === "line" && second.type === "circle") {
        return intersectLineCircle(first, second, objects);
    }
    if (first.type === "circle" && second.type === "line") {
        return intersectLineCircle(second, first, objects);
    }
    if (first.type === "circle" && second.type === "circle") {
        return intersectCircles(first, second, objects);
    }
    return [];
}
function projectPointToLine(point, linePointA, linePointB) {
    const direction = (0, math_1.vectorFromPoints)(linePointA, linePointB);
    const lengthSquared = direction.x * direction.x + direction.y * direction.y;
    if (lengthSquared <= math_1.EPSILON) {
        return null;
    }
    const t = (0, math_1.dot)((0, math_1.vectorFromPoints)(linePointA, point), direction) / lengthSquared;
    return {
        x: linePointA.x + t * direction.x,
        y: linePointA.y + t * direction.y,
    };
}
function angleBisectorDirectionPoint(pointA, vertex, pointC) {
    const first = (0, math_1.normalize)((0, math_1.vectorFromPoints)(vertex, pointA));
    const second = (0, math_1.normalize)((0, math_1.vectorFromPoints)(vertex, pointC));
    const direction = (0, math_1.addVectors)(first, second);
    if (Math.hypot(direction.x, direction.y) <= math_1.EPSILON) {
        return null;
    }
    return {
        x: vertex.x + direction.x,
        y: vertex.y + direction.y,
    };
}
function incenterPoint(pointA, pointB, pointC) {
    const sideA = (0, math_1.distance)(pointB, pointC);
    const sideB = (0, math_1.distance)(pointC, pointA);
    const sideC = (0, math_1.distance)(pointA, pointB);
    const perimeter = sideA + sideB + sideC;
    if (perimeter <= math_1.EPSILON) {
        return null;
    }
    return {
        x: (sideA * pointA.x + sideB * pointB.x + sideC * pointC.x) / perimeter,
        y: (sideA * pointA.y + sideB * pointB.y + sideC * pointC.y) / perimeter,
    };
}
function recomputeConstructedPoint(construction, objects) {
    if (construction.type === "midpoint") {
        const pointA = getPoint(objects, construction.pointAId);
        const pointB = getPoint(objects, construction.pointBId);
        return pointA && pointB ? (0, math_1.midpoint)(pointA, pointB) : null;
    }
    if (construction.type === "intersection") {
        const sourceA = objects[construction.sourceAId];
        const sourceB = objects[construction.sourceBId];
        if (!sourceA || !sourceB) {
            return null;
        }
        return getIntersectionPoints(sourceA, sourceB, objects)[construction.index] ?? null;
    }
    if (construction.type === "perpendicular-bisector-point") {
        const pointA = getPoint(objects, construction.pointAId);
        const pointB = getPoint(objects, construction.pointBId);
        if (!pointA || !pointB) {
            return null;
        }
        const middle = (0, math_1.midpoint)(pointA, pointB);
        const normal = (0, math_1.perpendicular)((0, math_1.vectorFromPoints)(pointA, pointB));
        if (Math.hypot(normal.x, normal.y) <= math_1.EPSILON) {
            return null;
        }
        return {
            x: middle.x + normal.x,
            y: middle.y + normal.y,
        };
    }
    if (construction.type === "angle-bisector-point") {
        const pointA = getPoint(objects, construction.pointAId);
        const vertex = getPoint(objects, construction.vertexPointId);
        const pointC = getPoint(objects, construction.pointCId);
        return pointA && vertex && pointC
            ? angleBisectorDirectionPoint(pointA, vertex, pointC)
            : null;
    }
    if (construction.type === "projection-point") {
        const point = getPoint(objects, construction.pointId);
        const linePointA = getPoint(objects, construction.linePointAId);
        const linePointB = getPoint(objects, construction.linePointBId);
        return point && linePointA && linePointB
            ? projectPointToLine(point, linePointA, linePointB)
            : null;
    }
    if (construction.type === "incenter") {
        const pointA = getPoint(objects, construction.pointAId);
        const pointB = getPoint(objects, construction.pointBId);
        const pointC = getPoint(objects, construction.pointCId);
        return pointA && pointB && pointC
            ? incenterPoint(pointA, pointB, pointC)
            : null;
    }
    if (construction.type === "inradius-point") {
        const center = getPoint(objects, construction.centerPointId);
        const sidePointA = getPoint(objects, construction.sidePointAId);
        const sidePointB = getPoint(objects, construction.sidePointBId);
        return center && sidePointA && sidePointB
            ? projectPointToLine(center, sidePointA, sidePointB)
            : null;
    }
    const point = getPoint(objects, construction.pointId);
    const line = objects[construction.lineId];
    if (!point || line?.type !== "line") {
        return null;
    }
    const linePoints = getLinearPoints(line, objects);
    if (!linePoints) {
        return null;
    }
    const direction = (0, math_1.vectorFromPoints)(linePoints[0], linePoints[1]);
    const vector = construction.type === "perpendicular-line-point"
        ? (0, math_1.perpendicular)(direction)
        : direction;
    if (Math.hypot(vector.x, vector.y) <= math_1.EPSILON) {
        return null;
    }
    const candidate = { x: point.x + vector.x, y: point.y + vector.y };
    return (0, math_1.pointsAlmostEqual)(point, candidate) ? null : candidate;
}
