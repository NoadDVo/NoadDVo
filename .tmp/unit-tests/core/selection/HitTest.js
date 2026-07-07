"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitTest = hitTest;
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
function getPoint(objectId, objects) {
    return (0, geometry_1.getPointObject)(objects, objectId);
}
function distanceToSegmentPx(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}
function distanceToInfiniteLinePx(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
        return Number.POSITIVE_INFINITY;
    }
    return Math.abs(dy * point.x - dx * point.y + b.x * a.y - b.y * a.x) / length;
}
function distanceToRayPx(point, start, through) {
    const dx = through.x - start.x;
    const dy = through.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
        return Number.POSITIVE_INFINITY;
    }
    const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
    if (t < 0) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }
    return distanceToInfiniteLinePx(point, start, through);
}
function visibleObjectsByType(objects, type) {
    return Object.values(objects).filter((object) => object.visible && object.type === type);
}
function normalizedAngleDegrees(center, point) {
    const degrees = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
    return degrees < 0 ? degrees + 360 : degrees;
}
function isAngleOnArc(angle, start, end, direction) {
    if (direction === "counterclockwise") {
        return ((angle - start + 360) % 360) <= ((end - start + 360) % 360 || 360);
    }
    return ((start - angle + 360) % 360) <= ((start - end + 360) % 360 || 360);
}
function hitTest(screenPoint, worldPoint, objects, viewport, options = {}) {
    const tolerancePx = options.tolerancePx ?? 10;
    for (const object of visibleObjectsByType(objects, "point")) {
        const point = (0, viewport_1.worldToScreen)(object, viewport);
        const radius = object.style.pointSize + tolerancePx;
        if ((0, geometry_1.distanceSquared)(screenPoint, point) <= radius * radius) {
            return { object, objectId: object.id, type: "point" };
        }
    }
    for (const object of visibleObjectsByType(objects, "point")) {
        if (!object.name || !object.style.labelVisible) {
            continue;
        }
        const point = (0, viewport_1.worldToScreen)(object, viewport);
        const labelBox = {
            maxX: point.x + 44,
            maxY: point.y,
            minX: point.x + object.style.pointSize + 8,
            minY: point.y - 24,
        };
        if (screenPoint.x >= labelBox.minX &&
            screenPoint.x <= labelBox.maxX &&
            screenPoint.y >= labelBox.minY &&
            screenPoint.y <= labelBox.maxY) {
            return { object, objectId: object.id, type: "label" };
        }
    }
    for (const object of visibleObjectsByType(objects, "text")) {
        const position = (0, viewport_1.worldToScreen)((0, geometry_1.getTextPosition)(object, objects), viewport);
        const fontSize = (0, geometry_1.getTextFontSize)(object);
        const width = Math.max(36, object.content.length * fontSize * 0.62);
        const height = fontSize * 1.5;
        if (screenPoint.x >= position.x - tolerancePx &&
            screenPoint.x <= position.x + width + tolerancePx &&
            screenPoint.y >= position.y - height - tolerancePx &&
            screenPoint.y <= position.y + tolerancePx) {
            return { object, objectId: object.id, type: "text" };
        }
    }
    for (const object of visibleObjectsByType(objects, "measurement")) {
        const position = (0, viewport_1.worldToScreen)((0, geometry_1.getMeasurementAnchorPoint)(object, objects), viewport);
        const fontSize = object.style.labelSize;
        const text = (0, geometry_1.formatMeasurementValue)(object, objects);
        const width = Math.max(32, text.length * fontSize * 0.62);
        const height = fontSize * 1.45;
        if (screenPoint.x >= position.x - width / 2 - tolerancePx &&
            screenPoint.x <= position.x + width / 2 + tolerancePx &&
            screenPoint.y >= position.y - height - tolerancePx &&
            screenPoint.y <= position.y + tolerancePx) {
            return { object, objectId: object.id, type: "measurement" };
        }
    }
    for (const object of visibleObjectsByType(objects, "image")) {
        const halfWidth = object.width / 2;
        const halfHeight = object.height / 2;
        const toleranceWorld = tolerancePx / viewport.scale;
        if (worldPoint.x >= object.x - halfWidth - toleranceWorld &&
            worldPoint.x <= object.x + halfWidth + toleranceWorld &&
            worldPoint.y >= object.y - halfHeight - toleranceWorld &&
            worldPoint.y <= object.y + halfHeight + toleranceWorld) {
            return { object, objectId: object.id, type: "image" };
        }
    }
    for (const object of visibleObjectsByType(objects, "segment")) {
        const start = getPoint(object.startPointId, objects);
        const end = getPoint(object.endPointId, objects);
        if (!start || !end) {
            continue;
        }
        if (distanceToSegmentPx(screenPoint, (0, viewport_1.worldToScreen)(start, viewport), (0, viewport_1.worldToScreen)(end, viewport)) <= tolerancePx) {
            return { object, objectId: object.id, type: "segment" };
        }
    }
    for (const object of visibleObjectsByType(objects, "region")) {
        if ((0, geometry_1.regionContainsPoint)(object, worldPoint, objects)) {
            return { object, objectId: object.id, type: "region" };
        }
    }
    for (const object of visibleObjectsByType(objects, "polygon")) {
        const points = (0, geometry_1.getPolygonPoints)(object, objects) ?? [];
        if (points.length >= 3 && (0, geometry_1.isPointInPolygon)(worldPoint, points)) {
            return { object, objectId: object.id, type: "polygon" };
        }
    }
    for (const object of visibleObjectsByType(objects, "circle")) {
        const geometry = (0, geometry_1.getCircleGeometry)(object, objects);
        if (!geometry) {
            continue;
        }
        const center = (0, viewport_1.worldToScreen)(geometry.center, viewport);
        const radiusPx = geometry.radius * viewport.scale;
        const distancePx = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);
        if (Math.abs(distancePx - radiusPx) <= tolerancePx) {
            return { object, objectId: object.id, type: "circle" };
        }
    }
    for (const object of visibleObjectsByType(objects, "arc")) {
        const geometry = (0, geometry_1.getArcGeometry)(object, objects);
        if (!geometry) {
            continue;
        }
        const center = (0, viewport_1.worldToScreen)(geometry.center, viewport);
        const radiusPx = geometry.radius * viewport.scale;
        const distancePx = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);
        const pointerAngle = normalizedAngleDegrees(geometry.center, worldPoint);
        if (Math.abs(distancePx - radiusPx) <= tolerancePx &&
            isAngleOnArc(pointerAngle, geometry.startAngleDegrees, geometry.endAngleDegrees, object.direction)) {
            return { object, objectId: object.id, type: "arc" };
        }
    }
    for (const object of visibleObjectsByType(objects, "line")) {
        const pointA = getPoint(object.pointAId, objects);
        const pointB = getPoint(object.pointBId, objects);
        if (pointA &&
            pointB &&
            distanceToInfiniteLinePx(screenPoint, (0, viewport_1.worldToScreen)(pointA, viewport), (0, viewport_1.worldToScreen)(pointB, viewport)) <= tolerancePx) {
            return { object, objectId: object.id, type: "line" };
        }
    }
    for (const object of visibleObjectsByType(objects, "ray")) {
        const start = getPoint(object.startPointId, objects);
        const through = getPoint(object.throughPointId, objects);
        if (start &&
            through &&
            distanceToRayPx(screenPoint, (0, viewport_1.worldToScreen)(start, viewport), (0, viewport_1.worldToScreen)(through, viewport)) <= tolerancePx) {
            return { object, objectId: object.id, type: "ray" };
        }
    }
    for (const object of visibleObjectsByType(objects, "angle")) {
        const pointA = getPoint(object.pointAId, objects);
        const vertex = getPoint(object.vertexPointId, objects);
        const pointC = getPoint(object.pointCId, objects);
        if (!pointA || !vertex || !pointC) {
            continue;
        }
        const radius = Math.max(0.15, object.radius);
        const toleranceWorld = tolerancePx / viewport.scale;
        const radialDistance = Math.abs((0, geometry_1.distance)(vertex, worldPoint) - radius);
        const targetAngle = (0, geometry_1.angleRadians)(pointA, vertex, pointC);
        const splitAngle = (0, geometry_1.angleRadians)(pointA, vertex, worldPoint) +
            (0, geometry_1.angleRadians)(worldPoint, vertex, pointC);
        if (radialDistance <= toleranceWorld &&
            Math.abs(splitAngle - targetAngle) <= (3 * Math.PI) / 180) {
            return { object, objectId: object.id, type: "angle" };
        }
    }
    return null;
}
