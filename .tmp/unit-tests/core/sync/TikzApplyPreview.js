"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTikzApplyPreview = createTikzApplyPreview;
const TikzApplySync_1 = require("./TikzApplySync");
function objectName(object) {
    return object && "name" in object ? object.name : undefined;
}
function pointLabel(objects, pointId) {
    const point = objects[pointId];
    return point?.type === "point" ? point.name ?? point.id : pointId;
}
function summarizeObject(object, objects) {
    if (!object) {
        return undefined;
    }
    switch (object.type) {
        case "point":
            return `${object.name ?? object.id} = (${object.x}, ${object.y})`;
        case "segment":
            return `${pointLabel(objects, object.startPointId)} -- ${pointLabel(objects, object.endPointId)}`;
        case "line":
            return `line ${pointLabel(objects, object.pointAId)} ${pointLabel(objects, object.pointBId)}`;
        case "ray":
            return `ray ${pointLabel(objects, object.startPointId)} -> ${pointLabel(objects, object.throughPointId)}`;
        case "vector":
            return `vector ${pointLabel(objects, object.startPointId)} -> ${pointLabel(objects, object.endPointId)}`;
        case "circle":
            if (object.circleKind === "center-radius") {
                return `circle center ${pointLabel(objects, object.centerPointId)}, r=${object.radius}`;
            }
            if (object.circleKind === "center-point") {
                return `circle center ${pointLabel(objects, object.centerPointId)}, through ${pointLabel(objects, object.radiusPointId)}`;
            }
            return `circle through ${[
                pointLabel(objects, object.pointAId),
                pointLabel(objects, object.pointBId),
                pointLabel(objects, object.pointCId),
            ].join(", ")}`;
        case "polygon":
            return `polygon ${object.pointIds.map((pointId) => pointLabel(objects, pointId)).join(" -- ")}`;
        case "region":
            return `region ${object.boundaryPointIds.map((pointId) => pointLabel(objects, pointId)).join(" -- ")}`;
        case "angle":
            return `angle ${pointLabel(objects, object.pointAId)}-${pointLabel(objects, object.vertexPointId)}-${pointLabel(objects, object.pointCId)}`;
        case "arc":
            return `arc ${pointLabel(objects, object.centerPointId)}:${pointLabel(objects, object.startPointId)}-${pointLabel(objects, object.endPointId)}`;
        case "text":
            return `text "${object.content}" at (${object.x}, ${object.y})`;
        case "measurement":
            return `${object.measurementType} of ${object.targetObjectId}`;
    }
}
function diagnosticForOperation(diagnostics, operation) {
    return diagnostics.filter((diagnostic) => diagnostic.objectId === operation.objectId ||
        (!diagnostic.objectId && operation.reason.includes(diagnostic.code)));
}
function diagnosticPreviewType(diagnostic) {
    if (diagnostic.severity === "error") {
        return "conflict";
    }
    if (diagnostic.code === "TIKZ_APPLY_AMBIGUOUS_POINT_NAME" ||
        diagnostic.code === "TIKZ_APPLY_AMBIGUOUS_OBJECT_MAPPING" ||
        diagnostic.code === "TIKZ_APPLY_POINT_DEPENDENCY_REPLACED") {
        return "conflict";
    }
    return "warning";
}
function operationPreviewType(operation, diagnostics) {
    if (operation.operation === "preserve" &&
        operation.reason.includes("not supported")) {
        return "unsupported";
    }
    if (diagnostics.some((diagnostic) => diagnosticPreviewType(diagnostic) === "conflict")) {
        return "conflict";
    }
    return operation.operation;
}
function severityFor(operation, diagnostics) {
    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        return "error";
    }
    if (operation === "conflict" || operation === "delete" || operation === "unsupported" || diagnostics.length > 0) {
        return "warning";
    }
    return "info";
}
function previewForChange(change, currentObjects, nextObjects, diagnostics) {
    const before = currentObjects[change.objectId];
    const after = nextObjects[change.objectId];
    const relatedDiagnostics = diagnosticForOperation(diagnostics, change);
    const operation = operationPreviewType(change, relatedDiagnostics);
    return {
        afterValue: summarizeObject(after, nextObjects),
        beforeValue: summarizeObject(before, currentObjects),
        candidateId: change.candidateId,
        diagnostics: relatedDiagnostics,
        objectId: change.objectId,
        objectName: objectName(after) ?? objectName(before),
        objectType: change.type,
        operation,
        reason: change.reason,
        requiresConfirmation: operation === "delete" || operation === "conflict",
        severity: severityFor(operation, relatedDiagnostics),
    };
}
function previewForDiagnostic(diagnostic) {
    const operation = diagnosticPreviewType(diagnostic);
    return {
        diagnostics: [diagnostic],
        objectId: diagnostic.objectId,
        operation,
        reason: diagnostic.message,
        requiresConfirmation: operation === "conflict",
        severity: diagnostic.severity,
    };
}
function groupOperations(operations) {
    return {
        conflicts: operations.filter((operation) => operation.operation === "conflict"),
        creates: operations.filter((operation) => operation.operation === "create"),
        deletes: operations.filter((operation) => operation.operation === "delete"),
        preserved: operations.filter((operation) => operation.operation === "preserve" || operation.operation === "unsupported"),
        updates: operations.filter((operation) => operation.operation === "update"),
        warnings: operations.filter((operation) => operation.operation === "warning"),
    };
}
function createTikzApplyPreview({ currentObjects, source, sourceId, tikzOptions, }) {
    const applyResult = (0, TikzApplySync_1.applyTikzToGeometry)({
        currentObjects,
        source,
        sourceId,
        tikzOptions,
    });
    const operations = [
        ...applyResult.operations.map((operation) => previewForChange(operation, currentObjects, applyResult.objectRecord, applyResult.diagnostics)),
        ...applyResult.diagnostics
            .filter((diagnostic) => !diagnostic.objectId)
            .map(previewForDiagnostic),
    ];
    const groups = groupOperations(operations);
    const requiresPartialConfirmation = applyResult.status === "partial";
    const requiresDestructiveConfirmation = groups.deletes.length > 0;
    const canApply = applyResult.status !== "failed" &&
        !applyResult.diagnostics.some((diagnostic) => diagnostic.severity === "error");
    return {
        applyResult,
        canApply,
        diagnostics: applyResult.diagnostics,
        groups,
        operations,
        requiresDestructiveConfirmation,
        requiresPartialConfirmation,
    };
}
