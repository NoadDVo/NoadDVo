import type { GeometryObject, GeometryObjectRecord } from "../geometry";
import { getTikzOptions, type TikzOptions } from "../tikz";
import type {
  SyncContext,
  SyncDirection,
  SyncIntermediateObject,
  SyncIntermediateScene,
  SyncIntermediateSource,
} from "./SyncTypes";

function createSourceId(direction: SyncDirection): string {
  return `sync-${direction}-${Date.now().toString(36)}`;
}

export function createSyncContext({
  direction,
  sourceId = createSourceId(direction),
  tikzOptions = getTikzOptions("academic"),
}: {
  readonly direction: SyncDirection;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
}): SyncContext {
  return {
    createdAt: Date.now(),
    direction,
    sourceId,
    tikzOptions,
  };
}

function objectName(object: GeometryObject): string | undefined {
  return "name" in object ? object.name : undefined;
}

function objectSignature(object: GeometryObject): string {
  return [
    object.type,
    objectName(object) ?? "",
    object.dependencies.join(","),
  ].join(":");
}

export function buildSyncIntermediateScene(
  objects: GeometryObjectRecord | readonly GeometryObject[],
  source: SyncIntermediateSource,
): SyncIntermediateScene {
  const objectList = Array.isArray(objects) ? objects : Object.values(objects);
  const syncObjects: SyncIntermediateObject[] = objectList
    .map((object) => ({
      dependencies: object.dependencies,
      objectId: object.id,
      objectType: object.type,
      signature: objectSignature(object),
      source,
      ...(object.type === "point" && object.name ? { tikzName: object.name } : {}),
    }))
    .sort((first, second) => first.objectId.localeCompare(second.objectId));

  return {
    objects: syncObjects,
    source,
  };
}
