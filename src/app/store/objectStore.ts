import type { StateCreator } from "zustand";

import {
  DependencyGraph,
  propagateGeometryUpdates,
} from "../../core/geometry";
import { historyManager } from "../../core/history";
import type { GeometryState } from "./geometryStoreTypes";
import {
  createHistorySnapshot,
  getHistoryFlags,
  historyDescriptionForObject,
  prepareObjectsForCommit,
} from "./geometryStoreUtils";

type ObjectActions = Pick<
  GeometryState,
  "addObject" | "deleteObject" | "mergePoints" | "updateObject"
>;

export const createObjectStore: StateCreator<
  GeometryState,
  [],
  [],
  ObjectActions
> = (set, get) => ({
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

    historyManager.record(
      object.dependencies.length > 0 ? "construction" : "create",
      historyDescriptionForObject("create", object),
      before,
      {
        objects: prepared.objects,
        selectedObjectIds: before.selectedObjectIds,
      },
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
    }));

    return true;
  },
  mergePoints: (sourceId: string, targetId: string) => {
    const before = createHistorySnapshot(get());
    const objects = { ...get().objects };
    
    Object.keys(objects).forEach((objId) => {
      if (objId === sourceId) return;
      
      const obj = { ...objects[objId] } as any;
      let changed = false;

      if (Array.isArray(obj.pointIds) && obj.pointIds.includes(sourceId)) {
        obj.pointIds = obj.pointIds.map((id: string) => id === sourceId ? targetId : id);
        changed = true;
      }

      if (obj.construction) {
        let consChanged = false;
        const cons = { ...obj.construction };
        for (const [k, v] of Object.entries(cons)) {
          if (v === sourceId && k.endsWith("Id")) {
             (cons as any)[k] = targetId;
             consChanged = true;
          }
        }
        if (consChanged) {
           obj.construction = cons;
           changed = true;
        }
      }

      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && k.endsWith("Id") && v === sourceId && k !== "id") {
          obj[k] = targetId;
          changed = true;
        }
      }

      if (changed) {
        objects[objId] = obj;
      }
    });

    delete objects[sourceId];
    
    const prepared = prepareObjectsForCommit(objects);
    if (!prepared.valid) {
      set({ lastError: prepared.error });
      return;
    }

    const afterSelectedObjectIds = get().selectedObjectIds.filter(id => id !== sourceId);

    historyManager.record(
      "delete",
      "Merge points",
      before,
      createHistorySnapshot({ ...get(), objects: prepared.objects, selectedObjectIds: afterSelectedObjectIds }),
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: prepared.objects,
      selectedObjectIds: afterSelectedObjectIds,
    }));
  },
  deleteObject: (objectId) => {
    const before = createHistorySnapshot(get());
    const graphResult = DependencyGraph.fromObjects(get().objects);

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

    historyManager.record(
      "update",
      historyDescriptionForObject("update", nextObject),
      before,
      {
        objects: propagated.objects,
        selectedObjectIds: before.selectedObjectIds,
      },
    );

    set((state) => ({
      ...getHistoryFlags(),
      historyVersion: state.historyVersion + 1,
      lastError: null,
      objects: propagated.objects,
    }));

    return true;
  },
});

