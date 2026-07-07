"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHistoryStore = void 0;
const history_1 = require("../../core/history");
const geometryStoreUtils_1 = require("./geometryStoreUtils");
const createHistoryStore = (set, get) => ({
    beginHistoryTransaction: (kind, description) => {
        history_1.historyManager.beginTransaction(kind, description, (0, geometryStoreUtils_1.createHistorySnapshot)(get()));
    },
    cancelHistoryTransaction: () => {
        history_1.historyManager.cancelTransaction();
    },
    commitHistoryTransaction: () => {
        history_1.historyManager.commitTransaction((0, geometryStoreUtils_1.createHistorySnapshot)(get()));
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            historyVersion: state.historyVersion + 1,
        }));
    },
    redo: () => {
        const action = (0, history_1.redoCommand)(history_1.historyManager);
        if (!action) {
            return;
        }
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            hoveredObjectId: null,
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: action.after.objects,
            selectedObjectIds: action.after.selectedObjectIds.filter((objectId) => action.after.objects[objectId]),
        }));
    },
    undo: () => {
        const action = (0, history_1.undoCommand)(history_1.historyManager);
        if (!action) {
            return;
        }
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            hoveredObjectId: null,
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: action.before.objects,
            selectedObjectIds: action.before.selectedObjectIds.filter((objectId) => action.before.objects[objectId]),
        }));
    },
});
exports.createHistoryStore = createHistoryStore;
