import { create } from "zustand";

import {
  DEFAULT_GEOMETRY_STYLE,
  validateGeometryObject,
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
  readonly activeTool: GeometryToolId;
  readonly lastError: GeometryError | null;
  readonly addObject: (object: GeometryObject) => boolean;
  readonly updateObject: (
    objectId: string,
    updater: GeometryObjectUpdater,
  ) => boolean;
  readonly deleteObject: (objectId: string) => void;
  readonly selectObject: (objectId: string, additive?: boolean) => void;
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
  activeTool: "select",
  lastError: null,
  addObject: (object) => {
    const nextObjects = {
      ...get().objects,
      [object.id]: object,
    };
    const result = validateGeometryObject(object, nextObjects);

    if (!result.valid) {
      set({ lastError: result.error });

      return false;
    }

    set({
      lastError: null,
      objects: nextObjects,
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

    const nextObjects = {
      ...get().objects,
      [objectId]: nextObject,
    };
    const result = validateGeometryObject(nextObject, nextObjects);

    if (!result.valid) {
      set({ lastError: result.error });

      return false;
    }

    set({
      lastError: null,
      objects: nextObjects,
    });

    return true;
  },
  deleteObject: (objectId) => {
    const remainingObjects = { ...get().objects };

    delete remainingObjects[objectId];

    set((state) => ({
      lastError: null,
      objects: remainingObjects,
      selectedObjectIds: selectedIdsWithout(state.selectedObjectIds, objectId),
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
  clearSelection: () => {
    set({ selectedObjectIds: [] });
  },
  setActiveTool: (toolId) => {
    set({ activeTool: toolId });
  },
  setObjects: (input) => {
    const objects = normalizeObjects(input);
    const result = validateGeometryObjects(objects);

    if (!result.valid) {
      set({ lastError: result.error });

      return false;
    }

    set((state) => ({
      lastError: null,
      objects,
      selectedObjectIds: state.selectedObjectIds.filter(
        (objectId) => objects[objectId],
      ),
    }));

    return true;
  },
}));
