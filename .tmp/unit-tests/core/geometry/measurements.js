"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureValue = measureValue;
exports.formatMeasurementValue = formatMeasurementValue;
exports.getMeasurementAnchorPoint = getMeasurementAnchorPoint;
exports.isMeasurementTypeSupported = isMeasurementTypeSupported;
const math_1 = require("./math");
const derivedGeometry_1 = require("./derivedGeometry");
const regionGeometry_1 = require("./regionGeometry");
const labelOffsets = {
    above: { x: 0, y: 0.35 },
    "above-left": { x: -0.35, y: 0.35 },
    "above-right": { x: 0.35, y: 0.35 },
    below: { x: 0, y: -0.35 },
    "below-left": { x: -0.35, y: -0.35 },
    "below-right": { x: 0.35, y: -0.35 },
    left: { x: -0.35, y: 0 },
    right: { x: 0.35, y: 0 },
};
function getPoint(objects, pointId) {
    return (0, derivedGeometry_1.getPointObject)(objects, pointId);
}
function segmentLength(object, objects) {
    const start = getPoint(objects, object.startPointId);
    const end = getPoint(objects, object.endPointId);
    return start && end ? (0, math_1.distance)(start, end) : null;
}
function polygonPoints(object, objects) {
    return (0, derivedGeometry_1.getPolygonPoints)(object, objects);
}
function polygonPerimeter(object, objects) {
    const points = polygonPoints(object, objects);
    if (!points) {
        return null;
    }
    return points.reduce((sum, point, index) => {
        const next = points[(index + 1) % points.length];
        return next ? sum + (0, math_1.distance)(point, next) : sum;
    }, 0);
}
function angleValue(object, objects) {
    const pointA = getPoint(objects, object.pointAId);
    const vertex = getPoint(objects, object.vertexPointId);
    const pointC = getPoint(objects, object.pointCId);
    return pointA && vertex && pointC ? (0, math_1.angleDegrees)(pointA, vertex, pointC) : null;
}
function measureValue(measurement, objects) {
    const target = objects[measurement.targetObjectId];
    if (measurement.measurementType === "segment-length" && target?.type === "segment") {
        return segmentLength(target, objects);
    }
    if (target?.type === "polygon" && measurement.measurementType === "polygon-perimeter") {
        return polygonPerimeter(target, objects);
    }
    if (target?.type === "polygon" && measurement.measurementType === "polygon-area") {
        const points = polygonPoints(target, objects);
        return points ? Math.abs((0, math_1.polygonArea)(points)) : null;
    }
    if (target?.type === "circle") {
        const circle = (0, derivedGeometry_1.getCircleGeometry)(target, objects);
        const radius = circle?.radius ?? null;
        if (radius === null) {
            return null;
        }
        if (measurement.measurementType === "circle-radius") {
            return radius;
        }
        if (measurement.measurementType === "circle-diameter") {
            return radius * 2;
        }
        if (measurement.measurementType === "circle-circumference") {
            return 2 * Math.PI * radius;
        }
        if (measurement.measurementType === "circle-area") {
            return Math.PI * radius * radius;
        }
    }
    if (target?.type === "arc" && measurement.measurementType === "arc-length") {
        const arc = (0, derivedGeometry_1.getArcGeometry)(target, objects);
        if (!arc) {
            return null;
        }
        const delta = target.direction === "counterclockwise"
            ? (arc.endAngleDegrees - arc.startAngleDegrees + 360) % 360
            : (arc.startAngleDegrees - arc.endAngleDegrees + 360) % 360;
        return arc.radius * ((delta || 360) * Math.PI / 180);
    }
    if (target?.type === "region" && measurement.measurementType === "region-area") {
        return (0, regionGeometry_1.getRegionArea)(target, objects);
    }
    return target?.type === "angle" && measurement.measurementType === "angle-value"
        ? angleValue(target, objects)
        : null;
}
function formatMeasurementValue(measurement, objects) {
    const value = measureValue(measurement, objects);
    const precision = measurement.precision ?? 2;
    if (value === null) {
        return "Unavailable";
    }
    const formatted = Number(value.toFixed(precision));
    const text = Object.is(formatted, -0) ? "0" : String(formatted);
    return measurement.measurementType === "angle-value" ? `${text}°` : text;
}
function averagePoint(points) {
    const sum = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    return {
        x: sum.x / points.length,
        y: sum.y / points.length,
    };
}
function getMeasurementAnchorPoint(measurement, objects) {
    const target = objects[measurement.targetObjectId];
    let point = { x: 0, y: 0 };
    if (target?.type === "segment") {
        const start = getPoint(objects, target.startPointId);
        const end = getPoint(objects, target.endPointId);
        point = start && end ? averagePoint([start, end]) : point;
    }
    else if (target?.type === "polygon") {
        point = averagePoint(polygonPoints(target, objects) ?? [point]);
    }
    else if (target?.type === "circle") {
        const circle = (0, derivedGeometry_1.getCircleGeometry)(target, objects);
        point = circle
            ? { x: circle.center.x + circle.radius, y: circle.center.y }
            : point;
    }
    else if (target?.type === "arc") {
        const arc = (0, derivedGeometry_1.getArcGeometry)(target, objects);
        point = arc
            ? {
                x: arc.center.x + arc.radius,
                y: arc.center.y,
            }
            : point;
    }
    else if (target?.type === "region") {
        point = averagePoint((0, derivedGeometry_1.getPolygonPoints)(target, objects) ?? [point]);
    }
    else if (target?.type === "angle") {
        const vertex = getPoint(objects, target.vertexPointId);
        point = vertex ? { x: vertex.x + target.radius, y: vertex.y } : point;
    }
    const offset = labelOffsets[measurement.labelPosition];
    return {
        x: point.x + offset.x,
        y: point.y + offset.y,
    };
}
function isMeasurementTypeSupported(target, measurementType) {
    return ((target.type === "segment" && measurementType === "segment-length") ||
        (target.type === "polygon" &&
            (measurementType === "polygon-area" || measurementType === "polygon-perimeter")) ||
        (target.type === "circle" && measurementType.startsWith("circle-")) ||
        (target.type === "arc" && measurementType === "arc-length") ||
        (target.type === "region" && measurementType === "region-area") ||
        (target.type === "angle" && measurementType === "angle-value"));
}
