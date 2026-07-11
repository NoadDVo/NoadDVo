import { create } from "zustand";

import { createHistoryStore } from "./historyStore";
import { createImportStore } from "./importStore";
import { createObjectStore } from "./objectStore";
import { createSelectionStore } from "./selectionStore";
import { createToolStore } from "./toolStore";
import type { ExampleSceneId, GeometryState } from "./geometryStoreTypes";

export type { ExampleSceneId, GeometryState };

export const useGeometryStore = create<GeometryState>((set, get, store) => ({
  activeTool: "select",
  canRedo: false,
  canUndo: false,
  historyVersion: 0,
  hoveredObjectId: null,
  lastError: null,
  objects: {},
  selectedObjectIds: [],
  ...createObjectStore(set, get, store),
  ...createSelectionStore(set, get, store),
  ...createToolStore(set, get, store),
  ...createImportStore(set, get, store),
  ...createHistoryStore(set, get, store),
}));

