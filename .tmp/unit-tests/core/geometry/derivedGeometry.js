"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPointObject = getPointObject;
exports.getPolygonPoints = getPolygonPoints;
exports.circumcircleFromPoints = circumcircleFromPoints;
exports.getCircleGeometry = getCircleGeometry;
exports.getArcGeometry = getArcGeometry;
exports.isPointInPolygon = isPointInPolygon;
const math_1 = require("./math");
function getPointObject(objects, pointId) {
    const object = objects[pointId];
    return object?.type === "point" ? object : null;
}
function getPolygonPoints(object, objects) {
    const pointIds = object.type === "polygon" ? object.pointIds : object.boundaryPointIds;
    const points = pointIds.map((pointId) => getPointObject(objects, pointId));
    return points.some((point) => point === null)
        ? null
        : points.filter((point) => Boolean(point));
}
function circumcircleFromPoints(pointA, pointB, pointC) {
    const determinant = 2 *
        (pointA.x * (pointB.y - pointC.y) +
            pointB.x * (pointC.y - pointA.y) +
            pointC.x * (pointA.y - pointB.y));
    if (Math.abs(determinant) <= math_1.EPSILON) {
        return null;
    }
    const aSquared = pointA.x * pointA.x + pointA.y * pointA.y;
    const bSquared = pointB.x * pointB.x + pointB.y * pointB.y;
    const cSquared = pointC.x * pointC.x + pointC.y * pointC.y;
    const center = {
        x: (aSquared * (pointB.y - pointC.y) +
            bSquared * (pointC.y - pointA.y) +
            cSquared * (pointA.y - pointB.y)) /
            determinant,
        y: (aSquared * (pointC.x - pointB.x) +
            bSquared * (pointA.x - pointC.x) +
            cSquared * (pointB.x - pointA.x)) /
            determinant,
    };
    if (!(0, math_1.isFiniteNumber)(center.x) || !(0, math_1.isFiniteNumber)(center.y)) {
        return null;
    }
    const radius = (0, math_1.distance)(center, pointA);
    return radius > math_1.EPSILON ? { center, radius } : null;
}
function getCircleGeometry(object, objects) {
    if (object.circleKind === "center-radius") {
        const center = getPointObject(objects, object.centerPointId);
        return center ? { center, radius: object.radius } : null;
    }
    if (object.circleKind === "center-point") {
        const center = getPointObject(objects, object.centerPointId);
        const radiusPoint = getPointObject(objects, object.radiusPointId);
        return center && radiusPoint
            ? { center, radius: (0, math_1.distance)(center, radiusPoint) }
            : null;
    }
    const pointA = getPointObject(objects, object.pointAId);
    const pointB = getPointObject(objects, object.pointBId);
    const pointC = getPointObject(objects, object.pointCId);
    return pointA && pointB && pointC
        ? circumcircleFromPoints(pointA, pointB, pointC)
        : null;
}
function angleDegrees(center, point) {
    const degrees = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
    return degrees < 0 ? degrees + 360 : degrees;
}
function getArcGeometry(object, objects) {
    const center = getPointObject(objects, object.centerPointId);
    const startPoint = getPointObject(objects, object.startPointId);
    const endPoint = getPointObject(objects, object.endPointId);
    if (!center || !startPoint || !endPoint) {
        return null;
    }
    const radius = (0, math_1.distance)(center, startPoint);
    if (radius <= math_1.EPSILON || Math.abs((0, math_1.distance)(center, endPoint) - radius) > math_1.EPSILON * 1000) {
        return null;
    }
    return {
        center,
        endAngleDegrees: angleDegrees(center, endPoint),
        endPoint,
        radius,
        startAngleDegrees: angleDegrees(center, startPoint),
        startPoint,
    };
}
function isPointInPolygon(point, polygonPoints) {
    let inside = false;
    for (let index = 0, previousIndex = polygonPoints.length - 1; index < polygonPoints.length; previousIndex = index, index += 1) {
        const current = polygonPoints[index];
        const previous = polygonPoints[previousIndex];
        if (!current || !previous) {
            continue;
        }
        const intersects = current.y > point.y !== previous.y > point.y &&
            point.x <
                ((previous.x - current.x) * (point.y - current.y)) /
                    (previous.y - current.y) +
                    current.x;
        if (intersects) {
            inside = !inside;
        }
    }
    return inside;
}
