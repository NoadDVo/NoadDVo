"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLiveSyncTests = runLiveSyncTests;
const geometryStore_1 = require("../../app/store/geometryStore");
const geometry_1 = require("../../core/geometry");
const history_1 = require("../../core/history");
const sync_1 = require("../../core/sync");
const tikz_1 = require("../../core/tikz");
const liveTikzPanelSync_1 = require("../../features/tikz-panel/liveTikzPanelSync");
const tikzPanelState_1 = require("../../features/tikz-panel/tikzPanelState");
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
function circle(id, centerPointId, radius) {
    return {
        circleKind: "center-radius",
        centerPointId,
        createdAt: 3,
        dependencies: [centerPointId],
        dependents: [],
        id,
        locked: false,
        radius,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 3,
        visible: true,
    };
}
function polygon(id, pointIds) {
    return {
        closed: true,
        createdAt: 4,
        dependencies: pointIds,
        dependents: [],
        id,
        locked: false,
        pointIds,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "polygon",
        updatedAt: 4,
        visible: true,
    };
}
function region(id, boundaryPointIds) {
    return {
        boundaryPointIds,
        createdAt: 5,
        dependencies: boundaryPointIds,
        dependents: [],
        id,
        locked: false,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#60a5fa",
            fillOpacity: 0.3,
        },
        type: "region",
        updatedAt: 5,
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
function runLiveSyncTests() {
    assertMovingPointUpdatesTikz();
    assertEditingTikzUpdatesExistingPoint();
    assertDebounceContractForRapidTyping();
    assertLoopPreventionStamp();
    assertUndoRedoDuringLiveSync();
    assertIdentityAndDependencyPreservation();
    assertLargeScenePerformance();
    assertPanelIntegrationAcceptancePath();
    assertTikzPanelGeneratedCodeState();
    assertGeneratedTikzAcceptanceCoverage();
}
function assertMovingPointUpdatesTikz() {
    const scene = {
        ...baseScene(),
        a: point("a", "A", 3, 4),
    };
    const result = (0, sync_1.createLiveGeometryToTikz)({
        mode: "academic",
        objects: scene,
        origin: "canvas",
    });
    (0, assert_1.assertIncludes)(result.tikz.code, "\\coordinate (A) at (3,4);", "moving a point updates generated TikZ");
    (0, assert_1.assertEqual)(result.stamp.origin, "canvas", "geometry-to-TikZ sync records provenance");
}
function assertEditingTikzUpdatesExistingPoint() {
    resetGeometryStore(baseScene());
    const liveResult = (0, sync_1.createLiveTikzToGeometry)({
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        origin: "tikz-editor",
        source: [
            "\\coordinate (A) at (5,6);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    (0, assert_1.assert)(liveResult.autoApplicable, "clean TikZ edit can auto-apply");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().setObjects(liveResult.preview.applyResult.objectRecord, "Live TikZ sync", liveResult.preview.applyResult.changedObjectIds), "live TikZ sync commits through geometry store");
    const pointA = geometryStore_1.useGeometryStore.getState().objects.a;
    if (pointA?.type !== "point") {
        throw new Error("existing point A survives live sync");
    }
    (0, assert_1.assertEqual)(pointA.x, 5, "live TikZ sync updates existing point x");
    (0, assert_1.assertEqual)(pointA.y, 6, "live TikZ sync updates existing point y");
}
function assertDebounceContractForRapidTyping() {
    (0, assert_1.assertEqual)(sync_1.LIVE_TIKZ_SYNC_DEBOUNCE_MS, 400, "live TikZ sync uses a 400ms debounce");
    const fragments = [
        "\\coordinate",
        "\\coordinate (A)",
        "\\coordinate (A) at",
        "\\coordinate (A) at (1,",
        [
            "\\coordinate (A) at (1,2);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    ];
    const startedAt = Date.now();
    const previews = fragments.map((source) => (0, sync_1.createLiveTikzToGeometry)({
        currentObjects: baseScene(),
        origin: "tikz-editor",
        source,
    }));
    const elapsed = Date.now() - startedAt;
    (0, assert_1.assert)(elapsed < 1000, "rapid TikZ fragments parse without freezing the test runner");
    (0, assert_1.assert)(previews[previews.length - 1]?.autoApplicable, "final complete fragment is auto-applicable");
}
function assertLoopPreventionStamp() {
    const first = (0, sync_1.createLiveSyncStamp)({
        direction: "tikz-to-geometry",
        origin: "tikz-editor",
        value: "\\coordinate (A) at (1,2);",
    });
    const same = (0, sync_1.createLiveSyncStamp)({
        direction: "tikz-to-geometry",
        origin: "tikz-editor",
        value: "\\coordinate (A) at (1,2);",
    });
    const different = (0, sync_1.createLiveSyncStamp)({
        direction: "geometry-to-tikz",
        origin: "canvas",
        value: "\\coordinate (A) at (1,2);",
    });
    (0, assert_1.assert)((0, sync_1.isSameSyncCycle)(first, same), "same live sync stamp prevents repeat cycles");
    (0, assert_1.assert)(!(0, sync_1.isSameSyncCycle)(first, different), "different origin or direction is not treated as a loop");
}
function assertUndoRedoDuringLiveSync() {
    resetGeometryStore(baseScene());
    const liveResult = (0, sync_1.createLiveTikzToGeometry)({
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        origin: "tikz-editor",
        source: [
            "\\coordinate (A) at (7,8);",
            "\\coordinate (B) at (1,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    geometryStore_1.useGeometryStore.getState().setObjects(liveResult.preview.applyResult.objectRecord, "Live TikZ sync", liveResult.preview.applyResult.changedObjectIds);
    geometryStore_1.useGeometryStore.getState().undo();
    const undone = geometryStore_1.useGeometryStore.getState().objects.a;
    if (undone?.type !== "point") {
        throw new Error("undo keeps point A");
    }
    (0, assert_1.assertEqual)(undone.x, 0, "undo restores geometry before live sync");
    geometryStore_1.useGeometryStore.getState().redo();
    const redone = geometryStore_1.useGeometryStore.getState().objects.a;
    if (redone?.type !== "point") {
        throw new Error("redo keeps point A");
    }
    (0, assert_1.assertEqual)(redone.x, 7, "redo reapplies live sync geometry");
}
function assertIdentityAndDependencyPreservation() {
    const liveResult = (0, sync_1.createLiveTikzToGeometry)({
        currentObjects: baseScene(),
        origin: "tikz-editor",
        source: [
            "\\coordinate (A) at (2,0);",
            "\\coordinate (B) at (3,0);",
            "\\draw (A) -- (B);",
        ].join("\n"),
    });
    const segmentObject = liveResult.preview.applyResult.objectRecord.ab;
    (0, assert_1.assert)(liveResult.autoApplicable, "identity-preserving edit is auto-applicable");
    if (segmentObject?.type !== "segment") {
        throw new Error("segment identity is preserved");
    }
    (0, assert_1.assertEqual)(segmentObject.startPointId, "a", "segment dependency on A is preserved");
    (0, assert_1.assertEqual)(segmentObject.endPointId, "b", "segment dependency on B is preserved");
}
function largeScene(count) {
    const objects = {};
    for (let index = 0; index < count; index += 1) {
        objects[`p${index}`] = point(`p${index}`, `P${index}`, index, index % 10);
    }
    return objects;
}
function assertLargeScenePerformance() {
    const objects = largeScene(200);
    const startedAt = Date.now();
    const result = (0, sync_1.createLiveGeometryToTikz)({
        mode: "minimal",
        objects,
        origin: "system",
    });
    const elapsed = Date.now() - startedAt;
    (0, assert_1.assert)(result.tikz.code.length > 0, "large scene produces TikZ");
    (0, assert_1.assert)(elapsed < 2000, "large scene Geometry-to-TikZ sync stays responsive");
}
function assertPanelIntegrationAcceptancePath() {
    resetGeometryStore({
        a: point("a", "A", 0, 0),
    });
    geometryStore_1.useGeometryStore.getState().setSelectedObjects(["a"]);
    const generated = (0, tikz_1.generateTikz)(geometryStore_1.useGeometryStore.getState().objects, "academic").code;
    const edited = generated.replace("\\coordinate (A) at (0,0);", "\\coordinate (A) at (2,3);");
    const result = (0, liveTikzPanelSync_1.runLiveTikzPanelSync)({
        commitObjects: (objects, changedObjectIds) => geometryStore_1.useGeometryStore.getState().setObjects(objects, "Live TikZ sync", changedObjectIds),
        currentObjects: geometryStore_1.useGeometryStore.getState().objects,
        lastStamp: null,
        source: edited,
    });
    (0, assert_1.assertEqual)(result.status, "applied", "panel live sync helper applies safe coordinate edits");
    const movedPoint = geometryStore_1.useGeometryStore.getState().objects.a;
    if (movedPoint?.type !== "point") {
        throw new Error("panel live sync preserves point A identity");
    }
    (0, assert_1.assertEqual)(movedPoint.x, 2, "panel live sync updates canvas-backed point x");
    (0, assert_1.assertEqual)(movedPoint.y, 3, "panel live sync updates canvas-backed point y");
    (0, assert_1.assertEqual)(geometryStore_1.useGeometryStore.getState().selectedObjectIds[0], "a", "selection remains on point A for inspector/object tree");
    (0, assert_1.assert)(geometryStore_1.useGeometryStore.getState().canUndo, "panel live sync creates history for undo");
    geometryStore_1.useGeometryStore.getState().undo();
    const restoredPoint = geometryStore_1.useGeometryStore.getState().objects.a;
    if (restoredPoint?.type !== "point") {
        throw new Error("undo preserves point A identity");
    }
    (0, assert_1.assertEqual)(restoredPoint.x, 0, "undo restores point A x");
    (0, assert_1.assertEqual)(restoredPoint.y, 0, "undo restores point A y");
}
function assertTikzPanelGeneratedCodeState() {
    const generatedCode = "\\coordinate (A) at (0,0);";
    const updatedGeneratedCode = "\\coordinate (A) at (2,3);";
    const draftCode = "\\coordinate (A) at (5,6);";
    (0, assert_1.assert)((0, tikzPanelState_1.shouldFollowGeneratedTikz)({
        autoUpdate: false,
        editable: true,
        manualEditsPending: false,
    }), "editable mode without pending manual edits still follows generated TikZ");
    (0, assert_1.assert)((0, tikzPanelState_1.shouldFollowGeneratedTikz)({
        autoUpdate: false,
        editable: false,
        manualEditsPending: true,
    }), "readonly mode follows generated TikZ even if an old manual draft exists");
    (0, assert_1.assertEqual)((0, tikzPanelState_1.getTikzPanelDisplayedCode)({
        autoUpdate: false,
        draftCode,
        editable: true,
        generatedCode: updatedGeneratedCode,
        manualEditsPending: false,
    }), updatedGeneratedCode, "geometry changes update the panel when no manual edits are pending");
    (0, assert_1.assertEqual)((0, tikzPanelState_1.getTikzPanelDisplayedCode)({
        autoUpdate: false,
        draftCode,
        editable: true,
        generatedCode,
        manualEditsPending: true,
    }), draftCode, "pending manual edits keep the editable draft visible");
    (0, assert_1.assertIncludes)((0, tikzPanelState_1.getTikzPanelStatusText)({
        autoUpdate: false,
        liveSyncEnabled: true,
        liveSyncStatus: "blocked",
        manualEditsPending: true,
    }), "Manual edits pending", "manual TikZ edits are visible in panel status");
}
function assertGeneratedTikzAcceptanceCoverage() {
    const scene = {
        a: point("a", "A", 0, 0),
        ab: segment("ab", "a", "b"),
        b: point("b", "B", 2, 0),
        c: point("c", "C", 0, 2),
        circleA: circle("circleA", "a", 2),
        polygonAbc: polygon("polygonAbc", ["a", "b", "c"]),
        regionAbc: region("regionAbc", ["a", "b", "c"]),
    };
    const initialCode = (0, tikz_1.generateTikz)(scene, "academic").code;
    const movedCode = (0, tikz_1.generateTikz)({
        ...scene,
        a: point("a", "A", 1, 1),
    }, "academic").code;
    (0, assert_1.assertIncludes)(initialCode, "\\coordinate (A) at (0,0);", "creating point A generates a coordinate");
    (0, assert_1.assertIncludes)(initialCode, "\\coordinate (B) at (2,0);", "creating segment endpoint B generates a coordinate");
    (0, assert_1.assertIncludes)(initialCode, "(A) -- (B)", "creating segment AB generates a segment draw command");
    (0, assert_1.assertIncludes)(initialCode, "circle", "creating a circle generates a circle command");
    (0, assert_1.assertIncludes)(initialCode, "(A) -- (B) -- (C) -- cycle", "creating polygon ABC generates a closed polygon path");
    (0, assert_1.assertIncludes)(initialCode, "\\filldraw", "creating a region generates a fill command");
    (0, assert_1.assertIncludes)(movedCode, "\\coordinate (A) at (1,1);", "moving A regenerates its TikZ coordinate");
}
