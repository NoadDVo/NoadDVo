"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createObjectStore = void 0;
const geometry_1 = require("../../core/geometry");
const history_1 = require("../../core/history");
const geometryStoreUtils_1 = require("./geometryStoreUtils");
const createObjectStore = (set, get) => ({
    addObject: (object) => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const prepared = (0, geometryStoreUtils_1.prepareObjectsForCommit)({
            ...get().objects,
            [object.id]: object,
        });
        if (!prepared.valid) {
            set({ lastError: prepared.error });
            return false;
        }
        history_1.historyManager.record(object.dependencies.length > 0 ? "construction" : "create", (0, geometryStoreUtils_1.historyDescriptionForObject)("create", object), before, {
            objects: prepared.objects,
            selectedObjectIds: before.selectedObjectIds,
        });
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: prepared.objects,
        }));
        return true;
    },
    deleteObject: (objectId) => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const graphResult = geometry_1.DependencyGraph.fromObjects(get().objects);
        if (!graphResult.valid) {
            set({
                lastError: {
                    code: graphResult.error.code,
                    message: graphResult.error.message,
                    ...(graphResult.error.objectId ? { objectId: graphResult.error.objectId } : {}),
                    severity: "error",
                },
            });
            return;
        }
        const objectIdsToDelete = new Set([
            objectId,
            ...graphResult.value.getDependentIds(objectId),
        ]);
        const remainingObjects = { ...get().objects };
        objectIdsToDelete.forEach((deletedObjectId) => {
            delete remainingObjects[deletedObjectId];
        });
        const prepared = (0, geometryStoreUtils_1.prepareObjectsForCommit)(remainingObjects);
        if (!prepared.valid) {
            set({ lastError: prepared.error });
            return;
        }
        const afterSelectedObjectIds = get().selectedObjectIds.filter((selectedObjectId) => !objectIdsToDelete.has(selectedObjectId));
        history_1.historyManager.record("delete", objectIdsToDelete.size > 1 ? "Delete objects" : "Delete object", before, {
            objects: prepared.objects,
            selectedObjectIds: afterSelectedObjectIds,
        });
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            hoveredObjectId: state.hoveredObjectId && objectIdsToDelete.has(state.hoveredObjectId)
                ? null
                : state.hoveredObjectId,
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: prepared.objects,
            selectedObjectIds: afterSelectedObjectIds,
        }));
    },
    updateObject: (objectId, updater) => {
        const before = (0, geometryStoreUtils_1.createHistorySnapshot)(get());
        const currentObject = get().objects[objectId];
        if (!currentObject) {
            set({
                lastError: {
                    code: "GEOMETRY_OBJECT_NOT_FOUND",
                    message: "Cannot update an object that does not exist.",
                    objectId,
                    severity: "error",
                },
            });
            return false;
        }
        const nextObject = typeof updater === "function" ? updater(currentObject) : updater;
        if (nextObject.id !== objectId) {
            set({
                lastError: {
                    code: "GEOMETRY_ID_MISMATCH",
                    message: "Updated object must keep the same immutable ID.",
                    objectId,
                    severity: "error",
                },
            });
            return false;
        }
        const prepared = (0, geometryStoreUtils_1.prepareObjectsForCommit)({
            ...get().objects,
            [objectId]: nextObject,
        });
        if (!prepared.valid) {
            set({ lastError: prepared.error });
            return false;
        }
        const propagated = (0, geometry_1.propagateGeometryUpdates)(prepared.objects, objectId);
        if (!propagated.valid) {
            set({ lastError: propagated.error });
            return false;
        }
        history_1.historyManager.record("update", (0, geometryStoreUtils_1.historyDescriptionForObject)("update", nextObject), before, {
            objects: propagated.objects,
            selectedObjectIds: before.selectedObjectIds,
        });
        set((state) => ({
            ...(0, geometryStoreUtils_1.getHistoryFlags)(),
            historyVersion: state.historyVersion + 1,
            lastError: null,
            objects: propagated.objects,
        }));
        return true;
    },
});
exports.createObjectStore = createObjectStore;
