"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textAlignments = exports.textModes = void 0;
exports.getTextPlacementOptionsForTarget = getTextPlacementOptionsForTarget;
exports.getDefaultTextPlacementForTarget = getDefaultTextPlacementForTarget;
exports.isTextAttachmentTarget = isTextAttachmentTarget;
exports.getTextFontSize = getTextFontSize;
exports.getTextRotation = getTextRotation;
exports.getTextAlignment = getTextAlignment;
exports.getTextOpacity = getTextOpacity;
exports.getTextAttachment = getTextAttachment;
exports.getTextPosition = getTextPosition;
exports.normalizeTextMode = normalizeTextMode;
const math_1 = require("./math");
const derivedGeometry_1 = require("./derivedGeometry");
exports.textModes = [
    "plain",
    "math",
    "latex",
    "coordinate-label",
    "object-label",
    "measurement-label",
];
exports.textAlignments = [
    "left",
    "center",
    "right",
];
const pointPlacements = [
    "above",
    "below",
    "left",
    "right",
    "above-left",
    "above-right",
    "below-left",
    "below-right",
];
const linearPlacements = [
    "midpoint",
    "above",
    "below",
    "left",
    "right",
    "start",
    "end",
];
const circlePlacements = [
    "center",
    "top",
    "bottom",
    "left",
    "right",
];
const polygonPlacements = [
    "center",
    "edge-midpoint",
    "vertex",
    "inside",
];
const anglePlacements = [
    "near-arc",
    "inside-angle",
    "outside-angle",
];
function getTextPlacementOptionsForTarget(target) {
    if (!target) {
        return [];
    }
    if (target.type === "point") {
        return pointPlacements;
    }
    if (target.type === "segment" ||
        target.type === "line" ||
        target.type === "ray" ||
        target.type === "vector") {
        return linearPlacements;
    }
    if (target.type === "circle") {
        return circlePlacements;
    }
    if (target.type === "polygon") {
        return polygonPlacements;
    }
    if (target.type === "angle") {
        return anglePlacements;
    }
    return [];
}
function getDefaultTextPlacementForTarget(target) {
    return getTextPlacementOptionsForTarget(target)[0] ?? "above";
}
function isTextAttachmentTarget(target) {
    return getTextPlacementOptionsForTarget(target).length > 0;
}
function metadataNumber(object, key, fallback) {
    const value = object.metadata?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function metadataString(object, key, values, fallback) {
    const value = object.metadata?.[key];
    return typeof value === "string" && values.includes(value)
        ? value
        : fallback;
}
function getTextFontSize(object) {
    return Math.max(6, metadataNumber(object, "fontSize", object.style.labelSize));
}
function getTextRotation(object) {
    return metadataNumber(object, "rotation", 0);
}
function getTextAlignment(object) {
    return metadataString(object, "alignment", exports.textAlignments, "left");
}
function getTextOpacity(object) {
    return Math.min(1, Math.max(0, metadataNumber(object, "opacity", object.style.strokeOpacity)));
}
function metadataPoint(object, key) {
    const value = object.metadata?.[key];
    if (typeof value === "object" &&
        value !== null &&
        "x" in value &&
        "y" in value &&
        typeof value.x === "number" &&
        Number.isFinite(value.x) &&
        typeof value.y === "number" &&
        Number.isFinite(value.y)) {
        return {
            x: value.x,
            y: value.y,
        };
    }
    return null;
}
function getTextAttachment(object) {
    const targetObjectId = object.metadata?.targetObjectId;
    const placement = object.metadata?.placement;
    if (typeof targetObjectId === "string" &&
        typeof placement === "string" &&
        isTextPlacement(placement)) {
        const offset = metadataPoint(object, "offset");
        return {
            placement,
            targetObjectId,
            ...(offset ? { offset } : {}),
        };
    }
    return null;
}
function isTextPlacement(value) {
    return [
        ...pointPlacements,
        ...linearPlacements,
        ...circlePlacements,
        ...polygonPlacements,
        ...anglePlacements,
    ].includes(value);
}
function add(point, delta) {
    return {
        x: point.x + delta.x,
        y: point.y + delta.y,
    };
}
function withOffset(point, offset) {
    return offset ? add(point, offset) : point;
}
function pointDelta(placement) {
    const gap = 0.35;
    return {
        x: placement.includes("left") ? -gap : placement.includes("right") ? gap : 0,
        y: placement.includes("below") ? -gap : placement.includes("above") ? gap : 0,
    };
}
function linearEndpoints(target, objects) {
    if (target.type === "segment" || target.type === "vector") {
        const start = (0, derivedGeometry_1.getPointObject)(objects, target.startPointId);
        const end = (0, derivedGeometry_1.getPointObject)(objects, target.endPointId);
        return start && end ? [start, end] : null;
    }
    if (target.type === "ray") {
        const start = (0, derivedGeometry_1.getPointObject)(objects, target.startPointId);
        const end = (0, derivedGeometry_1.getPointObject)(objects, target.throughPointId);
        return start && end ? [start, end] : null;
    }
    if (target.type === "line") {
        const start = (0, derivedGeometry_1.getPointObject)(objects, target.pointAId);
        const end = (0, derivedGeometry_1.getPointObject)(objects, target.pointBId);
        return start && end ? [start, end] : null;
    }
    return null;
}
function midpoint(a, b) {
    return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
    };
}
function normalizedPerpendicular(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.max((0, math_1.distance)(a, b), 1);
    return {
        x: -dy / length,
        y: dx / length,
    };
}
function polygonCenter(points) {
    if (points.length === 0) {
        return { x: 0, y: 0 };
    }
    const signedArea = (0, math_1.polygonArea)(points);
    if (Math.abs(signedArea) <= 1e-9) {
        const sum = points.reduce((acc, point) => add(acc, point), { x: 0, y: 0 });
        return {
            x: sum.x / points.length,
            y: sum.y / points.length,
        };
    }
    let cx = 0;
    let cy = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        if (!current || !next) {
            continue;
        }
        const cross = current.x * next.y - next.x * current.y;
        cx += (current.x + next.x) * cross;
        cy += (current.y + next.y) * cross;
    }
    return {
        x: cx / (6 * signedArea),
        y: cy / (6 * signedArea),
    };
}
function textPositionForAttachment(target, placement, objects) {
    if (target.type === "point") {
        return add(target, pointDelta(placement));
    }
    const linear = linearEndpoints(target, objects);
    if (linear) {
        const [start, end] = linear;
        const middle = midpoint(start, end);
        const normal = normalizedPerpendicular(start, end);
        const gap = 0.35;
        if (placement === "start") {
            return start;
        }
        if (placement === "end") {
            return end;
        }
        if (placement === "above") {
            return add(middle, { x: normal.x * gap, y: normal.y * gap });
        }
        if (placement === "below") {
            return add(middle, { x: -normal.x * gap, y: -normal.y * gap });
        }
        if (placement === "left") {
            return add(middle, { x: -gap, y: 0 });
        }
        if (placement === "right") {
            return add(middle, { x: gap, y: 0 });
        }
        return middle;
    }
    if (target.type === "circle") {
        const circle = (0, derivedGeometry_1.getCircleGeometry)(target, objects);
        if (!circle) {
            return null;
        }
        if (placement === "top") {
            return add(circle.center, { x: 0, y: circle.radius + 0.35 });
        }
        if (placement === "bottom") {
            return add(circle.center, { x: 0, y: -circle.radius - 0.35 });
        }
        if (placement === "left") {
            return add(circle.center, { x: -circle.radius - 0.35, y: 0 });
        }
        if (placement === "right") {
            return add(circle.center, { x: circle.radius + 0.35, y: 0 });
        }
        return circle.center;
    }
    if (target.type === "polygon") {
        const points = (0, derivedGeometry_1.getPolygonPoints)(target, objects);
        if (!points) {
            return null;
        }
        if (placement === "edge-midpoint") {
            const first = points[0];
            const second = points[1];
            return first && second ? midpoint(first, second) : polygonCenter(points);
        }
        if (placement === "vertex") {
            return points[0] ?? polygonCenter(points);
        }
        return polygonCenter(points);
    }
    if (target.type === "angle") {
        const pointA = (0, derivedGeometry_1.getPointObject)(objects, target.pointAId);
        const vertex = (0, derivedGeometry_1.getPointObject)(objects, target.vertexPointId);
        const pointC = (0, derivedGeometry_1.getPointObject)(objects, target.pointCId);
        if (!pointA || !vertex || !pointC) {
            return null;
        }
        const armA = { x: pointA.x - vertex.x, y: pointA.y - vertex.y };
        const armC = { x: pointC.x - vertex.x, y: pointC.y - vertex.y };
        const lenA = Math.max((0, math_1.distance)(pointA, vertex), 1);
        const lenC = Math.max((0, math_1.distance)(pointC, vertex), 1);
        const direction = {
            x: armA.x / lenA + armC.x / lenC,
            y: armA.y / lenA + armC.y / lenC,
        };
        const directionLength = Math.max(Math.hypot(direction.x, direction.y), 1);
        const radius = placement === "outside-angle"
            ? target.radius + 0.5
            : placement === "inside-angle"
                ? Math.max(target.radius * 0.55, 0.25)
                : target.radius + 0.2;
        return {
            x: vertex.x + (direction.x / directionLength) * radius,
            y: vertex.y + (direction.y / directionLength) * radius,
        };
    }
    return null;
}
function getTextPosition(object, objects) {
    const attachment = getTextAttachment(object);
    if (attachment) {
        const target = objects[attachment.targetObjectId];
        const position = target
            ? textPositionForAttachment(target, attachment.placement, objects)
            : null;
        if (position) {
            return withOffset(position, attachment.offset);
        }
    }
    const parentId = object.dependencies[0];
    const parent = parentId ? objects[parentId] : null;
    if (object.metadata?.followObject === true && parent?.type === "point") {
        return {
            x: parent.x + object.x,
            y: parent.y + object.y,
        };
    }
    return {
        x: object.x,
        y: object.y,
    };
}
function normalizeTextMode(value) {
    return exports.textModes.includes(value) ? value : "plain";
}
