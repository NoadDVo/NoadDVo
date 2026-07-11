"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearBoundaryFillCache = clearBoundaryFillCache;
exports.getBoundaryFillCacheStats = getBoundaryFillCacheStats;
exports.collectBoundaryPrimitives = collectBoundaryPrimitives;
exports.computeIntersections = computeIntersections;
exports.splitPrimitivesAtIntersections = splitPrimitivesAtIntersections;
exports.buildDirectedEdges = buildDirectedEdges;
exports.traceClosedFaces = traceClosedFaces;
exports.selectFaceContainingPoint = selectFaceContainingPoint;
exports.getBoundaryFillFaces = getBoundaryFillFaces;
exports.getFaces = getFaces;
exports.getSelectableBoundaryFaces = getSelectableBoundaryFaces;
const math_1 = require("../math");
const derivedGeometry_1 = require("../derivedGeometry");
const GEOMETRY_EPSILON = 1e-6;
const NODE_PRECISION = 1e6;
const MAX_LOOP_EDGES = 48;
const DEFAULT_LIMITS = {
    maxDirectedEdges: 700,
    maxFaces: 300,
    maxIntersections: 1800,
    maxPrimitives: 180,
    maxTraversalSteps: 18_000,
    timeoutMs: 48,
};
const faceCache = new Map();
let cacheHits = 0;
let cacheMisses = 0;
function clean(value) {
    const rounded = Number(value.toFixed(9));
    return Object.is(rounded, -0) ? 0 : rounded;
}
function mergeLimits(limits) {
    return {
        ...DEFAULT_LIMITS,
        ...limits,
    };
}
function tooComplexDiagnostic(message = "Region detection is too complex.") {
    return {
        code: "REGION_TOO_COMPLEX",
        message,
        severity: "warning",
    };
}
function tooManyIntersectionsDiagnostic() {
    return {
        code: "TOO_MANY_INTERSECTIONS",
        message: "Too many intersections.",
        severity: "warning",
    };
}
function noStableFaceDiagnostic() {
    return {
        code: "NO_STABLE_CLOSED_FACE",
        message: "No stable closed face found.",
        severity: "info",
    };
}
function isBudgetExpired(budget) {
    return Date.now() > budget.deadline || budget.traversalSteps > budget.limits.maxTraversalSteps;
}
function objectSignature(object) {
    const base = `${object.id}:${object.type}:${object.updatedAt}:${object.visible}:${object.locked}`;
    switch (object.type) {
        case "point":
            return `${base}:${object.x},${object.y}`;
        case "segment":
        case "vector":
            return `${base}:${object.startPointId}:${object.endPointId}`;
        case "line":
            return `${base}:${object.pointAId}:${object.pointBId}`;
        case "ray":
            return `${base}:${object.startPointId}:${object.throughPointId}`;
        case "circle":
            return `${base}:${object.dependencies.join(",")}:${"radius" in object ? object.radius : ""}`;
        case "arc":
            return `${base}:${object.centerPointId}:${object.startPointId}:${object.endPointId}:${object.direction}`;
        case "polygon":
            return `${base}:${object.pointIds.join(",")}`;
        default:
            return base;
    }
}
function sceneSignature(objects, limits) {
    return [
        `limits:${limits.maxPrimitives}:${limits.maxIntersections}:${limits.maxDirectedEdges}:${limits.maxFaces}:${limits.maxTraversalSteps}:${limits.timeoutMs}`,
        ...Object.values(objects)
            .sort((first, second) => first.id.localeCompare(second.id))
            .map(objectSignature),
    ].join("|");
}
function clearBoundaryFillCache() {
    faceCache.clear();
    cacheHits = 0;
    cacheMisses = 0;
}
function getBoundaryFillCacheStats() {
    return {
        entries: faceCache.size,
        hits: cacheHits,
        misses: cacheMisses,
    };
}
function nodeKey(point) {
    return `${Math.round(point.x * NODE_PRECISION) / NODE_PRECISION},${Math.round(point.y * NODE_PRECISION) / NODE_PRECISION}`;
}
function uniqueByPoint(points) {
    const sorted = [...points].sort((first, second) => first.parameter - second.parameter);
    const unique = [];
    for (const point of sorted) {
        const previous = unique[unique.length - 1];
        if (!previous || (0, math_1.distance)(previous.point, point.point) > GEOMETRY_EPSILON) {
            unique.push(point);
        }
    }
    return unique;
}
function normalizeAngle(degrees) {
    const value = degrees % 360;
    return value < 0 ? value + 360 : value;
}
function pointAngle(center, point) {
    return normalizeAngle((Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI);
}
function angularDelta(start, end, direction = "counterclockwise") {
    if (direction === "clockwise") {
        return -((start - end + 360) % 360 || 360);
    }
    return (end - start + 360) % 360 || 360;
}
function angleOnArc(angle, start, end, direction) {
    const total = Math.abs(angularDelta(start, end, direction));
    const partial = direction === "clockwise"
        ? Math.abs(angularDelta(start, angle, "clockwise"))
        : Math.abs(angularDelta(start, angle, "counterclockwise"));
    return partial <= total + 1e-5;
}
function pointAtLinear(primitive, parameter) {
    const origin = primitive.origin ?? { x: 0, y: 0 };
    const vector = primitive.vector ?? { x: 0, y: 0 };
    return {
        x: clean(origin.x + vector.x * parameter),
        y: clean(origin.y + vector.y * parameter),
    };
}
function pointAtCircle(primitive, parameter) {
    const center = primitive.center ?? { x: 0, y: 0 };
    const radius = primitive.radius ?? 0;
    const radians = (parameter * Math.PI) / 180;
    return {
        x: clean(center.x + Math.cos(radians) * radius),
        y: clean(center.y + Math.sin(radians) * radius),
    };
}
function parameterForPoint(primitive, point) {
    if (primitive.kind === "circular") {
        return pointAngle(primitive.center ?? { x: 0, y: 0 }, point);
    }
    const origin = primitive.origin ?? { x: 0, y: 0 };
    const vector = primitive.vector ?? { x: 0, y: 0 };
    const lengthSquared = vector.x * vector.x + vector.y * vector.y;
    return lengthSquared <= math_1.EPSILON
        ? 0
        : ((point.x - origin.x) * vector.x + (point.y - origin.y) * vector.y) / lengthSquared;
}
function inLinearDomain(primitive, parameter) {
    const domain = primitive.domain;
    return Boolean(domain && parameter >= domain.min - 1e-6 && parameter <= domain.max + 1e-6);
}
function inCircularDomain(primitive, parameter) {
    if (primitive.edgeKind === "circle") {
        return true;
    }
    const domain = primitive.domain;
    return Boolean(domain && angleOnArc(parameter, domain.min, domain.max, primitive.direction ?? "counterclockwise"));
}
function pointOnPrimitive(primitive, point) {
    const parameter = parameterForPoint(primitive, point);
    return primitive.kind === "linear"
        ? inLinearDomain(primitive, parameter)
        : inCircularDomain(primitive, parameter);
}
function createLinearPrimitive({ dependencies, edgeKind, end, id, object, start, }) {
    const vector = { x: end.x - start.x, y: end.y - start.y };
    if (Math.hypot(vector.x, vector.y) <= GEOMETRY_EPSILON) {
        return null;
    }
    return {
        dependencies,
        domain: { max: 1, min: 0 },
        edgeKind,
        id,
        kind: "linear",
        objectId: object.id,
        origin: start,
        style: object.style,
        vector,
    };
}
function collectBoundaryPrimitives(objects) {
    const primitives = [];
    for (const object of Object.values(objects)) {
        if (!object.visible || object.locked) {
            continue;
        }
        if (object.type === "segment" || object.type === "vector") {
            const start = (0, derivedGeometry_1.getPointObject)(objects, object.startPointId);
            const end = (0, derivedGeometry_1.getPointObject)(objects, object.endPointId);
            const primitive = start && end
                ? createLinearPrimitive({
                    dependencies: [object.id, object.startPointId, object.endPointId],
                    edgeKind: "segment",
                    end,
                    id: object.id,
                    object,
                    start,
                })
                : null;
            if (primitive) {
                primitives.push(primitive);
            }
            continue;
        }
        if (object.type === "polygon") {
            const points = object.pointIds.map((pointId) => (0, derivedGeometry_1.getPointObject)(objects, pointId));
            if (points.some((point) => point === null)) {
                continue;
            }
            const polygonPoints = points.filter((point) => Boolean(point));
            for (let index = 0; index < polygonPoints.length; index += 1) {
                const start = polygonPoints[index];
                const end = polygonPoints[(index + 1) % polygonPoints.length];
                if (!start || !end) {
                    continue;
                }
                const primitive = createLinearPrimitive({
                    dependencies: [object.id, start.id, end.id],
                    edgeKind: "polygon-edge",
                    end,
                    id: `${object.id}:edge:${index}`,
                    object,
                    start,
                });
                if (primitive) {
                    primitives.push(primitive);
                }
            }
            continue;
        }
        if (object.type === "line") {
            const pointA = (0, derivedGeometry_1.getPointObject)(objects, object.pointAId);
            const pointB = (0, derivedGeometry_1.getPointObject)(objects, object.pointBId);
            if (!pointA || !pointB || (0, math_1.distance)(pointA, pointB) <= GEOMETRY_EPSILON) {
                continue;
            }
            primitives.push({
                dependencies: [object.id, object.pointAId, object.pointBId],
                domain: { max: Number.POSITIVE_INFINITY, min: Number.NEGATIVE_INFINITY },
                edgeKind: "line",
                id: object.id,
                kind: "linear",
                objectId: object.id,
                origin: pointA,
                style: object.style,
                vector: { x: pointB.x - pointA.x, y: pointB.y - pointA.y },
            });
            continue;
        }
        if (object.type === "ray") {
            const start = (0, derivedGeometry_1.getPointObject)(objects, object.startPointId);
            const through = (0, derivedGeometry_1.getPointObject)(objects, object.throughPointId);
            if (!start || !through || (0, math_1.distance)(start, through) <= GEOMETRY_EPSILON) {
                continue;
            }
            primitives.push({
                dependencies: [object.id, object.startPointId, object.throughPointId],
                domain: { max: Number.POSITIVE_INFINITY, min: 0 },
                edgeKind: "ray",
                id: object.id,
                kind: "linear",
                objectId: object.id,
                origin: start,
                style: object.style,
                vector: { x: through.x - start.x, y: through.y - start.y },
            });
            continue;
        }
        if (object.type === "circle") {
            const geometry = (0, derivedGeometry_1.getCircleGeometry)(object, objects);
            if (!geometry || geometry.radius <= GEOMETRY_EPSILON) {
                continue;
            }
            primitives.push({
                center: geometry.center,
                dependencies: [object.id, ...object.dependencies],
                edgeKind: "circle",
                id: object.id,
                kind: "circular",
                objectId: object.id,
                radius: geometry.radius,
                style: object.style,
            });
            continue;
        }
        if (object.type === "arc") {
            const geometry = (0, derivedGeometry_1.getArcGeometry)(object, objects);
            if (!geometry) {
                continue;
            }
            primitives.push({
                center: geometry.center,
                dependencies: [object.id, object.centerPointId, object.startPointId, object.endPointId],
                direction: object.direction,
                domain: {
                    max: geometry.endAngleDegrees,
                    min: geometry.startAngleDegrees,
                },
                edgeKind: "arc",
                id: object.id,
                kind: "circular",
                objectId: object.id,
                radius: geometry.radius,
                style: object.style,
            });
        }
    }
    return primitives;
}
function linearLinearIntersections(first, second) {
    const firstOrigin = first.origin ?? { x: 0, y: 0 };
    const secondOrigin = second.origin ?? { x: 0, y: 0 };
    const firstVector = first.vector ?? { x: 0, y: 0 };
    const secondVector = second.vector ?? { x: 0, y: 0 };
    const denominator = (0, math_1.cross)(firstVector, secondVector);
    if (Math.abs(denominator) <= GEOMETRY_EPSILON) {
        return [];
    }
    const delta = { x: secondOrigin.x - firstOrigin.x, y: secondOrigin.y - firstOrigin.y };
    const firstParameter = (0, math_1.cross)(delta, secondVector) / denominator;
    const secondParameter = (0, math_1.cross)(delta, firstVector) / denominator;
    if (!inLinearDomain(first, firstParameter) || !inLinearDomain(second, secondParameter)) {
        return [];
    }
    return [pointAtLinear(first, firstParameter)];
}
function linearCircleIntersections(linear, circular) {
    const origin = linear.origin ?? { x: 0, y: 0 };
    const vector = linear.vector ?? { x: 0, y: 0 };
    const center = circular.center ?? { x: 0, y: 0 };
    const radius = circular.radius ?? 0;
    const dx = origin.x - center.x;
    const dy = origin.y - center.y;
    const a = vector.x * vector.x + vector.y * vector.y;
    const b = 2 * (dx * vector.x + dy * vector.y);
    const c = dx * dx + dy * dy - radius * radius;
    const discriminant = b * b - 4 * a * c;
    if (discriminant < -GEOMETRY_EPSILON || a <= GEOMETRY_EPSILON) {
        return [];
    }
    const root = Math.sqrt(Math.max(0, discriminant));
    const parameters = [(-b - root) / (2 * a), (-b + root) / (2 * a)];
    return parameters
        .map((parameter) => pointAtLinear(linear, parameter))
        .filter((point, index, points) => inLinearDomain(linear, parameterForPoint(linear, point)) &&
        pointOnPrimitive(circular, point) &&
        points.findIndex((candidate) => (0, math_1.distance)(candidate, point) <= GEOMETRY_EPSILON) === index);
}
function circleCircleIntersections(first, second) {
    const firstCenter = first.center ?? { x: 0, y: 0 };
    const secondCenter = second.center ?? { x: 0, y: 0 };
    const firstRadius = first.radius ?? 0;
    const secondRadius = second.radius ?? 0;
    const centerDistance = (0, math_1.distance)(firstCenter, secondCenter);
    if (centerDistance <= GEOMETRY_EPSILON ||
        centerDistance > firstRadius + secondRadius + GEOMETRY_EPSILON ||
        centerDistance < Math.abs(firstRadius - secondRadius) - GEOMETRY_EPSILON) {
        return [];
    }
    const a = (firstRadius * firstRadius - secondRadius * secondRadius + centerDistance * centerDistance) / (2 * centerDistance);
    const heightSquared = firstRadius * firstRadius - a * a;
    if (heightSquared < -GEOMETRY_EPSILON) {
        return [];
    }
    const height = Math.sqrt(Math.max(0, heightSquared));
    const ux = (secondCenter.x - firstCenter.x) / centerDistance;
    const uy = (secondCenter.y - firstCenter.y) / centerDistance;
    const base = {
        x: firstCenter.x + a * ux,
        y: firstCenter.y + a * uy,
    };
    const points = [
        { x: clean(base.x - uy * height), y: clean(base.y + ux * height) },
        { x: clean(base.x + uy * height), y: clean(base.y - ux * height) },
    ];
    return points.filter((point, index) => pointOnPrimitive(first, point) &&
        pointOnPrimitive(second, point) &&
        points.findIndex((candidate) => (0, math_1.distance)(candidate, point) <= GEOMETRY_EPSILON) === index);
}
function computeIntersections(primitives) {
    return computeIntersectionsWithBudget(primitives) ?? new Map();
}
function computeIntersectionsWithBudget(primitives, budget) {
    const splitMap = new Map();
    let intersectionCount = 0;
    for (const primitive of primitives) {
        splitMap.set(primitive.id, []);
        if (primitive.kind === "linear" && primitive.domain) {
            if (Number.isFinite(primitive.domain.min)) {
                splitMap.get(primitive.id)?.push({
                    parameter: primitive.domain.min,
                    point: pointAtLinear(primitive, primitive.domain.min),
                });
            }
            if (Number.isFinite(primitive.domain.max)) {
                splitMap.get(primitive.id)?.push({
                    parameter: primitive.domain.max,
                    point: pointAtLinear(primitive, primitive.domain.max),
                });
            }
        }
        if (primitive.kind === "circular" && primitive.edgeKind === "arc" && primitive.domain) {
            splitMap.get(primitive.id)?.push({ parameter: primitive.domain.min, point: pointAtCircle(primitive, primitive.domain.min) }, { parameter: primitive.domain.max, point: pointAtCircle(primitive, primitive.domain.max) });
        }
    }
    for (let firstIndex = 0; firstIndex < primitives.length; firstIndex += 1) {
        for (let secondIndex = firstIndex + 1; secondIndex < primitives.length; secondIndex += 1) {
            if (budget && isBudgetExpired(budget)) {
                return null;
            }
            const first = primitives[firstIndex];
            const second = primitives[secondIndex];
            if (!first || !second) {
                continue;
            }
            const points = first.kind === "linear" && second.kind === "linear"
                ? linearLinearIntersections(first, second)
                : first.kind === "linear" && second.kind === "circular"
                    ? linearCircleIntersections(first, second)
                    : first.kind === "circular" && second.kind === "linear"
                        ? linearCircleIntersections(second, first)
                        : circleCircleIntersections(first, second);
            for (const point of points) {
                intersectionCount += 1;
                if (budget && intersectionCount > budget.limits.maxIntersections) {
                    return null;
                }
                splitMap.get(first.id)?.push({ parameter: parameterForPoint(first, point), point });
                splitMap.get(second.id)?.push({ parameter: parameterForPoint(second, point), point });
            }
        }
    }
    return new Map([...splitMap.entries()].map(([id, points]) => [id, uniqueByPoint(points)]));
}
function sampleCircularPiece(primitive, startParameter, endParameter) {
    const direction = primitive.direction ?? "counterclockwise";
    const delta = angularDelta(startParameter, endParameter, direction);
    const steps = Math.max(4, Math.ceil(Math.abs(delta) / 10));
    return Array.from({ length: steps + 1 }, (_, index) => pointAtCircle(primitive, startParameter + (delta * index) / steps));
}
function sampleLinearPiece(primitive, startParameter, endParameter) {
    return [pointAtLinear(primitive, startParameter), pointAtLinear(primitive, endParameter)];
}
function createPiece(primitive, start, end, index) {
    if ((0, math_1.distance)(start.point, end.point) <= GEOMETRY_EPSILON) {
        return null;
    }
    const samples = primitive.kind === "circular"
        ? sampleCircularPiece(primitive, start.parameter, end.parameter)
        : sampleLinearPiece(primitive, start.parameter, end.parameter);
    return {
        dependencies: primitive.dependencies,
        edgeKind: primitive.edgeKind === "circle" ? "arc" : primitive.edgeKind,
        end: end.point,
        endParameter: end.parameter,
        id: `${primitive.id}:piece:${index}`,
        objectId: primitive.objectId,
        samples,
        start: start.point,
        startParameter: start.parameter,
        style: primitive.style,
    };
}
function splitPrimitivesAtIntersections(primitives, intersections) {
    const pieces = [];
    for (const primitive of primitives) {
        const points = uniqueByPoint(intersections.get(primitive.id) ?? []);
        if (primitive.kind === "linear") {
            if (points.length < 2) {
                continue;
            }
            for (let index = 0; index < points.length - 1; index += 1) {
                const start = points[index];
                const end = points[index + 1];
                const piece = start && end
                    ? createPiece(primitive, start, end, index)
                    : null;
                if (piece) {
                    pieces.push(piece);
                }
            }
            continue;
        }
        if (primitive.edgeKind === "circle") {
            if (points.length < 2) {
                continue;
            }
            for (let index = 0; index < points.length; index += 1) {
                const start = points[index];
                const end = points[(index + 1) % points.length];
                const piece = start && end ? createPiece(primitive, start, end, index) : null;
                if (piece) {
                    pieces.push(piece);
                }
            }
            continue;
        }
        if (points.length < 2) {
            continue;
        }
        for (let index = 0; index < points.length - 1; index += 1) {
            const start = points[index];
            const end = points[index + 1];
            const piece = start && end
                ? createPiece(primitive, start, end, index)
                : null;
            if (piece) {
                pieces.push(piece);
            }
        }
    }
    return pieces;
}
function reverseSamples(samples) {
    return [...samples].reverse();
}
function boundaryEdgeForPiece(piece, direction) {
    const sourcePrimitiveId = piece.id.split(":piece:")[0] ?? piece.id;
    return direction === "forward"
        ? {
            direction: "forward",
            edgeKind: piece.edgeKind,
            endParameter: piece.endParameter,
            objectId: piece.objectId,
            sourcePrimitiveId,
            startParameter: piece.startParameter,
        }
        : {
            direction: "reverse",
            edgeKind: piece.edgeKind,
            endParameter: piece.startParameter,
            objectId: piece.objectId,
            sourcePrimitiveId,
            startParameter: piece.endParameter,
        };
}
function buildDirectedEdges(pieces) {
    return pieces.flatMap((piece) => {
        const forward = {
            angle: Math.atan2(piece.end.y - piece.start.y, piece.end.x - piece.start.x),
            baseId: piece.id,
            dependencies: piece.dependencies,
            edge: boundaryEdgeForPiece(piece, "forward"),
            from: nodeKey(piece.start),
            id: `${piece.id}:forward`,
            samples: piece.samples,
            style: piece.style,
            to: nodeKey(piece.end),
        };
        const reverse = {
            angle: Math.atan2(piece.start.y - piece.end.y, piece.start.x - piece.end.x),
            baseId: piece.id,
            dependencies: piece.dependencies,
            edge: boundaryEdgeForPiece(piece, "reverse"),
            from: nodeKey(piece.end),
            id: `${piece.id}:reverse`,
            samples: reverseSamples(piece.samples),
            style: piece.style,
            to: nodeKey(piece.start),
        };
        return [forward, reverse];
    });
}
function loopSamples(edges) {
    return edges.flatMap((edge, index) => index === 0 ? edge.samples : edge.samples.slice(1));
}
function polygonCentroid(points) {
    const area = (0, math_1.polygonArea)(points);
    if (Math.abs(area) <= GEOMETRY_EPSILON) {
        const count = Math.max(1, points.length);
        const sum = points.reduce((total, point) => ({
            x: total.x + point.x,
            y: total.y + point.y,
        }), { x: 0, y: 0 });
        return {
            x: sum.x / count,
            y: sum.y / count,
        };
    }
    let x = 0;
    let y = 0;
    for (let index = 0; index < points.length; index += 1) {
        const current = points[index];
        const next = points[(index + 1) % points.length];
        if (!current || !next) {
            continue;
        }
        const factor = current.x * next.y - next.x * current.y;
        x += (current.x + next.x) * factor;
        y += (current.y + next.y) * factor;
    }
    return {
        x: x / (6 * area),
        y: y / (6 * area),
    };
}
function canonicalCycleKey(edges) {
    const ids = edges.map((edge) => edge.id);
    const rotations = ids.map((_, index) => [...ids.slice(index), ...ids.slice(0, index)].join("|"));
    const reversed = [...ids].reverse();
    const reverseRotations = reversed.map((_, index) => [...reversed.slice(index), ...reversed.slice(0, index)].join("|"));
    return [...rotations, ...reverseRotations].sort()[0] ?? ids.join("|");
}
function traceClosedFaces(edges) {
    return traceClosedFacesWithBudget(edges) ?? [];
}
function traceClosedFacesWithBudget(edges, budget) {
    const outgoing = new Map();
    const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
    const cycles = new Map();
    for (const edge of edges) {
        outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
    }
    function walk(start, current, path, visitedNodes) {
        if (budget) {
            budget.traversalSteps += 1;
            if (isBudgetExpired(budget) || cycles.size >= budget.limits.maxFaces) {
                return;
            }
        }
        if (path.length > MAX_LOOP_EDGES) {
            return;
        }
        for (const next of outgoing.get(current.to) ?? []) {
            if (next.baseId === current.baseId) {
                continue;
            }
            if (next.to === start.from) {
                const cycle = [...path, next];
                const samples = loopSamples(cycle);
                const area = Math.abs((0, math_1.polygonArea)(samples));
                if (area > GEOMETRY_EPSILON) {
                    cycles.set(canonicalCycleKey(cycle), cycle);
                }
                continue;
            }
            if (visitedNodes.has(next.to)) {
                continue;
            }
            walk(start, next, [...path, next], new Set([...visitedNodes, next.to]));
        }
    }
    for (const edge of edgeById.values()) {
        if (budget && isBudgetExpired(budget)) {
            return null;
        }
        walk(edge, edge, [edge], new Set([edge.from, edge.to]));
        if (budget && cycles.size >= budget.limits.maxFaces) {
            return null;
        }
    }
    return [...cycles.values()]
        .map((cycle, index) => {
        const samples = loopSamples(cycle);
        const dependencies = Array.from(new Set(cycle.flatMap((edge) => edge.dependencies)));
        const firstEdge = cycle[0];
        return {
            area: Math.abs((0, math_1.polygonArea)(samples)),
            centroid: polygonCentroid(samples),
            dependencies,
            edgeCount: cycle.length,
            id: `face-${index}`,
            loopEdges: cycle.map((edge) => edge.edge),
            name: "Filled Boundary Region",
            samplePoints: samples,
            source: {
                id: firstEdge?.edge.objectId ?? "boundary",
                style: firstEdge?.style ?? {
                    dash: "solid",
                    fill: "transparent",
                    fillOpacity: 0,
                    labelPosition: "above-right",
                    labelSize: 12,
                    labelVisible: true,
                    pointSize: 5,
                    stroke: "#0b0f14",
                    strokeOpacity: 1,
                    strokeWidth: 2,
                },
            },
        };
    })
        .filter((face) => face.area > GEOMETRY_EPSILON);
}
function selectFaceContainingPoint(point, faces, _objects) {
    return [...getFacesContainingPoint(point, faces)]
        .sort((first, second) => {
        const areaDelta = first.area - second.area;
        return Math.abs(areaDelta) <= GEOMETRY_EPSILON ? first.id.localeCompare(second.id) : areaDelta;
    })[0] ?? null;
}
function getFacesContainingPoint(point, faces) {
    return faces.filter((face) => face.samplePoints.length >= 3 &&
        ((0, derivedGeometry_1.isPointInPolygon)(point, face.samplePoints) || pointNearPolyline(point, face.samplePoints)));
}
function pointSegmentDistance(point, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const parameter = lengthSquared <= GEOMETRY_EPSILON
        ? 0
        : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
    return (0, math_1.distance)(point, {
        x: start.x + dx * parameter,
        y: start.y + dy * parameter,
    });
}
function pointNearPolyline(point, points) {
    const tolerance = 0.08;
    for (let index = 0; index < points.length; index += 1) {
        const start = points[index];
        const end = points[(index + 1) % points.length];
        if (start && end && pointSegmentDistance(point, start, end) <= tolerance) {
            return true;
        }
    }
    return false;
}
function sampleFullCircle(center, radius) {
    return Array.from({ length: 37 }, (_, index) => {
        const radians = ((index * 10) * Math.PI) / 180;
        return {
            x: center.x + Math.cos(radians) * radius,
            y: center.y + Math.sin(radians) * radius,
        };
    });
}
function standaloneCircleFaces(primitives, intersections) {
    return primitives
        .filter((primitive) => primitive.edgeKind === "circle" && primitive.center && primitive.radius)
        .filter((primitive) => (intersections.get(primitive.id) ?? []).length === 0)
        .sort((first, second) => (first.radius ?? 0) - (second.radius ?? 0))
        .map((circle) => ({
        area: Math.PI * (circle.radius ?? 0) * (circle.radius ?? 0),
        centroid: circle.center ?? { x: 0, y: 0 },
        dependencies: circle.dependencies,
        edgeCount: 1,
        id: `face-circle-${circle.objectId}`,
        loopEdges: [
            {
                direction: "forward",
                edgeKind: "circle",
                endParameter: 360,
                objectId: circle.objectId,
                startParameter: 0,
            },
        ],
        name: "Filled Circle",
        samplePoints: circle.center && circle.radius ? sampleFullCircle(circle.center, circle.radius) : [],
        source: {
            id: circle.objectId,
            style: circle.style,
        },
    }));
}
function getBoundaryFillFaces(objects, options = {}) {
    const limits = mergeLimits(options.limits);
    const cacheKey = sceneSignature(objects, limits);
    if (options.useCache !== false) {
        const cached = faceCache.get(cacheKey);
        if (cached) {
            cacheHits += 1;
            return cached;
        }
    }
    cacheMisses += 1;
    const primitives = collectBoundaryPrimitives(objects);
    const budget = {
        deadline: Date.now() + limits.timeoutMs,
        limits,
        traversalSteps: 0,
    };
    if (primitives.length > limits.maxPrimitives) {
        const result = {
            diagnostics: [
                tooComplexDiagnostic(`Region detection is too complex (${primitives.length} primitives).`),
            ],
            faces: [],
        };
        return cacheBoundaryFillResult(cacheKey, result, options.useCache !== false);
    }
    const maxPairs = (primitives.length * (primitives.length - 1)) / 2;
    if (maxPairs > limits.maxIntersections) {
        const result = {
            diagnostics: [tooManyIntersectionsDiagnostic()],
            faces: [],
        };
        return cacheBoundaryFillResult(cacheKey, result, options.useCache !== false);
    }
    const intersections = computeIntersectionsWithBudget(primitives, budget);
    if (!intersections) {
        const result = {
            diagnostics: [tooManyIntersectionsDiagnostic()],
            faces: [],
        };
        return cacheBoundaryFillResult(cacheKey, result, options.useCache !== false);
    }
    const pieces = splitPrimitivesAtIntersections(primitives, intersections);
    const edges = buildDirectedEdges(pieces);
    if (edges.length > limits.maxDirectedEdges) {
        const result = {
            diagnostics: [
                tooComplexDiagnostic(`Region detection is too complex (${edges.length} directed edges).`),
            ],
            faces: [],
        };
        return cacheBoundaryFillResult(cacheKey, result, options.useCache !== false);
    }
    const tracedFaces = traceClosedFacesWithBudget(edges, budget);
    if (!tracedFaces) {
        const result = {
            diagnostics: [
                tooComplexDiagnostic(),
                noStableFaceDiagnostic(),
            ],
            faces: [],
        };
        return cacheBoundaryFillResult(cacheKey, result, options.useCache !== false);
    }
    const faces = [
        ...tracedFaces,
        ...standaloneCircleFaces(primitives, intersections),
    ]
        .sort((first, second) => {
        const areaDelta = first.area - second.area;
        return Math.abs(areaDelta) <= GEOMETRY_EPSILON ? first.id.localeCompare(second.id) : areaDelta;
    });
    const diagnostics = [];
    if (faces.length === 0) {
        diagnostics.push({
            code: "NO_CLOSED_FACE",
            message: "No closed region found.",
            severity: "info",
        });
    }
    if (faces.length === 0 && pieces.length === 0 && primitives.length > 0) {
        diagnostics.push({
            code: "BOUNDARY_OPEN",
            message: "Boundary is open.",
            severity: "warning",
        });
    }
    if (faces.some((candidate) => candidate.area <= GEOMETRY_EPSILON * 100)) {
        diagnostics.push({
            code: "REGION_UNSTABLE",
            message: "Region too small / unstable.",
            severity: "warning",
        });
    }
    return cacheBoundaryFillResult(cacheKey, {
        diagnostics,
        faces,
    }, options.useCache !== false);
}
function cacheBoundaryFillResult(cacheKey, result, useCache) {
    if (useCache) {
        if (faceCache.size > 12) {
            const firstKey = faceCache.keys().next().value;
            if (firstKey) {
                faceCache.delete(firstKey);
            }
        }
        faceCache.set(cacheKey, result);
    }
    return result;
}
function getFaces(objects, options) {
    return getBoundaryFillFaces(objects, options);
}
function getSelectableBoundaryFaces(point, objects, options) {
    const result = getBoundaryFillFaces(objects, options);
    const candidates = [...getFacesContainingPoint(point, result.faces)]
        .sort((first, second) => {
        const areaDelta = first.area - second.area;
        return Math.abs(areaDelta) <= GEOMETRY_EPSILON ? first.id.localeCompare(second.id) : areaDelta;
    });
    const diagnostics = [...result.diagnostics];
    if (result.faces.length > 0 && candidates.length === 0) {
        diagnostics.push({
            code: "NO_REGION_AT_POINTER",
            message: "No closed region under pointer.",
            severity: "info",
        });
    }
    if (candidates.length > 1) {
        diagnostics.push({
            code: "MULTIPLE_REGIONS",
            message: "Press Tab to cycle regions.",
            severity: "info",
        });
    }
    return {
        candidates,
        diagnostics,
    };
}
