import { create } from "zustand";

import {
  DEFAULT_GEOMETRY_STYLE,
  DependencyGraph,
  normalizeDependencyMetadata,
  propagateGeometryUpdates,
  validateGeometryObjects,
  type BaseGeometryObject,
  type GeometryError,
  type GeometryObject,
  type GeometryObjectRecord,
  type GeometryToolId,
} from "../../core/geometry";
import {
  historyManager,
  redoCommand,
  undoCommand,
  type HistoryActionKind,
  type HistorySnapshot,
} from "../../core/history";

type SetObjectsInput = GeometryObjectRecord | readonly GeometryObject[];
export type ExampleSceneId =
  | "triangle"
  | "circle"
  | "olympiad"
  | "coordinate";
type GeometryObjectUpdater =
  | GeometryObject
  | ((currentObject: GeometryObject) => GeometryObject);

type GeometryState = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly hoveredObjectId: string | null;
  readonly activeTool: GeometryToolId;
  readonly lastError: GeometryError | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly historyVersion: number;
  readonly addObject: (object: GeometryObject) => boolean;
  readonly updateObject: (
    objectId: string,
    updater: GeometryObjectUpdater,
  ) => boolean;
  readonly deleteObject: (objectId: string) => void;
  readonly selectObject: (objectId: string, additive?: boolean) => void;
  readonly setSelectedObjects: (objectIds: readonly string[]) => void;
  readonly setHoveredObject: (objectId: string | null) => void;
  readonly clearSelection: () => void;
  readonly setActiveTool: (toolId: GeometryToolId) => void;
  readonly setObjects: (
    objects: SetObjectsInput,
    description?: string,
    selectedObjectIds?: readonly string[],
  ) => boolean;
  readonly clearProject: () => void;
  readonly loadExample: (exampleId: ExampleSceneId) => boolean;
  readonly beginHistoryTransaction: (
    kind: HistoryActionKind,
    description: string,
  ) => void;
  readonly commitHistoryTransaction: () => void;
  readonly cancelHistoryTransaction: () => void;
  readonly undo: () => void;
  readonly redo: () => void;
};

function normalizeObjects(input: SetObjectsInput): GeometryObjectRecord {
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map((object) => [object.id, object]),
    ) as GeometryObjectRecord;
  }

  return input as GeometryObjectRecord;
}

function selectedIdsWithout(
  selectedObjectIds: readonly string[],
  objectId: string,
): readonly string[] {
  return selectedObjectIds.filter((selectedObjectId) => selectedObjectId !== objectId);
}

function prepareObjectsForCommit(
  objects: GeometryObjectRecord,
): { readonly valid: true; readonly objects: GeometryObjectRecord } | { readonly valid: false; readonly error: GeometryError } {
  const normalizedObjects = normalizeDependencyMetadata(objects);
  const result = validateGeometryObjects(normalizedObjects);

  if (!result.valid) {
    return { error: result.error, valid: false };
  }

  return { objects: normalizedObjects, valid: true };
}

function createHistorySnapshot(state: Pick<GeometryState, "objects" | "selectedObjectIds">): HistorySnapshot {
  return {
    objects: state.objects,
    selectedObjectIds: state.selectedObjectIds,
  };
}

function getHistoryFlags() {
  return {
    canRedo: historyManager.canRedo,
    canUndo: historyManager.canUndo,
  };
}

function historyDescriptionForObject(
  kind: HistoryActionKind,
  object: GeometryObject,
): string {
  if (kind === "create") {
    return `Create ${object.type}`;
  }

  if (kind === "delete") {
    return `Delete ${object.type}`;
  }

  return `Update ${object.type}`;
}

const sampleSceneObjects = [
  {
    ...baseObject("point-a", "point", "A", [], [
      "segment-ab",
      "triangle-abc",
      "circle-a-through-b",
    ]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: -2,
    y: -1,
  },
  {
    ...baseObject("point-b", "point", "B", [], [
      "segment-ab",
      "triangle-abc",
      "circle-a-through-b",
    ]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: 3,
    y: -1,
  },
  {
    ...baseObject("point-c", "point", "C", [], ["triangle-abc"]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: 0.5,
    y: 2.6,
  },
  {
    ...baseObject("segment-ab", "segment", "AB", ["point-a", "point-b"], []),
    endPointId: "point-b",
    startPointId: "point-a",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 0.95,
      strokeWidth: 2,
    },
  },
  {
    ...baseObject(
      "triangle-abc",
      "polygon",
      "Triangle ABC",
      ["point-a", "point-b", "point-c"],
      [],
    ),
    closed: true,
    pointIds: ["point-a", "point-b", "point-c"],
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      fillOpacity: 0,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
  },
  {
    ...baseObject(
      "circle-a-through-b",
      "circle",
      "Circle A,B",
      ["point-a", "point-b"],
      [],
    ),
    centerPointId: "point-a",
    circleKind: "center-point",
    radiusPointId: "point-b",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
  },
] satisfies readonly GeometryObject[];

const circleExampleObjects = [
  {
    ...baseObject("circle-center", "point", "O", [], ["circle-radius"]),
    pointKind: "free",
    x: 0,
    y: 0,
  },
  {
    ...baseObject("circle-radius-point", "point", "A", [], ["circle-radius"]),
    pointKind: "free",
    x: 3,
    y: 0,
  },
  {
    ...baseObject("circle-radius", "circle", "c1", ["circle-center", "circle-radius-point"], []),
    centerPointId: "circle-center",
    circleKind: "center-point",
    radiusPointId: "circle-radius-point",
  },
] satisfies readonly GeometryObject[];

const coordinateExampleObjects = [
  {
    ...baseObject("coord-a", "point", "A", [], ["coord-ab"]),
    pointKind: "free",
    x: -4,
    y: -2,
  },
  {
    ...baseObject("coord-b", "point", "B", [], ["coord-ab"]),
    pointKind: "free",
    x: 3,
    y: 2,
  },
  {
    ...baseObject("coord-ab", "segment", "AB", ["coord-a", "coord-b"], []),
    endPointId: "coord-b",
    startPointId: "coord-a",
  },
] satisfies readonly GeometryObject[];

const olympiadExampleObjects = [
  ...sampleSceneObjects,
  {
    ...baseObject("olympiad-d", "point", "D", [], ["olympiad-cd"]),
    pointKind: "free",
    x: 0.5,
    y: -1,
  },
  {
    ...baseObject("olympiad-cd", "segment", "CD", ["point-c", "olympiad-d"], []),
    endPointId: "olympiad-d",
    startPointId: "point-c",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      dash: "dashed",
      stroke: "#747b84",
      strokeWidth: 1.5,
    },
  },
] satisfies readonly GeometryObject[];

function getExampleObjects(exampleId: ExampleSceneId): readonly GeometryObject[] {
  if (exampleId === "circle") {
    return circleExampleObjects;
  }

  if (exampleId === "coordinate") {
    return coordinateExampleObjects;
  }

  if (exampleId === "olympiad") {
    return olympiadExampleObjects;
  }

  return sampleSceneObjects;
}

function baseObject<TType extends GeometryObject["type"]>(
  id: string,
  type: TType,
  name: string,
  dependencies: readonly string[],
  dependents: readonly string[],
): BaseGeometryObject & { readonly type: TType } {
  return {
    createdAt: 0,
    dependencies,
    dependents,
    id,
    locked: false,
    name,
    style: DEFAULT_GEOMETRY_STYLE,
    type,
    updatedAt: 0,
    visible: true,
  };
}

const initialObjects = normalizeObjects([]);

export const useGeometryStore = create<GeometryState>((set, get) => ({
  objects: initialObjects,
  selectedObjectIds: [],
  hoveredObjectId: null,
  activeTool: "select",
  lastError: null,
  canRedo: false,
  canUndo: false,
  historyVersion: 0,
  addObject: (object) => {
    const before = createHistorySnapshot(get());
    const prepared = prepareObjectsForCommit({
      ...get().objects,
      [object.id]: object,
    });

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    const after = {
      objects: prepared.objects,
      selectedObjectIds: before.selectedObjectIds,
    };

    historyManager.record(
      object.dependencies.length > 0 ? "construction" : "create",
      historyDescriptionForObject("create", object),
      before,
      after,
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
    }));

    return true;
  },
  updateObject: (objectId, updater) => {
    const before = createHistorySnapshot(get());
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

    const nextObject =
      typeof updater === "function" ? updater(currentObject) : updater;

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

    const prepared = prepareObjectsForCommit({
      ...get().objects,
      [objectId]: nextObject,
    });

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    const propagated = propagateGeometryUpdates(prepared.objects, objectId);

    if (!propagated.valid) {
      set({ lastError: propagated.error });

      return false;
    }

    const after = {
      objects: propagated.objects,
      selectedObjectIds: before.selectedObjectIds,
    };

    historyManager.record(
      "update",
      historyDescriptionForObject("update", nextObject),
      before,
      after,
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: propagated.objects,
    }));

    return true;
  },
  deleteObject: (objectId) => {
    const before = createHistorySnapshot(get());
    const normalizedObjects = normalizeDependencyMetadata(get().objects);
    const graphResult = DependencyGraph.fromObjects(normalizedObjects);

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
    const remainingObjects = { ...normalizedObjects };

    objectIdsToDelete.forEach((deletedObjectId) => {
      delete remainingObjects[deletedObjectId];
    });
    const prepared = prepareObjectsForCommit(remainingObjects);

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return;
    }

    const afterSelectedObjectIds = get().selectedObjectIds.filter(
      (selectedObjectId) => !objectIdsToDelete.has(selectedObjectId),
    );

    historyManager.record(
      "delete",
      objectIdsToDelete.size > 1 ? "Delete objects" : "Delete object",
      before,
      {
        objects: prepared.objects,
        selectedObjectIds: afterSelectedObjectIds,
      },
    );

    set((state) => ({
      ...getHistoryFlags(),
      hoveredObjectId:
        state.hoveredObjectId && objectIdsToDelete.has(state.hoveredObjectId)
          ? null
          : state.hoveredObjectId,
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds: afterSelectedObjectIds,
    }));
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
  setSelectedObjects: (objectIds) => {
    set((state) => ({
      selectedObjectIds: Array.from(
        new Set(objectIds.filter((objectId) => state.objects[objectId])),
      ),
    }));
  },
  setHoveredObject: (objectId) => {
    set((state) => ({
      hoveredObjectId: objectId && state.objects[objectId] ? objectId : null,
    }));
  },
  clearSelection: () => {
    set({ selectedObjectIds: [] });
  },
  setActiveTool: (toolId) => {
    set({ activeTool: toolId });
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
  beginHistoryTransaction: (kind, description) => {
    historyManager.beginTransaction(kind, description, createHistorySnapshot(get()));
  },
  commitHistoryTransaction: () => {
    historyManager.commitTransaction(createHistorySnapshot(get()));
    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
    }));
  },
  cancelHistoryTransaction: () => {
    historyManager.cancelTransaction();
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
}));
