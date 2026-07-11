"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runToolbarToolsTests = runToolbarToolsTests;
const geometry_1 = require("../../core/geometry");
const viewport_1 = require("../../core/geometry/viewport");
const ToolManager_1 = require("../../core/tools/ToolManager");
const LeftToolbar_1 = require("../../features/toolbar/LeftToolbar");
const assert_1 = require("../assert");
const viewport = {
    height: 240,
    offsetX: 0,
    offsetY: 0,
    scale: 48,
    width: 320,
};
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
function context(objects) {
    let selectedObjectIds = [];
    return {
        activeTool: "select",
        addObject: () => true,
        beginHistoryTransaction: () => { },
        cancelHistoryTransaction: () => { },
        clearSelection: () => {
            selectedObjectIds = [];
        },
        commitHistoryTransaction: () => { },
        deleteObject: () => { },
        gridSize: 1,
        hoveredObjectId: null,
        objects,
        pointerWorld: { x: 0.75, y: 0.75 },
        selectObject: (objectId) => {
            selectedObjectIds = [objectId];
        },
        get selectedObjectIds() {
            return selectedObjectIds;
        },
        setActiveTool: () => { },
        setHoveredObject: () => { },
        setObjects: () => true,
        setSelectedObjects: (objectIds) => {
            selectedObjectIds = objectIds;
        },
        snapEnabled: false,
        snapPoint: (screenPoint) => screenPoint,
        updateObject: () => true,
        viewport,
    };
}
function pointerEvent(pointObject) {
    return {
        altKey: false,
        button: 0,
        buttons: 1,
        ctrlKey: false,
        metaKey: false,
        pointerId: 1,
        screenPoint: (0, viewport_1.worldToScreen)(pointObject, viewport),
        shiftKey: false,
        snappedWorldPoint: pointObject,
        worldPoint: pointObject,
    };
}
function runToolbarToolsTests() {
    assertVisibleToolbarToolsResolveToRegisteredTools();
    assertVisibleToolbarLabelsMatchToolNames();
    assertStartedConstructionToolsRenderPreviews();
}
function assertVisibleToolbarToolsResolveToRegisteredTools() {
    const items = (0, LeftToolbar_1.getVisibleToolbarItems)();
    (0, assert_1.assert)(items.length >= 20, "toolbar exposes the complete visible MVP tool set");
    for (const item of items) {
        (0, assert_1.assertEqual)(ToolManager_1.toolManager.getTool(item.id).id, item.id, `visible toolbar tool "${item.label}" resolves to a registered tool`);
    }
}
function assertVisibleToolbarLabelsMatchToolNames() {
    for (const item of (0, LeftToolbar_1.getVisibleToolbarItems)()) {
        (0, assert_1.assertEqual)(item.label, ToolManager_1.toolManager.getTool(item.id).name, `toolbar label for ${item.id} matches the activated tool name`);
    }
}
function assertStartedConstructionToolsRenderPreviews() {
    const objects = {
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
    };
    const previewToolIds = [
        "midpoint",
        "parallel",
        "perpendicular",
        "perpendicular-bisector",
        "angle-bisector",
        "median",
        "altitude",
        "circumcircle",
        "incircle",
    ];
    for (const toolId of previewToolIds) {
        const tool = ToolManager_1.toolManager.getTool(toolId);
        const toolContext = context(objects);
        tool.deactivate(toolContext);
        tool.activate(toolContext);
        tool.pointerDown(pointerEvent(objects.a), toolContext);
        (0, assert_1.assert)(tool.renderPreview(toolContext) !== null, `${tool.name} renders a construction preview after first input`);
        tool.deactivate(toolContext);
    }
}
