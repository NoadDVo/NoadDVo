import type { GeometryObjectRecord } from "../geometry";

export type HistorySnapshot = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
};

export type HistoryActionKind =
  | "create"
  | "delete"
  | "update"
  | "move"
  | "construction"
  | "import"
  | "new-project";

export type HistoryAction = {
  readonly id: string;
  readonly kind: HistoryActionKind;
  readonly description: string;
  readonly before: HistorySnapshot;
  readonly after: HistorySnapshot;
  readonly timestamp: number;
};

export function cloneHistorySnapshot(snapshot: HistorySnapshot): HistorySnapshot {
  return {
    objects: { ...snapshot.objects },
    selectedObjectIds: [...snapshot.selectedObjectIds],
  };
}

export function snapshotsEqual(
  first: HistorySnapshot,
  second: HistorySnapshot,
): boolean {
  const firstKeys = Object.keys(first.objects);
  const secondKeys = Object.keys(second.objects);

  if (firstKeys.length !== secondKeys.length) {
    return false;
  }

  if (first.selectedObjectIds.length !== second.selectedObjectIds.length) {
    return false;
  }

  for (const key of firstKeys) {
    if (first.objects[key] !== second.objects[key]) {
      return false;
    }
  }

  return first.selectedObjectIds.every(
    (objectId, index) => objectId === second.selectedObjectIds[index],
  );
}

