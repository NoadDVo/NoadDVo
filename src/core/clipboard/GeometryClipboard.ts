import { useGeometryStore } from "../../app/store/geometryStore";
import type {
  GeometryObject,
  GeometryObjectRecord,
  PointObject,
} from "../geometry";

type ClipboardPayload = {
  readonly copiedAt: number;
  readonly objects: readonly GeometryObject[];
  readonly rootObjectIds: readonly string[];
};

let clipboardPayload: ClipboardPayload | null = null;
let clipboardCounter = 0;

function createClipboardId(object: GeometryObject): string {
  clipboardCounter += 1;

  return `${object.type}-paste-${Date.now().toString(36)}-${clipboardCounter}`;
}

function collectDependencyClosure(
  objects: GeometryObjectRecord,
  selectedObjectIds: readonly string[],
): readonly string[] {
  const collected = new Set<string>();

  const visit = (objectId: string) => {
    if (collected.has(objectId)) {
      return;
    }

    const object = objects[objectId];

    if (!object) {
      return;
    }

    collected.add(objectId);
    object.dependencies.forEach(visit);
  };

  selectedObjectIds.forEach(visit);

  return Array.from(collected);
}

function cloneObject<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

function remapValue(value: unknown, idMap: ReadonlyMap<string, string>): unknown {
  if (typeof value === "string") {
    return idMap.get(value) ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapValue(item, idMap));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, remapValue(entry, idMap)]),
    );
  }

  return value;
}

function offsetPointIfNeeded(object: GeometryObject, offset: { x: number; y: number }): GeometryObject {
  if (object.type !== "point") {
    return object;
  }

  const point = object as PointObject;

  return {
    ...point,
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

function instantiateClipboardObjects(
  payload: ClipboardPayload,
  offset = { x: 0.5, y: 0.5 },
): {
  readonly objects: readonly GeometryObject[];
  readonly rootObjectIds: readonly string[];
} {
  const idMap = new Map(payload.objects.map((object) => [object.id, createClipboardId(object)]));
  const now = Date.now();
  const objects = payload.objects.map((object) => {
    const remapped = remapValue(cloneObject(object), idMap) as GeometryObject;
    const nextObject = offsetPointIfNeeded(remapped, offset);

    return {
      ...nextObject,
      createdAt: now,
      dependents: [],
      locked: false,
      name: nextObject.name ? `${nextObject.name}'` : nextObject.name,
      updatedAt: now,
      visible: true,
    } as GeometryObject;
  });

  return {
    objects,
    rootObjectIds: payload.rootObjectIds
      .map((objectId) => idMap.get(objectId))
      .filter((objectId): objectId is string => Boolean(objectId)),
  };
}

export function copySelectionToGeometryClipboard(): boolean {
  const geometry = useGeometryStore.getState();
  const selectedIds = geometry.selectedObjectIds.filter((objectId) => {
    const object = geometry.objects[objectId];

    return object && object.visible;
  });

  if (selectedIds.length === 0) {
    return false;
  }

  const objectIds = collectDependencyClosure(geometry.objects, selectedIds);
  const objects = objectIds
    .map((objectId) => geometry.objects[objectId])
    .filter((object): object is GeometryObject => Boolean(object));

  clipboardPayload = {
    copiedAt: Date.now(),
    objects,
    rootObjectIds: selectedIds,
  };

  return true;
}

export function pasteGeometryClipboard(): boolean {
  if (!clipboardPayload) {
    return false;
  }

  const geometry = useGeometryStore.getState();
  const instantiated = instantiateClipboardObjects(clipboardPayload);

  if (instantiated.objects.length === 0) {
    return false;
  }

  return geometry.setObjects(
    {
      ...geometry.objects,
      ...Object.fromEntries(instantiated.objects.map((object) => [object.id, object])),
    },
    "Paste geometry",
    instantiated.rootObjectIds,
  );
}

export function duplicateSelection(): boolean {
  if (!copySelectionToGeometryClipboard()) {
    return false;
  }

  return pasteGeometryClipboard();
}

export function cutSelectionToGeometryClipboard(): boolean {
  const geometry = useGeometryStore.getState();
  const selectedIds = [...geometry.selectedObjectIds];

  if (!copySelectionToGeometryClipboard()) {
    return false;
  }

  geometry.beginHistoryTransaction("delete", "Cut geometry");
  selectedIds.forEach((objectId) => {
    const object = useGeometryStore.getState().objects[objectId];

    if (object && !object.locked) {
      useGeometryStore.getState().deleteObject(objectId);
    }
  });
  geometry.commitHistoryTransaction();

  return true;
}

export function hasGeometryClipboard(): boolean {
  return Boolean(clipboardPayload);
}

export function getGeometryClipboardSnapshot(): ClipboardPayload | null {
  return clipboardPayload;
}
