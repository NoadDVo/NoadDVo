import {
  normalizeDependencyMetadata,
  validateGeometryObjects,
  type GeometryError,
  type GeometryObject,
  type GeometryObjectRecord,
} from "../../core/geometry";
import { historyManager, type HistoryActionKind, type HistorySnapshot } from "../../core/history";
import type { GeometryState, SetObjectsInput } from "./geometryStoreTypes";

export function normalizeObjects(input: SetObjectsInput): GeometryObjectRecord {
  if (Array.isArray(input)) {
    return Object.fromEntries(
      input.map((object) => [object.id, object]),
    ) as GeometryObjectRecord;
  }

  return input as GeometryObjectRecord;
}

export function selectedIdsWithout(
  selectedObjectIds: readonly string[],
  objectId: string,
): readonly string[] {
  return selectedObjectIds.filter((selectedObjectId) => selectedObjectId !== objectId);
}

export function prepareObjectsForCommit(
  objects: GeometryObjectRecord,
): { readonly valid: true; readonly objects: GeometryObjectRecord } | { readonly valid: false; readonly error: GeometryError } {
  const normalizedObjects = normalizeDependencyMetadata(objects);
  const result = validateGeometryObjects(normalizedObjects);

  if (!result.valid) {
    return { error: result.error, valid: false };
  }

  return { objects: normalizedObjects, valid: true };
}

export function createHistorySnapshot(
  state: Pick<GeometryState, "objects" | "selectedObjectIds">,
): HistorySnapshot {
  return {
    objects: state.objects,
    selectedObjectIds: state.selectedObjectIds,
  };
}

export function getHistoryFlags() {
  return {
    canRedo: historyManager.canRedo,
    canUndo: historyManager.canUndo,
  };
}

export function historyDescriptionForObject(
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

