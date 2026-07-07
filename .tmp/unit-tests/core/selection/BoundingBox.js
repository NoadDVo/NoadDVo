"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBoundingBox = getBoundingBox;
exports.boxContainsPoint = boxContainsPoint;
exports.boxIntersectsBox = boxIntersectsBox;
exports.boxFromCorners = boxFromCorners;
const geometry_1 = require("../geometry");
function getPoint(objectId, objects) {
    return (0, geometry_1.getPointObject)(objects, objectId);
}
function boxFromPoints(points) {
    if (points.length === 0) {
        return null;
    }
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
        maxX: Math.max(...xs),
        maxY: Math.max(...ys),
        minX: Math.min(...xs),
        minY: Math.min(...ys),
    };
}
function getCircleBoundingBox(object, objects) {
    const geometry = (0, geometry_1.getCircleGeometry)(object, objects);
    if (!geometry) {
        return null;
    }
    return {
        maxX: geometry.center.x + geometry.radius,
        maxY: geometry.center.y + geometry.radius,
        minX: geometry.center.x - geometry.radius,
        minY: geometry.center.y - geometry.radius,
    };
}
function getBoundingBox(object, objects) {
    if (object.type === "point") {
        return {
            maxX: object.x,
            maxY: object.y,
            minX: object.x,
            minY: object.y,
        };
    }
    if (object.type === "segment") {
        const start = getPoint(object.startPointId, objects);
        const end = getPoint(object.endPointId, objects);
        return start && end ? boxFromPoints([start, end]) : null;
    }
    if (object.type === "vector") {
        const start = getPoint(object.startPointId, objects);
        const end = getPoint(object.endPointId, objects);
        return start && end ? boxFromPoints([start, end]) : null;
    }
    if (object.type === "circle") {
        return getCircleBoundingBox(object, objects);
    }
    if (object.type === "polygon") {
        return boxFromPoints((0, geometry_1.getPolygonPoints)(object, objects) ?? []);
    }
    if (object.type === "region") {
        return boxFromPoints((0, geometry_1.getPolygonPoints)(object, objects) ?? []);
    }
    if (object.type === "arc") {
        const arc = (0, geometry_1.getArcGeometry)(object, objects);
        return arc ? boxFromPoints([arc.center, arc.startPoint, arc.endPoint]) : null;
    }
    if (object.type === "angle") {
        const pointA = getPoint(object.pointAId, objects);
        const vertex = getPoint(object.vertexPointId, objects);
        const pointC = getPoint(object.pointCId, objects);
        return pointA && vertex && pointC ? boxFromPoints([pointA, vertex, pointC]) : null;
    }
    if (object.type === "text") {
        return boxFromPoints([(0, geometry_1.getTextPosition)(object, objects)]);
    }
    if (object.type === "measurement") {
        return boxFromPoints([(0, geometry_1.getMeasurementAnchorPoint)(object, objects)]);
    }
    return null;
}
function boxContainsPoint(box, point) {
    return (point.x >= box.minX &&
        point.x <= box.maxX &&
        point.y >= box.minY &&
        point.y <= box.maxY);
}
function boxIntersectsBox(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}
function boxFromCorners(a, b) {
    return {
        maxX: Math.max(a.x, b.x),
        maxY: Math.max(a.y, b.y),
        minX: Math.min(a.x, b.x),
        minY: Math.min(a.y, b.y),
    };
}
