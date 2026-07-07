"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelectionStore = void 0;
const geometryStoreUtils_1 = require("./geometryStoreUtils");
const createSelectionStore = (set, get) => ({
    clearSelection: () => {
        set({ selectedObjectIds: [] });
    },
    selectObject: (objectId, additive = false) => {
        if (!get().objects[objectId]) {
            return;
        }
        set((state) => {
            if (!additive) {
                return { selectedObjectIds: [objectId] };
            }
            const isSelected = state.selectedObjectIds.includes(objectId);
            return {
                selectedObjectIds: isSelected
                    ? (0, geometryStoreUtils_1.selectedIdsWithout)(state.selectedObjectIds, objectId)
                    : [...state.selectedObjectIds, objectId],
            };
        });
    },
    setHoveredObject: (objectId) => {
        set((state) => ({
            hoveredObjectId: objectId && state.objects[objectId] ? objectId : null,
        }));
    },
    setSelectedObjects: (objectIds) => {
        set((state) => ({
            selectedObjectIds: Array.from(new Set(objectIds.filter((objectId) => state.objects[objectId]))),
        }));
    },
});
exports.createSelectionStore = createSelectionStore;
