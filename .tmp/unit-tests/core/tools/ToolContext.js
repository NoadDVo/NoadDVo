"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolContext = createToolContext;
exports.createToolPointerEvent = createToolPointerEvent;
const snap_1 = require("../geometry/snap");
const viewport_1 = require("../geometry/viewport");
const geometryStore_1 = require("../../app/store/geometryStore");
const viewportStore_1 = require("../../app/store/viewportStore");
function createToolContext() {
    const geometryState = geometryStore_1.useGeometryStore.getState();
    const viewportState = viewportStore_1.useViewportStore.getState();
    return {
        activeTool: geometryState.activeTool,
        addObject: geometryState.addObject,
        beginHistoryTransaction: geometryState.beginHistoryTransaction,
        cancelHistoryTransaction: geometryState.cancelHistoryTransaction,
        clearSelection: geometryState.clearSelection,
        commitHistoryTransaction: geometryState.commitHistoryTransaction,
        deleteObject: geometryState.deleteObject,
        gridSize: viewportState.gridSize,
        hoveredObjectId: geometryState.hoveredObjectId,
        objects: geometryState.objects,
        pointerWorld: viewportState.pointerWorld,
        selectObject: geometryState.selectObject,
        selectedObjectIds: geometryState.selectedObjectIds,
        setHoveredObject: geometryState.setHoveredObject,
        setActiveTool: geometryState.setActiveTool,
        setSelectedObjects: geometryState.setSelectedObjects,
        setObjects: geometryState.setObjects,
        snapEnabled: viewportState.snapEnabled && !viewportState.snapTemporarilyDisabled,
        snapPoint: (point) => viewportState.snapEnabled && !viewportState.snapTemporarilyDisabled
            ? (0, snap_1.snapToGrid)(point, viewportState.gridSize)
            : point,
        updateObject: geometryState.updateObject,
        viewport: viewportState.viewport,
    };
}
function createToolPointerEvent(input, context) {
    const worldPoint = (0, viewport_1.screenToWorld)(input.screenPoint, context.viewport);
    return {
        altKey: input.altKey,
        button: input.button,
        buttons: input.buttons,
        ctrlKey: input.ctrlKey,
        metaKey: input.metaKey,
        pointerId: input.pointerId,
        screenPoint: input.screenPoint,
        shiftKey: input.shiftKey,
        snappedWorldPoint: context.snapPoint(worldPoint),
        worldPoint,
    };
}
