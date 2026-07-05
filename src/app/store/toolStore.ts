import type { StateCreator } from "zustand";

import type { GeometryState } from "./geometryStoreTypes";

type ToolActions = Pick<GeometryState, "setActiveTool">;

export const createToolStore: StateCreator<
  GeometryState,
  [],
  [],
  ToolActions
> = (set) => ({
  setActiveTool: (toolId) => {
    set({ activeTool: toolId });
  },
});

