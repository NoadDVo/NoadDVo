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

type SetObjectsInput = GeometryObjectRecord | readonly GeometryObject[];
type GeometryObjectUpdater =
  | GeometryObject
  | ((currentObject: GeometryObject) => GeometryObject);

type GeometryState = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly hoveredObjectId: string | null;
  readonly activeTool: GeometryToolId;
  readonly lastError: GeometryError | null;
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
  readonly setObjects: (objects: SetObjectsInput) => boolean;
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
      fill: "#f4fbff",
      pointSize: 5,
      stroke: "#7ddcff",
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
      fill: "#f4fbff",
      pointSize: 5,
      stroke: "#7ddcff",
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
      fill: "#f4fbff",
      pointSize: 5,
      stroke: "#7ddcff",
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
      stroke: "#dff6ff",
      strokeOpacity: 0.95,
      strokeWidth: 2.5,
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
      fill: "#7ddcff",
      fillOpacity: 0.1,
      stroke: "#9ee8ff",
      strokeOpacity: 0.86,
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
      stroke: "#b8f3ff",
      strokeOpacity: 0.62,
      strokeWidth: 1.75,
    },
  },
] satisfies readonly GeometryObject[];

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

const initialObjects = normalizeObjects(sampleSceneObjects);

export const useGeometryStore = create<GeometryState>((set, get) => ({
  objects: initialObjects,
  selectedObjectIds: ["triangle-abc"],
  hoveredObjectId: null,
  activeTool: "select",
  lastError: null,
  addObject: (object) => {
    const prepared = prepareObjectsForCommit({
      ...get().objects,
      [object.id]: object,
    });

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    set({
      lastError: null,
      objects: prepared.objects,
    });

    return true;
  },
  updateObject: (objectId, updater) => {
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

    set({
      lastError: null,
      objects: propagated.objects,
    });

    return true;
  },
  deleteObject: (objectId) => {
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

    set((state) => ({
      hoveredObjectId:
        state.hoveredObjectId && objectIdsToDelete.has(state.hoveredObjectId)
          ? null
          : state.hoveredObjectId,
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds: state.selectedObjectIds.filter(
        (selectedObjectId) => !objectIdsToDelete.has(selectedObjectId),
      ),
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
  setObjects: (input) => {
    const prepared = prepareObjectsForCommit(normalizeObjects(input));

    if (!prepared.valid) {
      set({ lastError: prepared.error });

      return false;
    }

    set((state) => ({
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds: state.selectedObjectIds.filter(
        (objectId) => prepared.objects[objectId],
      ),
    }));

    return true;
  },
}));
