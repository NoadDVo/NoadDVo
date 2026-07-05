import type { StateCreator } from "zustand";

import type { GeometryState } from "./geometryStoreTypes";
import { selectedIdsWithout } from "./geometryStoreUtils";

type SelectionActions = Pick<
  GeometryState,
  | "clearSelection"
  | "selectObject"
  | "setHoveredObject"
  | "setSelectedObjects"
>;

export const createSelectionStore: StateCreator<
  GeometryState,
  [],
  [],
  SelectionActions
> = (set, get) => ({
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
          ? selectedIdsWithout(state.selectedObjectIds, objectId)
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
      selectedObjectIds: Array.from(
        new Set(objectIds.filter((objectId) => state.objects[objectId])),
      ),
    }));
  },
});

