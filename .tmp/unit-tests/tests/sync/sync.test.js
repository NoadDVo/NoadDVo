"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSyncTests = runSyncTests;
const geometry_1 = require("../../core/geometry");
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
function runSyncTests() {
    assertGeometryToTikzSyncPlan();
    assertTikzToGeometrySyncPlan();
    assertSyncDiagnostics();
    assertSyncEngineFacade();
}
function assertGeometryToTikzSyncPlan() {
    const objects = {
        a: point("a", "A", 0, 0),
        ab: segment("ab", "a", "b"),
        b: point("b", "B", 1, 0),
    };
    const result = (0, sync_1.syncGeometryToTikz)({ objects, sourceId: "scene-a" });
    (0, assert_1.assertEqual)(result.direction, "geometry-to-tikz", "sync result records geometry-to-tikz direction");
    (0, assert_1.assertEqual)(result.status, "ready", "valid geometry-to-tikz sync is ready");
    (0, assert_1.assertIncludes)(result.tikz.code, "\\coordinate (A) at (0,0);", "sync output includes generated TikZ");
    (0, assert_1.assertEqual)(result.plan.operations[0]?.type, "generate-tikz", "geometry-to-tikz sync plans generation");
    (0, assert_1.assertEqual)(result.intermediate.source, "geometry", "geometry sync creates geometry intermediate scene");
    (0, assert_1.assert)(result.intermediate.objects.some((object) => object.objectId === "a" && object.tikzName === "A"), "geometry intermediate preserves point TikZ names");
}
function assertTikzToGeometrySyncPlan() {
    const source = [
        "\\coordinate (A) at (0,0);",
        "\\coordinate (B) at (2,0);",
        "\\draw (A) -- (B);",
    ].join("\n");
    const result = (0, sync_1.syncTikzToGeometry)({ source, sourceId: "tikz-a" });
    (0, assert_1.assertEqual)(result.direction, "tikz-to-geometry", "sync result records tikz-to-geometry direction");
    (0, assert_1.assertEqual)(result.status, "ready", "supported TikZ sync is ready");
    (0, assert_1.assert)(result.validation.valid, "tikz-to-geometry validates recovered objects");
    (0, assert_1.assertEqual)(result.plan.operations[0]?.type, "parse-tikz", "tikz-to-geometry sync starts with parsing");
    (0, assert_1.assertEqual)(result.intermediate.source, "tikz", "tikz sync creates TikZ intermediate scene");
    (0, assert_1.assert)(result.objectRecord["point-A"]?.type === "point", "TikZ sync recovers named point A");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "segment"), "TikZ sync recovers segment geometry");
}
function assertSyncDiagnostics() {
    const result = (0, sync_1.syncTikzToGeometry)({
        source: ["\\coordinate (A) at (0,0);", "\\shade (A) circle (1);"].join("\n"),
    });
    (0, assert_1.assertEqual)(result.status, "partial", "unsupported recoverable TikZ yields partial sync status");
    (0, assert_1.assert)(result.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_UNSUPPORTED_COMMAND" &&
        diagnostic.severity === "warning" &&
        diagnostic.direction === "tikz-to-geometry"), "sync diagnostics include normalized parser warnings");
}
function assertSyncEngineFacade() {
    const objects = {
        a: point("a", "A", 0, 0),
    };
    const geometryResult = sync_1.syncEngine.syncGeometryToTikz({ objects });
    const tikzResult = sync_1.syncEngine.syncTikzToGeometry({
        source: "\\coordinate (A) at (0,0);",
    });
    (0, assert_1.assertEqual)(geometryResult.direction, "geometry-to-tikz", "sync engine exposes geometry-to-tikz");
    (0, assert_1.assertEqual)(tikzResult.direction, "tikz-to-geometry", "sync engine exposes tikz-to-geometry");
}
