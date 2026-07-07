"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultKeyboardActions = void 0;
const geometryStore_1 = require("../../app/store/geometryStore");
const uiStore_1 = require("../../app/store/uiStore");
const viewportStore_1 = require("../../app/store/viewportStore");
const clipboard_1 = require("../clipboard");
const context_1 = require("../context");
const ToolManager_1 = require("../tools/ToolManager");
function deleteSelectedObjects() {
    const geometry = geometryStore_1.useGeometryStore.getState();
    const deletableIds = geometry.selectedObjectIds.filter((objectId) => {
        const object = geometry.objects[objectId];
        return object && !object.locked;
    });
    if (deletableIds.length === 0) {
        return;
    }
    geometry.beginHistoryTransaction("delete", "Delete selection");
    deletableIds.forEach((objectId) => {
        geometry.deleteObject(objectId);
    });
    geometry.commitHistoryTransaction();
}
function selectAllVisibleObjects() {
    const geometry = geometryStore_1.useGeometryStore.getState();
    geometry.setSelectedObjects(Object.values(geometry.objects)
        .filter((object) => object.visible)
        .map((object) => object.id));
}
function clearWorkspaceInteraction() {
    context_1.contextMenuManager.close();
    ToolManager_1.toolManager.cancel();
    geometryStore_1.useGeometryStore.getState().clearSelection();
}
exports.defaultKeyboardActions = [
    {
        execute: () => geometryStore_1.useGeometryStore.getState().undo(),
        id: "undo",
        label: "Undo",
        preventDefault: true,
        shortcut: { ctrl: true, key: "z" },
    },
    {
        execute: () => geometryStore_1.useGeometryStore.getState().redo(),
        id: "redo-shift-z",
        label: "Redo",
        preventDefault: true,
        shortcut: { ctrl: true, key: "z", shift: true },
    },
    {
        execute: () => geometryStore_1.useGeometryStore.getState().redo(),
        id: "redo-y",
        label: "Redo",
        preventDefault: true,
        shortcut: { ctrl: true, key: "y" },
    },
    {
        execute: () => uiStore_1.useUiStore.getState().setCommandPaletteOpen(true),
        id: "open-command-palette",
        label: "Open command palette",
        preventDefault: true,
        shortcut: { ctrl: true, key: "k" },
    },
    {
        execute: deleteSelectedObjects,
        id: "delete-selection",
        label: "Delete selected objects",
        preventDefault: true,
        shortcut: { key: "delete" },
    },
    {
        execute: clearWorkspaceInteraction,
        id: "escape",
        label: "Cancel current operation",
        preventDefault: true,
        shortcut: { key: "escape" },
    },
    {
        execute: selectAllVisibleObjects,
        id: "select-all",
        label: "Select all visible objects",
        preventDefault: true,
        shortcut: { ctrl: true, key: "a" },
    },
    {
        execute: clipboard_1.copySelectionToGeometryClipboard,
        id: "copy-selection",
        label: "Copy selected geometry",
        preventDefault: true,
        shortcut: { ctrl: true, key: "c" },
    },
    {
        execute: clipboard_1.cutSelectionToGeometryClipboard,
        id: "cut-selection",
        label: "Cut selected geometry",
        preventDefault: true,
        shortcut: { ctrl: true, key: "x" },
    },
    {
        execute: clipboard_1.pasteGeometryClipboard,
        id: "paste-selection",
        label: "Paste geometry",
        preventDefault: true,
        shortcut: { ctrl: true, key: "v" },
    },
    {
        execute: clipboard_1.duplicateSelection,
        id: "duplicate-selection",
        label: "Duplicate selected geometry",
        preventDefault: true,
        shortcut: { ctrl: true, key: "d" },
    },
    {
        execute: (_context) => {
            viewportStore_1.useViewportStore.getState().setSpacePressed(true);
            uiStore_1.useUiStore.getState().setKeyboardModeHint("pan");
        },
        id: "hold-space-pan",
        label: "Temporary pan",
        preventDefault: true,
        repeatable: false,
        shortcut: { key: " " },
    },
    {
        execute: () => {
            viewportStore_1.useViewportStore.getState().setSnapTemporarilyDisabled(true);
            uiStore_1.useUiStore.getState().setKeyboardModeHint("snap-off");
        },
        id: "hold-alt-disable-snap",
        label: "Temporarily disable snapping",
        preventDefault: true,
        repeatable: false,
        shortcut: { key: "alt" },
    },
    {
        execute: () => {
            uiStore_1.useUiStore.getState().setKeyboardModeHint("constraint");
        },
        id: "hold-shift-constraint",
        label: "Constraint mode",
        repeatable: false,
        shortcut: { key: "shift" },
    },
];
