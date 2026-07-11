"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGeometryObject = validateGeometryObject;
exports.validateGeometryObjects = validateGeometryObjects;
const math_1 = require("./math");
const dependency_1 = require("./dependency");
const measurements_1 = require("./measurements");
const derivedGeometry_1 = require("./derivedGeometry");
const regionGeometry_1 = require("./regionGeometry");
function invalid(code, message, objectId) {
    const error = {
        code,
        message,
        severity: "error",
        ...(objectId ? { objectId } : {}),
    };
    return { error, valid: false };
}
function valid() {
    return { valid: true };
}
function getPoint(objects, pointId) {
    const object = objects[pointId];
    return object?.type === "point" ? object : null;
}
function validateDistinctPoints(objectId, objects, firstPointId, secondPointId) {
    const first = getPoint(objects, firstPointId);
    const second = getPoint(objects, secondPointId);
    if (!first || !second) {
        return invalid("GEOMETRY_MISSING_POINT", "Referenced point does not exist.", objectId);
    }
    if ((0, math_1.pointsAlmostEqual)(first, second)) {
        return invalid("GEOMETRY_DUPLICATE_POINT", "Geometry requires two distinct points.", objectId);
    }
    return valid();
}
function validatePoint(object) {
    if (!(0, math_1.isFiniteNumber)(object.x) || !(0, math_1.isFiniteNumber)(object.y)) {
        return invalid("GEOMETRY_INVALID_POINT", "Point coordinates must be finite numbers.", object.id);
    }
    return valid();
}
function validateCircle(object, objects) {
    if (object.circleKind === "center-radius") {
        if (!getPoint(objects, object.centerPointId)) {
            return invalid("GEOMETRY_MISSING_CENTER", "Circle center point does not exist.", object.id);
        }
        if (!(0, math_1.isFiniteNumber)(object.radius) || object.radius <= math_1.EPSILON) {
            return invalid("GEOMETRY_INVALID_RADIUS", "Circle radius must be greater than zero.", object.id);
        }
        return valid();
    }
    if (object.circleKind === "center-point") {
        const result = validateDistinctPoints(object.id, objects, object.centerPointId, object.radiusPointId);
        if (!result.valid) {
            return result;
        }
        return valid();
    }
    const pointA = getPoint(objects, object.pointAId);
    const pointB = getPoint(objects, object.pointBId);
    const pointC = getPoint(objects, object.pointCId);
    if (!pointA || !pointB || !pointC) {
        return invalid("GEOMETRY_MISSING_POINT", "Circle through three points requires existing points.", object.id);
    }
    const area = (0, math_1.polygonArea)([pointA, pointB, pointC]);
    if (Math.abs(area) <= math_1.EPSILON) {
        return invalid("GEOMETRY_COLLINEAR_POINTS", "Circle through three points requires non-collinear points.", object.id);
    }
    return valid();
}
function validatePolygon(object, objects) {
    if (object.pointIds.length < 3) {
        return invalid("GEOMETRY_INVALID_POLYGON", "Polygon requires at least three points.", object.id);
    }
    const points = object.pointIds.map((pointId) => getPoint(objects, pointId));
    if (points.some((point) => point === null)) {
        return invalid("GEOMETRY_MISSING_POINT", "Polygon references a missing point.", object.id);
    }
    const polygonPoints = points.filter((point) => Boolean(point));
    for (let index = 0; index < polygonPoints.length; index += 1) {
        const current = polygonPoints[index];
        const next = polygonPoints[(index + 1) % polygonPoints.length];
        if (current && next && (0, math_1.pointsAlmostEqual)(current, next)) {
            return invalid("GEOMETRY_DUPLICATE_POINT", "Polygon neighboring points must be distinct.", object.id);
        }
    }
    if (Math.abs((0, math_1.polygonArea)(polygonPoints)) <= math_1.EPSILON) {
        return invalid("GEOMETRY_ZERO_AREA", "Polygon area must not be zero.", object.id);
    }
    return valid();
}
function validateRegion(object, objects) {
    if (object.regionKind === "boundary") {
        if (!object.loops?.length) {
            return invalid("GEOMETRY_INVALID_REGION", "Boundary region requires at least one closed loop.", object.id);
        }
        if (object.loops.some((loop) => !loop.closed || loop.edges.length === 0)) {
            return invalid("GEOMETRY_INVALID_REGION", "Boundary region loops must be closed and non-empty.", object.id);
        }
        return (0, regionGeometry_1.getRegionBoundaryPath)(object, objects)
            ? valid()
            : invalid("GEOMETRY_INVALID_REGION", "Boundary region references an invalid edge.", object.id);
    }
    if (object.boundaryPointIds.length < 3) {
        return invalid("GEOMETRY_INVALID_REGION", "Region requires at least three boundary points.", object.id);
    }
    const points = (0, derivedGeometry_1.getPolygonPoints)(object, objects);
    if (!points) {
        return invalid("GEOMETRY_MISSING_POINT", "Region references a missing boundary point.", object.id);
    }
    if (Math.abs((0, math_1.polygonArea)(points)) <= math_1.EPSILON) {
        return invalid("GEOMETRY_ZERO_AREA", "Region area must not be zero.", object.id);
    }
    return valid();
}
function validateArc(object, objects) {
    const center = getPoint(objects, object.centerPointId);
    const start = getPoint(objects, object.startPointId);
    const end = getPoint(objects, object.endPointId);
    if (!center || !start || !end) {
        return invalid("GEOMETRY_MISSING_POINT", "Arc requires existing center, start, and end points.", object.id);
    }
    if ((0, math_1.distance)(center, start) <= math_1.EPSILON || (0, math_1.distance)(center, end) <= math_1.EPSILON) {
        return invalid("GEOMETRY_INVALID_ARC", "Arc radius must be greater than zero.", object.id);
    }
    if (!(0, derivedGeometry_1.getArcGeometry)(object, objects)) {
        return invalid("GEOMETRY_INVALID_ARC_RADIUS", "Arc start and end points must be the same distance from the center.", object.id);
    }
    return valid();
}
function validateAngle(object, objects) {
    const pointA = getPoint(objects, object.pointAId);
    const vertex = getPoint(objects, object.vertexPointId);
    const pointC = getPoint(objects, object.pointCId);
    if (!pointA || !vertex || !pointC) {
        return invalid("GEOMETRY_MISSING_POINT", "Angle requires three existing points.", object.id);
    }
    if ((0, math_1.distance)(pointA, vertex) <= math_1.EPSILON || (0, math_1.distance)(pointC, vertex) <= math_1.EPSILON) {
        return invalid("GEOMETRY_INVALID_ANGLE", "Angle arms must use points distinct from the vertex.", object.id);
    }
    if (!(0, math_1.isFiniteNumber)(object.radius) || object.radius <= 0) {
        return invalid("GEOMETRY_INVALID_RADIUS", "Angle radius must be greater than zero.", object.id);
    }
    return valid();
}
function validateText(object) {
    if (!(0, math_1.isFiniteNumber)(object.x) || !(0, math_1.isFiniteNumber)(object.y)) {
        return invalid("GEOMETRY_INVALID_TEXT_POSITION", "Text position must use finite coordinates.", object.id);
    }
    if (typeof object.content !== "string") {
        return invalid("GEOMETRY_INVALID_TEXT", "Text content must be a string.", object.id);
    }
    return valid();
}
function validateImage(object) {
    if (!(0, math_1.isFiniteNumber)(object.x) || !(0, math_1.isFiniteNumber)(object.y)) {
        return invalid("GEOMETRY_INVALID_IMAGE_POSITION", "Image position must use finite coordinates.", object.id);
    }
    if (!(0, math_1.isFiniteNumber)(object.width) || object.width <= math_1.EPSILON) {
        return invalid("GEOMETRY_INVALID_IMAGE_SIZE", "Image width must be greater than zero.", object.id);
    }
    if (!(0, math_1.isFiniteNumber)(object.height) || object.height <= math_1.EPSILON) {
        return invalid("GEOMETRY_INVALID_IMAGE_SIZE", "Image height must be greater than zero.", object.id);
    }
    if (!(0, math_1.isFiniteNumber)(object.opacity) || object.opacity < 0 || object.opacity > 1) {
        return invalid("GEOMETRY_INVALID_IMAGE_OPACITY", "Image opacity must be between 0 and 1.", object.id);
    }
    if (typeof object.src !== "string" || object.src.length === 0) {
        return invalid("GEOMETRY_INVALID_IMAGE_SOURCE", "Image source must be available.", object.id);
    }
    return valid();
}
function validateMeasurement(object, objects) {
    const target = objects[object.targetObjectId];
    if (!target) {
        return invalid("GEOMETRY_MISSING_TARGET", "Measurement target does not exist.", object.id);
    }
    if (!(0, measurements_1.isMeasurementTypeSupported)(target, object.measurementType)) {
        return invalid("GEOMETRY_INVALID_MEASUREMENT", "Measurement type is not supported by target.", object.id);
    }
    return valid();
}
function validateGeometryObject(object, objects = {}) {
    const sceneObjects = { ...objects, [object.id]: object };
    switch (object.type) {
        case "point":
            return validatePoint(object);
        case "segment":
            return validateDistinctPoints(object.id, sceneObjects, object.startPointId, object.endPointId);
        case "line":
            return validateDistinctPoints(object.id, sceneObjects, object.pointAId, object.pointBId);
        case "ray":
            return validateDistinctPoints(object.id, sceneObjects, object.startPointId, object.throughPointId);
        case "vector":
            return validateDistinctPoints(object.id, sceneObjects, object.startPointId, object.endPointId);
        case "circle":
            return validateCircle(object, sceneObjects);
        case "arc":
            return validateArc(object, sceneObjects);
        case "polygon":
            return validatePolygon(object, sceneObjects);
        case "angle":
            return validateAngle(object, sceneObjects);
        case "text":
            return validateText(object);
        case "image":
            return validateImage(object);
        case "region":
            return validateRegion(object, sceneObjects);
        case "measurement":
            return validateMeasurement(object, sceneObjects);
    }
}
function validateGeometryObjects(objects) {
    const dependencyError = (0, dependency_1.validateDependencyGraph)(objects);
    if (dependencyError) {
        return { error: dependencyError, valid: false };
    }
    for (const object of Object.values(objects)) {
        const result = validateGeometryObject(object, objects);
        if (!result.valid) {
            return result;
        }
    }
    return valid();
}
