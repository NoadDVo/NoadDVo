"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWorkspaceUxTests = runWorkspaceUxTests;
const geometryStore_1 = require("../../app/store/geometryStore");
const uiStore_1 = require("../../app/store/uiStore");
const clipboard_1 = require("../../core/clipboard");
const geometry_1 = require("../../core/geometry");
const history_1 = require("../../core/history");
const gridMath_1 = require("../../features/canvas/grid/gridMath");
const assert_1 = require("../assert");
function point(id, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        name: id.toUpperCase(),
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function segment() {
    return {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        name: "AB",
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
}
function runWorkspaceUxTests() {
    assertClipboardWorkflow();
    assertGridSettingsAffectLineCreation();
    assertThemeResolution();
}
function resetGeometryStore() {
    history_1.historyManager.clear();
    geometryStore_1.useGeometryStore.setState({
        canRedo: false,
        canUndo: false,
        historyVersion: 0,
        hoveredObjectId: null,
        lastError: null,
        objects: {},
        selectedObjectIds: [],
    });
}
function assertClipboardWorkflow() {
    resetGeometryStore();
    geometryStore_1.useGeometryStore.setState({
        objects: {
            a: point("a", 0, 0),
            ab: segment(),
            b: point("b", 1, 0),
        },
        selectedObjectIds: ["ab"],
    });
    (0, assert_1.assert)((0, clipboard_1.copySelectionToGeometryClipboard)(), "copy stores selected geometry plus dependencies");
    (0, assert_1.assert)((0, clipboard_1.pasteGeometryClipboard)(), "paste applies copied geometry through the geometry store");
    const afterPaste = geometryStore_1.useGeometryStore.getState();
    const pastedSegments = Object.values(afterPaste.objects).filter((object) => object.type === "segment");
    (0, assert_1.assertEqual)(pastedSegments.length, 2, "paste duplicates selected segment");
    (0, assert_1.assertEqual)(afterPaste.selectedObjectIds.length, 1, "paste selects pasted root objects");
    (0, assert_1.assert)(afterPaste.canUndo, "paste integrates with history");
    (0, assert_1.assert)((0, clipboard_1.duplicateSelection)(), "duplicate uses the shared clipboard workflow");
}
function assertGridSettingsAffectLineCreation() {
    const viewport = {
        height: 200,
        offsetX: 0,
        offsetY: 0,
        scale: 20,
        width: 200,
    };
    const withoutMinor = (0, gridMath_1.createGridLines)(viewport, {
        adaptiveGrid: false,
        gridSize: 1,
        majorGrid: true,
        minorGrid: false,
    });
    const withMinor = (0, gridMath_1.createGridLines)(viewport, {
        adaptiveGrid: false,
        gridSize: 1,
        majorGrid: true,
        minorGrid: true,
    });
    (0, assert_1.assert)(withMinor.length > withoutMinor.length, "minor grid setting increases rendered grid lines");
    (0, assert_1.assert)(withoutMinor.every((line) => line.major), "minor grid off keeps only major lines");
}
function assertThemeResolution() {
    (0, assert_1.assertEqual)((0, uiStore_1.resolveThemeMode)("dark-arctic", true), "dark-arctic", "explicit arctic theme resolves unchanged");
    (0, assert_1.assertEqual)((0, uiStore_1.resolveThemeMode)("dark", true), "dark", "explicit dark theme resolves unchanged");
    (0, assert_1.assertEqual)((0, uiStore_1.resolveThemeMode)("light", false), "light", "explicit light theme resolves unchanged");
    (0, assert_1.assertEqual)((0, uiStore_1.resolveThemeMode)("system", true), "light", "system theme follows light preference");
    (0, assert_1.assertEqual)((0, uiStore_1.resolveThemeMode)("system", false), "dark", "system theme follows dark preference");
}
