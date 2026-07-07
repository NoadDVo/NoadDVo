"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGeometryStore = void 0;
const zustand_1 = require("zustand");
const historyStore_1 = require("./historyStore");
const importStore_1 = require("./importStore");
const objectStore_1 = require("./objectStore");
const selectionStore_1 = require("./selectionStore");
const toolStore_1 = require("./toolStore");
exports.useGeometryStore = (0, zustand_1.create)((set, get, store) => ({
    activeTool: "select",
    canRedo: false,
    canUndo: false,
    historyVersion: 0,
    hoveredObjectId: null,
    lastError: null,
    objects: {},
    selectedObjectIds: [],
    ...(0, objectStore_1.createObjectStore)(set, get, store),
    ...(0, selectionStore_1.createSelectionStore)(set, get, store),
    ...(0, toolStore_1.createToolStore)(set, get, store),
    ...(0, importStore_1.createImportStore)(set, get, store),
    ...(0, historyStore_1.createHistoryStore)(set, get, store),
}));
