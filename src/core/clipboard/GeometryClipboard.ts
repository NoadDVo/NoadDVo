import { useGeometryStore } from "../../app/store/geometryStore";
import type {
  GeometryObject,
  GeometryObjectRecord,
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
    if (idMap.has(value)) {
      return idMap.get(value);
    }

    const colonIndex = value.indexOf(":");
    if (colonIndex !== -1) {
      const baseId = value.substring(0, colonIndex);
      if (idMap.has(baseId)) {
        return `${idMap.get(baseId)}${value.substring(colonIndex)}`;
      }
    }

    return value;
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
  if (object.type === "point") {
    return {
      ...object,
      x: object.x + offset.x,
      y: object.y + offset.y,
    };
  }

  if (object.type === "text" || object.type === "image" || object.type === "slider") {
    return {
      ...object,
      x: (object as any).x + offset.x,
      y: (object as any).y + offset.y,
    };
  }

  return object;
}

function instantiateClipboardObjects(
  payload: ClipboardPayload,
  offset = { x: 0, y: 0 },
): {
  readonly objects: readonly GeometryObject[];
  readonly rootObjectIds: readonly string[];
  readonly idMap: Map<string, string>;
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
    idMap,
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

  console.log('[CLIPBOARD_COPY] selectedIds:', selectedIds);
  console.log('[CLIPBOARD_COPY] collected objectIds:', objectIds);
  console.log('[CLIPBOARD_COPY] object types:', objects.map(o => `${o.id}(${o.type})`));
  const regionObjects = objects.filter(o => o.type === 'region');
  console.log('[CLIPBOARD_COPY] regions found:', regionObjects.length);
  if (regionObjects.length > 0) {
    console.log('[CLIPBOARD_COPY] region details:', JSON.stringify(regionObjects, null, 2));
  }

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
  geometry.setActiveTool("paste");
  
  return true;
}

export function commitPaste(offset: { x: number; y: number }, mergeInstruction?: { sourceId: string; targetId: string }): boolean {
  if (!clipboardPayload) {
    return false;
  }

  const geometry = useGeometryStore.getState();
  const instantiated = instantiateClipboardObjects(clipboardPayload, offset);

  if (instantiated.objects.length === 0) {
    return false;
  }

  const success = geometry.setObjects(
    {
      ...geometry.objects,
      ...Object.fromEntries(instantiated.objects.map((object) => [object.id, object])),
    },
    "Paste geometry",
    instantiated.rootObjectIds,
  );

  if (success && mergeInstruction && mergeInstruction.sourceId && mergeInstruction.targetId) {
    const newSourceId = instantiated.idMap.get(mergeInstruction.sourceId);
    if (newSourceId) {
      useGeometryStore.getState().mergePoints(newSourceId, mergeInstruction.targetId);
    }
  }

  return success;
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
