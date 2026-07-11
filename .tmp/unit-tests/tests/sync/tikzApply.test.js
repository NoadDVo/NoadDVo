"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTikzApplyTests = runTikzApplyTests;
const geometryStore_1 = require("../../app/store/geometryStore");
const geometry_1 = require("../../core/geometry");
const history_1 = require("../../core/history");
const sync_1 = require("../../core/sync");
const assert_1 = require("../assert");
function point(id, name, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        name,
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function segment(id, startPointId, endPointId) {
    return {
        createdAt: 2,
        dependencies: [startPointId, endPointId],
        dependents: [],
        endPointId,
        id,
        locked: false,
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
}
function baseScene() {
    return {
        a: point("a", "A", 0, 0),
        ab: segment("ab", "a", "b"),
        b: point("b", "B", 1, 0),
    };
}
function runTikzApplyTests() {
    assertPointCoordinateEditPreservesIdentity();
    assertNewCoordinateCreatesPoint();
    assertSegmentApplyReusesExistingPoints();
    assertUnsupportedTikzDoesNotCrashOrClearScene();
    assertInvalidTikzProducesDiagnostics();
    assertUndoRestoresPreviousGeometry();
    assertPreviewPointCoordinateUpdates();
    assertPreviewNewPointCreation();
    assertPreviewSegmentUpdates();
    assertPreviewDuplicateNameWarning();
    assertPreviewDerivedPointOverwriteWarning();
    assertPreviewBlocksParseErrors();
    assertPreviewCancelLeavesSceneUnchanged();
    assertPreviewApplyCreatesHistoryEntry();
}
function assertPointCoordinateEditPreservesIdentity() {
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (2,3);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    const pointA = result.objectRecord.a;
    (0, assert_1.assertEqual)(result.status, "ready", "point edit applies cleanly");
    if (pointA?.type !== "point") {
        throw new Error("existing point A keeps its id");
    }
    (0, assert_1.assertEqual)(pointA.x, 2, "point A x coordinate is updated");
    (0, assert_1.assertEqual)(pointA.y, 3, "point A y coordinate is updated");
    (0, assert_1.assert)(result.updatedObjectIds.includes("a"), "point edit is reported as an update");
}
function assertNewCoordinateCreatesPoint() {
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (0,0);",
            "\\coordinate (B) at (1,0);",
            "\\coordinate (C) at (0,1);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(result.objectRecord["point-C"]?.type === "point", "new TikZ coordinate creates a point");
    (0, assert_1.assert)(result.createdObjectIds.includes("point-C"), "new point creation is reported");
}
function assertSegmentApplyReusesExistingPoints() {
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (0,0);",
            "\\coordinate (B) at (2,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    const segmentObject = result.objectRecord.ab;
    if (segmentObject?.type !== "segment") {
        throw new Error("existing segment keeps its id");
    }
    (0, assert_1.assertEqual)(segmentObject.startPointId, "a", "segment start reuses existing point A");
    (0, assert_1.assertEqual)(segmentObject.endPointId, "b", "segment end reuses existing point B");
}
function assertUnsupportedTikzDoesNotCrashOrClearScene() {
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: baseScene(),
        source: "\\shade (0,0) circle (1);",
    });
    (0, assert_1.assertEqual)(result.status, "partial", "unsupported-only TikZ returns partial sync");
    (0, assert_1.assertEqual)(Object.keys(result.objectRecord).length, 3, "unsupported-only TikZ preserves scene");
    (0, assert_1.assert)(result.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_UNSUPPORTED_COMMAND"), "unsupported TikZ produces a diagnostic");
}
function assertInvalidTikzProducesDiagnostics() {
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: baseScene(),
        source: "\\coordinate (A) at (0,0)",
    });
    (0, assert_1.assertEqual)(result.status, "failed", "invalid TikZ fails safely");
    (0, assert_1.assertEqual)(result.objectRecord.a?.id, "a", "invalid TikZ preserves existing scene");
    (0, assert_1.assert)(result.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_MISSING_SEMICOLON"), "invalid TikZ emits parse diagnostics");
}
function resetGeometryStore(objects) {
    history_1.historyManager.clear();
    geometryStore_1.useGeometryStore.setState({
        canRedo: false,
        canUndo: false,
        historyVersion: 0,
        hoveredObjectId: null,
        lastError: null,
        objects,
        selectedObjectIds: [],
    });
}
function assertUndoRestoresPreviousGeometry() {
    resetGeometryStore(baseScene());
    const result = (0, sync_1.applyTikzToGeometry)({
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        source: [
            "\\coordinate (A) at (5,6);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assertEqual)(result.status, "ready", "TikZ apply result is valid before committing");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().setObjects(result.objectRecord, "Apply TikZ to geometry", result.changedObjectIds), "TikZ apply commits through geometry store");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().canUndo, "TikZ apply creates an undo entry");
    const appliedPoint = geometryStore_1.useGeometryStore.getState().objects.a;
    if (appliedPoint?.type !== "point") {
        throw new Error("applied point remains present");
    }
    (0, assert_1.assertEqual)(appliedPoint.x, 5, "store contains applied TikZ coordinate");
    geometryStore_1.useGeometryStore.getState().undo();
    const restoredPoint = geometryStore_1.useGeometryStore.getState().objects.a;
    if (restoredPoint?.type !== "point") {
        throw new Error("undo restores point");
    }
    (0, assert_1.assertEqual)(restoredPoint.x, 0, "undo restores previous x coordinate");
}
function assertPreviewPointCoordinateUpdates() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (2,3);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(preview.canApply, "point coordinate preview can be applied");
    (0, assert_1.assert)(preview.groups.updates.some((operation) => operation.objectId === "a" &&
        operation.beforeValue?.includes("(0, 0)") &&
        operation.afterValue?.includes("(2, 3)")), "preview shows point coordinate before and after values");
}
function assertPreviewNewPointCreation() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (0,0);",
            "\\coordinate (B) at (1,0);",
            "\\coordinate (C) at (0,1);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(preview.groups.creates.some((operation) => operation.objectId === "point-C"), "preview groups new coordinates as creates");
}
function assertPreviewSegmentUpdates() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: baseScene(),
        source: [
            "\\coordinate (A) at (0,0);",
            "\\coordinate (B) at (2,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(preview.groups.updates.some((operation) => operation.objectId === "ab"), "preview reports matched segment as an update");
}
function duplicatePointScene() {
    return {
        a: point("a", "A", 0, 0),
        a2: point("a2", "A", 4, 4),
    };
}
function assertPreviewDuplicateNameWarning() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: duplicatePointScene(),
        source: "\\coordinate (A) at (1,1);",
    });
    (0, assert_1.assert)(preview.groups.conflicts.some((operation) => operation.reason.includes("matches multiple existing points")), "duplicate point names are surfaced as conflicts");
}
function derivedPointScene() {
    return {
        a: point("a", "A", 0, 0),
        b: point("b", "B", 2, 0),
        m: {
            ...point("m", "M", 1, 0),
            construction: {
                pointAId: "a",
                pointBId: "b",
                type: "midpoint",
            },
            dependencies: ["a", "b"],
            pointKind: "derived",
        },
    };
}
function assertPreviewDerivedPointOverwriteWarning() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: derivedPointScene(),
        source: [
            "\\coordinate (A) at (0,0);",
            "\\coordinate (B) at (2,0);",
            "\\coordinate (M) at (1.2,0);",
        ].join("\n"),
    });
    (0, assert_1.assert)(preview.groups.conflicts.some((operation) => operation.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_APPLY_POINT_DEPENDENCY_REPLACED")), "derived point overwrite appears as a conflict");
}
function assertPreviewBlocksParseErrors() {
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: baseScene(),
        source: "\\coordinate (A) at (0,0)",
    });
    (0, assert_1.assert)(!preview.canApply, "preview blocks apply when parse errors exist");
    (0, assert_1.assert)(preview.groups.conflicts.some((operation) => operation.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_MISSING_SEMICOLON")), "parse errors are grouped as conflicts");
}
function assertPreviewCancelLeavesSceneUnchanged() {
    resetGeometryStore(baseScene());
    (0, sync_1.createTikzApplyPreview)({
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        source: [
            "\\coordinate (A) at (9,9);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    const pointA = geometryStore_1.useGeometryStore.getState().objects.a;
    if (pointA?.type !== "point") {
        throw new Error("point A remains present after preview cancel");
    }
    (0, assert_1.assertEqual)(pointA.x, 0, "preview without apply leaves scene unchanged");
    (0, assert_1.assert)(!geometryStore_1.useGeometryStore.getState().canUndo, "preview without apply does not create history");
}
function assertPreviewApplyCreatesHistoryEntry() {
    resetGeometryStore(baseScene());
    const preview = (0, sync_1.createTikzApplyPreview)({
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        source: [
            "\\coordinate (A) at (7,8);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(preview.canApply, "preview is valid before applying");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().setObjects(preview.applyResult.objectRecord, "Apply TikZ to geometry", preview.applyResult.changedObjectIds), "preview apply commits through geometry store");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().canUndo, "preview apply creates history entry");
    geometryStore_1.useGeometryStore.getState().undo();
    const restoredPoint = geometryStore_1.useGeometryStore.getState().objects.a;
    if (restoredPoint?.type !== "point") {
        throw new Error("undo restores point after preview apply");
    }
    (0, assert_1.assertEqual)(restoredPoint.x, 0, "undo restores previous geometry after preview apply");
}
