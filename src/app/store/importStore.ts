import type { StateCreator } from "zustand";

import { historyManager } from "../../core/history";
import { getExampleObjects } from "./exampleScenes";
import type { GeometryState } from "./geometryStoreTypes";
import {
  createHistorySnapshot,
  getHistoryFlags,
  normalizeObjects,
  prepareObjectsForCommit,
} from "./geometryStoreUtils";

type ImportActions = Pick<
  GeometryState,
  "clearProject" | "loadExample" | "setObjects"
>;

export const createImportStore: StateCreator<
  GeometryState,
  [],
  [],
  ImportActions
> = (set, get) => ({
  clearProject: () => {
    const before = createHistorySnapshot(get());
    const after = {
      objects: {},
      selectedObjectIds: [],
    };

    historyManager.record("new-project", "New project", before, after);

    set((state) => ({
      ...getHistoryFlags(),
      hoveredObjectId: null,
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: {},
      selectedObjectIds: [],
    }));
  },
  loadExample: (exampleId) => {
    const before = createHistorySnapshot(get());
    const prepared = prepareObjectsForCommit(normalizeObjects(getExampleObjects(exampleId)));

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    historyManager.record(
      "import",
      `Load ${exampleId} example`,
      before,
      {
        objects: prepared.objects,
        selectedObjectIds: [],
      },
    );

    set((state) => ({
      ...getHistoryFlags(),
      hoveredObjectId: null,
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds: [],
    }));

    return true;
  },
  setObjects: (input, description = "Import project", nextSelectedObjectIds) => {
    const before = createHistorySnapshot(get());
    const prepared = prepareObjectsForCommit(normalizeObjects(input));

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    const selectedObjectIds = Array.from(
      new Set(
        (nextSelectedObjectIds ?? get().selectedObjectIds).filter(
          (objectId) => prepared.objects[objectId],
        ),
      ),
    );

    historyManager.record(
      "import",
      description,
      before,
      {
        objects: prepared.objects,
        selectedObjectIds,
      },
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds,
    }));

    return true;
  },
});

