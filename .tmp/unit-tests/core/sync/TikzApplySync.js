"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTikzToGeometry = applyTikzToGeometry;
const geometry_1 = require("../geometry");
const SyncDiagnostics_1 = require("./SyncDiagnostics");
const TikzToGeometrySync_1 = require("./TikzToGeometrySync");
const TIKZ_APPLY_SUPPORTED_TYPES = new Set([
    "angle",
    "arc",
    "circle",
    "point",
    "polygon",
    "region",
    "segment",
    "text",
    "vector",
]);
function now() {
    return Date.now();
}
function pointName(objects, pointId) {
    const point = objects[pointId];
    return point?.type === "point" && point.name ? point.name : pointId;
}
function styleDiffersFromDefault(style) {
    return JSON.stringify(style) !== JSON.stringify(geometry_1.DEFAULT_GEOMETRY_STYLE);
}
function mergeStyle(existing, candidate) {
    if (!existing) {
        return candidate.style;
    }
    return styleDiffersFromDefault(candidate.style) ? candidate.style : existing.style;
}
function mergeBaseObject(candidate, existing, objectId) {
    return {
        ...candidate,
        id: objectId,
        createdAt: existing?.createdAt ?? candidate.createdAt,
        layerId: existing?.layerId ?? candidate.layerId,
        locked: existing?.locked ?? candidate.locked,
        metadata: {
            ...(existing?.metadata ?? {}),
            ...(candidate.metadata ?? {}),
            tikzSyncedAt: now(),
        },
        style: mergeStyle(existing, candidate),
        updatedAt: now(),
        visible: existing?.visible ?? candidate.visible,
    };
}
function buildPointNameIndex(objects) {
    const index = new Map();
    Object.values(objects).forEach((object) => {
        if (object.type !== "point" || !object.name) {
            return;
        }
        const bucket = index.get(object.name) ?? [];
        bucket.push(object);
        index.set(object.name, bucket);
    });
    return index;
}
function uniqueObjectId(preferredId, usedIds) {
    let candidate = preferredId;
    let suffix = 1;
    while (usedIds.has(candidate)) {
        candidate = `${preferredId}-${suffix}`;
        suffix += 1;
    }
    usedIds.add(candidate);
    return candidate;
}
function sequenceKey(values) {
    return values.join(">");
}
function cyclicSequenceKey(values) {
    if (values.length === 0) {
        return "";
    }
    const rotations = values.map((_, index) => [
        ...values.slice(index),
        ...values.slice(0, index),
    ]);
    const reversed = [...values].reverse();
    const reversedRotations = reversed.map((_, index) => [
        ...reversed.slice(index),
        ...reversed.slice(0, index),
    ]);
    return [...rotations, ...reversedRotations]
        .map(sequenceKey)
        .sort((first, second) => first.localeCompare(second))[0] ?? sequenceKey(values);
}
function objectIdentityKey(object, objects) {
    switch (object.type) {
        case "point":
            return object.name ? `point:${object.name}` : null;
        case "segment":
            return `segment:${[pointName(objects, object.startPointId), pointName(objects, object.endPointId)].sort().join(">")}`;
        case "line":
            return `line:${[pointName(objects, object.pointAId), pointName(objects, object.pointBId)].sort().join(">")}`;
        case "ray":
            return `ray:${pointName(objects, object.startPointId)}>${pointName(objects, object.throughPointId)}`;
        case "vector":
            return `vector:${pointName(objects, object.startPointId)}>${pointName(objects, object.endPointId)}`;
        case "circle":
            if (object.circleKind === "center-radius") {
                return `circle:${pointName(objects, object.centerPointId)}`;
            }
            if (object.circleKind === "center-point") {
                return `circle:${pointName(objects, object.centerPointId)}>${pointName(objects, object.radiusPointId)}`;
            }
            return `circle:${cyclicSequenceKey([
                pointName(objects, object.pointAId),
                pointName(objects, object.pointBId),
                pointName(objects, object.pointCId),
            ])}`;
        case "polygon":
            return `polygon:${cyclicSequenceKey(object.pointIds.map((pointId) => pointName(objects, pointId)))}`;
        case "region":
            return `region:${cyclicSequenceKey(object.boundaryPointIds.map((pointId) => pointName(objects, pointId)))}`;
        case "angle":
            return `angle:${pointName(objects, object.pointAId)}>${pointName(objects, object.vertexPointId)}>${pointName(objects, object.pointCId)}`;
        case "arc":
            return `arc:${pointName(objects, object.centerPointId)}>${pointName(objects, object.startPointId)}>${pointName(objects, object.endPointId)}`;
        case "text":
            return `text:${object.content}:${object.x}:${object.y}`;
        case "image":
            return null;
        case "measurement":
            return null;
    }
}
function buildObjectKeyIndex(objects) {
    const index = new Map();
    Object.values(objects).forEach((object) => {
        const key = objectIdentityKey(object, objects);
        if (!key) {
            return;
        }
        const bucket = index.get(key) ?? [];
        bucket.push(object);
        index.set(key, bucket);
    });
    return index;
}
function remapDependencies(dependencies, idMap) {
    return dependencies.map((id) => idMap.get(id) ?? id);
}
function rewireObject(object, idMap) {
    const dependencies = remapDependencies(object.dependencies, idMap);
    if (object.type === "segment") {
        return {
            ...object,
            dependencies,
            endPointId: idMap.get(object.endPointId) ?? object.endPointId,
            startPointId: idMap.get(object.startPointId) ?? object.startPointId,
        };
    }
    if (object.type === "line") {
        return {
            ...object,
            dependencies,
            pointAId: idMap.get(object.pointAId) ?? object.pointAId,
            pointBId: idMap.get(object.pointBId) ?? object.pointBId,
        };
    }
    if (object.type === "ray") {
        return {
            ...object,
            dependencies,
            startPointId: idMap.get(object.startPointId) ?? object.startPointId,
            throughPointId: idMap.get(object.throughPointId) ?? object.throughPointId,
        };
    }
    if (object.type === "vector") {
        return {
            ...object,
            dependencies,
            endPointId: idMap.get(object.endPointId) ?? object.endPointId,
            startPointId: idMap.get(object.startPointId) ?? object.startPointId,
        };
    }
    if (object.type === "circle") {
        if (object.circleKind === "center-radius") {
            return {
                ...object,
                centerPointId: idMap.get(object.centerPointId) ?? object.centerPointId,
                dependencies,
            };
        }
        if (object.circleKind === "center-point") {
            return {
                ...object,
                centerPointId: idMap.get(object.centerPointId) ?? object.centerPointId,
                dependencies,
                radiusPointId: idMap.get(object.radiusPointId) ?? object.radiusPointId,
            };
        }
        return {
            ...object,
            dependencies,
            pointAId: idMap.get(object.pointAId) ?? object.pointAId,
            pointBId: idMap.get(object.pointBId) ?? object.pointBId,
            pointCId: idMap.get(object.pointCId) ?? object.pointCId,
        };
    }
    if (object.type === "polygon") {
        return {
            ...object,
            dependencies,
            pointIds: object.pointIds.map((pointId) => idMap.get(pointId) ?? pointId),
        };
    }
    if (object.type === "region") {
        return {
            ...object,
            boundaryPointIds: object.boundaryPointIds.map((pointId) => idMap.get(pointId) ?? pointId),
            dependencies,
        };
    }
    if (object.type === "angle") {
        return {
            ...object,
            dependencies,
            pointAId: idMap.get(object.pointAId) ?? object.pointAId,
            pointCId: idMap.get(object.pointCId) ?? object.pointCId,
            vertexPointId: idMap.get(object.vertexPointId) ?? object.vertexPointId,
        };
    }
    if (object.type === "arc") {
        return {
            ...object,
            centerPointId: idMap.get(object.centerPointId) ?? object.centerPointId,
            dependencies,
            endPointId: idMap.get(object.endPointId) ?? object.endPointId,
            startPointId: idMap.get(object.startPointId) ?? object.startPointId,
        };
    }
    if (object.type === "measurement") {
        return {
            ...object,
            dependencies,
            targetObjectId: idMap.get(object.targetObjectId) ?? object.targetObjectId,
        };
    }
    return {
        ...object,
        dependencies,
    };
}
function changedObjectIds(operations) {
    return operations
        .filter((operation) => operation.operation !== "preserve")
        .map((operation) => operation.objectId);
}
function unsupportedExistingTypeDiagnostic(type) {
    return {
        code: "TIKZ_APPLY_UNSUPPORTED_EXISTING_TYPE",
        direction: "tikz-to-geometry",
        message: `${type} objects are preserved because TikZ apply cannot recover them yet.`,
        severity: "warning",
    };
}
function applyTikzToGeometry({ currentObjects, source, sourceId, tikzOptions, }) {
    const syncResult = (0, TikzToGeometrySync_1.syncTikzToGeometry)({ source, sourceId, tikzOptions });
    const diagnostics = [...syncResult.diagnostics];
    if (syncResult.status === "failed" || !syncResult.validation.valid) {
        return {
            changedObjectIds: [],
            createdObjectIds: [],
            deletedObjectIds: [],
            diagnostics,
            objectRecord: currentObjects,
            operations: Object.values(currentObjects).map((object) => ({
                objectId: object.id,
                operation: "preserve",
                reason: "TikZ parse failed; existing geometry was preserved.",
                type: object.type,
            })),
            preservedObjectIds: Object.keys(currentObjects),
            status: "failed",
            syncResult,
            updatedObjectIds: [],
        };
    }
    if (syncResult.objects.length === 0 && diagnostics.some((diagnostic) => diagnostic.severity === "warning")) {
        diagnostics.push({
            code: "TIKZ_APPLY_PARTIAL_EMPTY_SCENE",
            direction: "tikz-to-geometry",
            message: "No supported geometry was recovered, so the existing scene was preserved.",
            severity: "warning",
        });
        return {
            changedObjectIds: [],
            createdObjectIds: [],
            deletedObjectIds: [],
            diagnostics,
            objectRecord: currentObjects,
            operations: Object.values(currentObjects).map((object) => ({
                objectId: object.id,
                operation: "preserve",
                reason: "No supported TikZ geometry was recovered.",
                type: object.type,
            })),
            preservedObjectIds: Object.keys(currentObjects),
            status: "partial",
            syncResult,
            updatedObjectIds: [],
        };
    }
    const usedIds = new Set(Object.keys(currentObjects));
    const candidateObjects = syncResult.objectRecord;
    const candidatePointIndex = buildPointNameIndex(candidateObjects);
    const existingPointIndex = buildPointNameIndex(currentObjects);
    const existingObjectIndex = buildObjectKeyIndex(currentObjects);
    const idMap = new Map();
    const nextObjects = {};
    const operations = [];
    const updatedObjectIds = [];
    const createdObjectIds = [];
    candidatePointIndex.forEach((points, name) => {
        const existingMatches = existingPointIndex.get(name) ?? [];
        points.forEach((candidate) => {
            if (existingMatches.length > 1) {
                diagnostics.push({
                    code: "TIKZ_APPLY_AMBIGUOUS_POINT_NAME",
                    direction: "tikz-to-geometry",
                    message: `Point name "${name}" matches multiple existing points; a new point was created.`,
                    severity: "warning",
                });
            }
            const existing = existingMatches.length === 1 ? existingMatches[0] : undefined;
            const nextId = existing?.id ?? uniqueObjectId(candidate.id, usedIds);
            idMap.set(candidate.id, nextId);
            if (existing?.dependencies.length) {
                diagnostics.push({
                    code: "TIKZ_APPLY_POINT_DEPENDENCY_REPLACED",
                    direction: "tikz-to-geometry",
                    message: `Point "${name}" was edited from TikZ and its construction dependency was replaced by a free point.`,
                    objectId: existing.id,
                    severity: "warning",
                });
            }
            nextObjects[nextId] = mergeBaseObject(candidate, existing, nextId);
            if (existing) {
                updatedObjectIds.push(nextId);
                operations.push({
                    candidateId: candidate.id,
                    objectId: nextId,
                    operation: "update",
                    reason: `Matched point by TikZ name "${name}".`,
                    type: "point",
                });
            }
            else {
                createdObjectIds.push(nextId);
                operations.push({
                    candidateId: candidate.id,
                    objectId: nextId,
                    operation: "create",
                    reason: `Created point from TikZ coordinate "${name}".`,
                    type: "point",
                });
            }
        });
    });
    syncResult.objects
        .filter((object) => object.type !== "point")
        .forEach((candidate) => {
        const rewiredCandidate = rewireObject(candidate, idMap);
        const identityKey = objectIdentityKey(rewiredCandidate, {
            ...currentObjects,
            ...nextObjects,
        });
        const existingMatches = identityKey ? existingObjectIndex.get(identityKey) ?? [] : [];
        const existing = existingMatches.length === 1 ? existingMatches[0] : undefined;
        if (existingMatches.length > 1) {
            diagnostics.push({
                code: "TIKZ_APPLY_AMBIGUOUS_OBJECT_MAPPING",
                direction: "tikz-to-geometry",
                message: `${candidate.type} from TikZ matches multiple existing objects; a new object was created.`,
                severity: "warning",
            });
        }
        const nextId = existing?.id ?? uniqueObjectId(candidate.id, usedIds);
        idMap.set(candidate.id, nextId);
        nextObjects[nextId] = mergeBaseObject(rewiredCandidate, existing, nextId);
        if (existing) {
            updatedObjectIds.push(nextId);
            operations.push({
                candidateId: candidate.id,
                objectId: nextId,
                operation: "update",
                reason: `Matched ${candidate.type} by named geometry dependencies.`,
                type: candidate.type,
            });
        }
        else {
            createdObjectIds.push(nextId);
            operations.push({
                candidateId: candidate.id,
                objectId: nextId,
                operation: "create",
                reason: `Created ${candidate.type} from TikZ.`,
                type: candidate.type,
            });
        }
    });
    const partialParse = syncResult.status === "partial";
    const candidateTargetIds = new Set(Object.keys(nextObjects));
    const deletedObjectIds = [];
    const preservedObjectIds = [];
    const warnedUnsupportedTypes = new Set();
    Object.values(currentObjects).forEach((existing) => {
        if (candidateTargetIds.has(existing.id)) {
            return;
        }
        if (!TIKZ_APPLY_SUPPORTED_TYPES.has(existing.type) || partialParse) {
            nextObjects[existing.id] = existing;
            preservedObjectIds.push(existing.id);
            operations.push({
                objectId: existing.id,
                operation: "preserve",
                reason: partialParse
                    ? "Partial TikZ recovery preserved unmatched existing geometry."
                    : "Object type is not supported by TikZ apply yet.",
                type: existing.type,
            });
            if (!TIKZ_APPLY_SUPPORTED_TYPES.has(existing.type) && !warnedUnsupportedTypes.has(existing.type)) {
                diagnostics.push(unsupportedExistingTypeDiagnostic(existing.type));
                warnedUnsupportedTypes.add(existing.type);
            }
            return;
        }
        deletedObjectIds.push(existing.id);
        operations.push({
            objectId: existing.id,
            operation: "delete",
            reason: "Supported object was not present in the applied TikZ source.",
            type: existing.type,
        });
    });
    let objectRecord = (0, geometry_1.normalizeDependencyMetadata)(nextObjects);
    const validation = (0, geometry_1.validateGeometryObjects)(objectRecord);
    if (!validation.valid) {
        diagnostics.push((0, SyncDiagnostics_1.geometryErrorToDiagnostic)(validation.error, "tikz-to-geometry"));
        objectRecord = currentObjects;
        return {
            changedObjectIds: [],
            createdObjectIds: [],
            deletedObjectIds: [],
            diagnostics,
            objectRecord,
            operations: Object.values(currentObjects).map((object) => ({
                objectId: object.id,
                operation: "preserve",
                reason: "Applied TikZ produced invalid geometry; existing scene was preserved.",
                type: object.type,
            })),
            preservedObjectIds: Object.keys(currentObjects),
            status: "failed",
            syncResult,
            updatedObjectIds: [],
        };
    }
    const status = (0, SyncDiagnostics_1.diagnosticsStatus)(diagnostics);
    return {
        changedObjectIds: changedObjectIds(operations),
        createdObjectIds,
        deletedObjectIds,
        diagnostics,
        objectRecord,
        operations,
        preservedObjectIds,
        status,
        syncResult,
        updatedObjectIds,
    };
}
