"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDependencyMetadata = normalizeDependencyMetadata;
exports.validateDependencyGraph = validateDependencyGraph;
exports.propagateGeometryUpdates = propagateGeometryUpdates;
const regionGeometry_1 = require("../regionGeometry");
const constructions_1 = require("../constructions");
const DependencyGraph_1 = require("./DependencyGraph");
function toGeometryError(code, message, objectId) {
    return {
        code,
        message,
        ...(objectId ? { objectId } : {}),
        severity: "error",
    };
}
function expectedDependenciesForObject(object) {
    if (object.type === "segment") {
        return [object.startPointId, object.endPointId];
    }
    if (object.type === "circle") {
        return expectedCircleDependencies(object);
    }
    if (object.type === "polygon") {
        return object.pointIds;
    }
    if (object.type === "arc") {
        return [object.centerPointId, object.startPointId, object.endPointId];
    }
    if (object.type === "region") {
        return (0, regionGeometry_1.getRegionDependencyIds)(object);
    }
    if (object.type === "line") {
        return [object.pointAId, object.pointBId];
    }
    if (object.type === "ray") {
        return [object.startPointId, object.throughPointId];
    }
    if (object.type === "vector") {
        return [object.startPointId, object.endPointId];
    }
    if (object.type === "angle") {
        return [object.pointAId, object.vertexPointId, object.pointCId];
    }
    if (object.type === "text") {
        return object.dependencies;
    }
    if (object.type === "measurement") {
        return [object.targetObjectId];
    }
    return object.dependencies;
}
function expectedCircleDependencies(object) {
    if (object.circleKind === "center-radius") {
        return [object.centerPointId];
    }
    if (object.circleKind === "center-point") {
        return [object.centerPointId, object.radiusPointId];
    }
    return [object.pointAId, object.pointBId, object.pointCId];
}
function normalizeObjectDependencies(object) {
    const dependencies = Array.from(new Set(expectedDependenciesForObject(object)));
    if (dependencies.length === object.dependencies.length &&
        dependencies.every((dependency, index) => object.dependencies[index] === dependency)) {
        return object;
    }
    return {
        ...object,
        dependencies,
    };
}
function normalizeDependencyMetadata(objects) {
    const normalizedEntries = Object.values(objects).map((object) => [
        object.id,
        {
            ...normalizeObjectDependencies(object),
            dependents: [],
        },
    ]);
    const normalizedObjects = Object.fromEntries(normalizedEntries);
    const dependentIdsByObject = new Map();
    for (const objectId of Object.keys(normalizedObjects)) {
        dependentIdsByObject.set(objectId, []);
    }
    for (const object of Object.values(normalizedObjects)) {
        for (const dependencyId of object.dependencies) {
            dependentIdsByObject.get(dependencyId)?.push(object.id);
        }
    }
    return Object.fromEntries(Object.values(normalizedObjects).map((object) => [
        object.id,
        {
            ...object,
            dependents: Array.from(new Set(dependentIdsByObject.get(object.id) ?? [])),
        },
    ]));
}
function validateDependencyGraph(objects) {
    const graphResult = DependencyGraph_1.DependencyGraph.fromObjects(normalizeDependencyMetadata(objects));
    if (graphResult.valid) {
        return null;
    }
    return toGeometryError(graphResult.error.code, graphResult.error.message, graphResult.error.objectId);
}
function propagateGeometryUpdates(objects, changedObjectId) {
    const normalizedObjects = normalizeDependencyMetadata(objects);
    const graphResult = DependencyGraph_1.DependencyGraph.fromObjects(normalizedObjects);
    if (!graphResult.valid) {
        return {
            error: toGeometryError(graphResult.error.code, graphResult.error.message, graphResult.error.objectId),
            valid: false,
        };
    }
    const changedObject = normalizedObjects[changedObjectId];
    if (!changedObject) {
        return {
            error: toGeometryError("GEOMETRY_OBJECT_NOT_FOUND", "Cannot propagate updates from a missing object.", changedObjectId),
            valid: false,
        };
    }
    const updatedAt = Date.now();
    const orderedDependents = graphResult.value.getTopologicalDependents(changedObjectId);
    let nextObjects = normalizedObjects;
    for (const dependentId of orderedDependents) {
        const dependent = nextObjects[dependentId];
        if (!dependent) {
            continue;
        }
        if (dependent.type === "point" && dependent.pointKind === "derived" && dependent.construction) {
            const nextPoint = (0, constructions_1.recomputeConstructedPoint)(dependent.construction, nextObjects);
            nextObjects = {
                ...nextObjects,
                [dependentId]: {
                    ...dependent,
                    ...(nextPoint ? { x: nextPoint.x, y: nextPoint.y, visible: true } : { visible: false }),
                    updatedAt,
                },
            };
            continue;
        }
        nextObjects = {
            ...nextObjects,
            [dependentId]: {
                ...dependent,
                updatedAt,
            },
        };
    }
    return {
        objects: nextObjects,
        valid: true,
    };
}
