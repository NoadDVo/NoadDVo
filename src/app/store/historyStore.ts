import type { StateCreator } from "zustand";

import {
  historyManager,
  redoCommand,
  undoCommand,
} from "../../core/history";
import type { GeometryState } from "./geometryStoreTypes";
import { createHistorySnapshot, getHistoryFlags } from "./geometryStoreUtils";

type HistoryActions = Pick<
  GeometryState,
  | "beginHistoryTransaction"
  | "cancelHistoryTransaction"
  | "commitHistoryTransaction"
  | "redo"
  | "undo"
>;

export const createHistoryStore: StateCreator<
  GeometryState,
  [],
  [],
  HistoryActions
> = (set, get) => ({
  beginHistoryTransaction: (kind, description) => {
    historyManager.beginTransaction(kind, description, createHistorySnapshot(get()));
  },
  cancelHistoryTransaction: () => {
    historyManager.cancelTransaction();
  },
  commitHistoryTransaction: () => {
    historyManager.commitTransaction(createHistorySnapshot(get()));
    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
    }));
  },
  redo: () => {
    const action = redoCommand(historyManager);

    if (!action) {
      return;
    }

    set((state) => ({
      ...getHistoryFlags(),
      hoveredObjectId: null,
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: action.after.objects,
      selectedObjectIds: action.after.selectedObjectIds.filter(
        (objectId) => action.after.objects[objectId],
      ),
    }));
  },
  undo: () => {
    const action = undoCommand(historyManager);

    if (!action) {
      return;
    }

    set((state) => ({
      ...getHistoryFlags(),
      hoveredObjectId: null,
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: action.before.objects,
      selectedObjectIds: action.before.selectedObjectIds.filter(
        (objectId) => action.before.objects[objectId],
      ),
    }));
  },
});

