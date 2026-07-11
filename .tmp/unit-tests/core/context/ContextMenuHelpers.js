"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTargetObject = getTargetObject;
exports.getPoint = getPoint;
exports.formatNumber = formatNumber;
exports.getSegmentPoints = getSegmentPoints;
exports.getCircleRadius = getCircleRadius;
exports.getPolygonPoints = getPolygonPoints;
exports.getPolygonPerimeter = getPolygonPerimeter;
exports.disabled = disabled;
exports.isObjectTarget = isObjectTarget;
exports.isUnlockedObject = isUnlockedObject;
exports.detailFromValue = detailFromValue;
exports.getAngleDetail = getAngleDetail;
exports.getPolygonAreaDetail = getPolygonAreaDetail;
const geometry_1 = require("../geometry");
function getTargetObject(context) {
    if (context.target.kind !== "object") {
        return null;
    }
    return context.objects[context.target.objectId] ?? null;
}
function getPoint(objects, pointId) {
    const object = objects[pointId];
    return object?.type === "point" ? object : null;
}
function formatNumber(value) {
    const rounded = Number(value.toFixed(3));
    return Object.is(rounded, -0) ? "0" : String(rounded);
}
function getSegmentPoints(object, objects) {
    const start = getPoint(objects, object.startPointId);
    const end = getPoint(objects, object.endPointId);
    return start && end ? [start, end] : null;
}
function getCircleRadius(object, objects) {
    if (object.type !== "circle") {
        return null;
    }
    if (object.circleKind === "center-radius") {
        return object.radius;
    }
    if (object.circleKind === "center-point") {
        const center = getPoint(objects, object.centerPointId);
        const radiusPoint = getPoint(objects, object.radiusPointId);
        return center && radiusPoint ? (0, geometry_1.distance)(center, radiusPoint) : null;
    }
    return null;
}
function getPolygonPoints(object, objects) {
    return object.pointIds
        .map((pointId) => getPoint(objects, pointId))
        .filter((point) => Boolean(point));
}
function getPolygonPerimeter(object, objects) {
    const points = getPolygonPoints(object, objects);
    if (points.length < 3) {
        return null;
    }
    return points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return next ? sum + (0, geometry_1.distance)(point, next) : sum;
    }, 0);
}
function disabled() {
    return false;
}
function isObjectTarget(context) {
    return context.target.kind === "object";
}
function isUnlockedObject(context) {
    const object = getTargetObject(context);
    return Boolean(object && !object.locked);
}
function detailFromValue(label, value) {
    return value === null ? `${label} unavailable` : `${label} ${formatNumber(value)}`;
}
function getAngleDetail(context) {
    const object = getTargetObject(context);
    if (object?.type !== "angle") {
        return null;
    }
    const pointA = getPoint(context.objects, object.pointAId);
    const vertex = getPoint(context.objects, object.vertexPointId);
    const pointC = getPoint(context.objects, object.pointCId);
    return detailFromValue("Angle", pointA && vertex && pointC ? (0, geometry_1.angleDegrees)(pointA, vertex, pointC) : null);
}
function getPolygonAreaDetail(context) {
    const object = getTargetObject(context);
    if (object?.type !== "polygon") {
        return null;
    }
    const points = getPolygonPoints(object, context.objects);
    return detailFromValue("Area", points.length >= 3 ? Math.abs((0, geometry_1.polygonArea)(points)) : null);
}
