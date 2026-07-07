"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createImportStore = void 0;
const history_1 = require("../../core/history");
const exampleScenes_1 = require("./exampleScenes");
const geometryStoreUtils_1 = require("./geometryStoreUtils");
const createImportStore = (set, get) => ({
    clearProject: () => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const after = {
            objects: {},
            selectedObjectIds: [],
        };
        history_1.historyManager.record("new-project", "New project", before, after);
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            hoveredObjectId: null,
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: {},
            selectedObjectIds: [],
        }));
    },
    loadExample: (exampleId) => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const prepared = (0, geometryStoreUtils_1.prepareObjectsForCommit)((0, geometryStoreUtils_1.normalizeObjects)((0, exampleScenes_1.getExampleObjects)(exampleId)));
        if (!prepared.valid) {
            set({ lastError: prepared.error });
            return false;
        }
        history_1.historyManager.record("import", `Load ${exampleId} example`, before, {
            objects: prepared.objects,
            selectedObjectIds: [],
        });
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            hoveredObjectId: null,
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: prepared.objects,
            selectedObjectIds: [],
        }));
        return true;
    },
    setObjects: (input, description = "Import project", nextSelectedObjectIds) => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const prepared = (0, geometryStoreUtils_1.prepareObjectsForCommit)((0, geometryStoreUtils_1.normalizeObjects)(input));
        if (!prepared.valid) {
            set({ lastError: prepared.error });
            return false;
        }
        const selectedObjectIds = Array.from(new Set((nextSelectedObjectIds ?? get().selectedObjectIds).filter((objectId) => prepared.objects[objectId])));
        history_1.historyManager.record("import", description, before, {
            objects: prepared.objects,
            selectedObjectIds,
        });
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: prepared.objects,
            selectedObjectIds,
        }));
        return true;
    },
});
exports.createImportStore = createImportStore;
