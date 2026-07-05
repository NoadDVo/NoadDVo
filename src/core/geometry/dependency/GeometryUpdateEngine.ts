import type {
  CircleObject,
  GeometryError,
  GeometryObject,
  GeometryObjectRecord,
} from "../types";
import { DependencyGraph } from "./DependencyGraph";

type PropagationResult =
  | { readonly valid: true; readonly objects: GeometryObjectRecord }
  | { readonly valid: false; readonly error: GeometryError };

function toGeometryError(
  code: string,
  message: string,
  objectId?: string,
): GeometryError {
  return {
    code,
    message,
    ...(objectId ? { objectId } : {}),
    severity: "error",
  };
}

function expectedDependenciesForObject(object: GeometryObject): readonly string[] {
  if (object.type === "segment") {
    return [object.startPointId, object.endPointId];
  }

  if (object.type === "circle") {
    return expectedCircleDependencies(object);
  }

  if (object.type === "polygon") {
    return object.pointIds;
  }

  if (object.type === "line") {
    return [object.pointAId, object.pointBId];
  }

  if (object.type === "ray") {
    return [object.startPointId, object.throughPointId];
  }

  if (object.type === "vector") {
    return [object.startPointId, object.endPointId];
  }

  if (object.type === "angle") {
    return [object.pointAId, object.vertexPointId, object.pointCId];
  }

  return object.dependencies;
}

function expectedCircleDependencies(object: CircleObject): readonly string[] {
  if (object.circleKind === "center-radius") {
    return [object.centerPointId];
  }

  if (object.circleKind === "center-point") {
    return [object.centerPointId, object.radiusPointId];
  }

  return [object.pointAId, object.pointBId, object.pointCId];
}

function normalizeObjectDependencies(object: GeometryObject): GeometryObject {
  const dependencies = Array.from(new Set(expectedDependenciesForObject(object)));

  if (
    dependencies.length === object.dependencies.length &&
    dependencies.every((dependency, index) => object.dependencies[index] === dependency)
  ) {
    return object;
  }

  return {
    ...object,
    dependencies,
  };
}

export function normalizeDependencyMetadata(
  objects: GeometryObjectRecord,
): GeometryObjectRecord {
  const normalizedEntries = Object.values(objects).map((object) => [
    object.id,
    {
      ...normalizeObjectDependencies(object),
      dependents: [],
    },
  ] as const);
  const normalizedObjects = Object.fromEntries(normalizedEntries) as Record<
    string,
    GeometryObject
  >;
  const dependentIdsByObject = new Map<string, string[]>();

  for (const objectId of Object.keys(normalizedObjects)) {
    dependentIdsByObject.set(objectId, []);
  }

  for (const object of Object.values(normalizedObjects)) {
    for (const dependencyId of object.dependencies) {
      dependentIdsByObject.get(dependencyId)?.push(object.id);
    }
  }

  return Object.fromEntries(
    Object.values(normalizedObjects).map((object) => [
      object.id,
      {
        ...object,
        dependents: Array.from(new Set(dependentIdsByObject.get(object.id) ?? [])),
      },
    ]),
  ) as GeometryObjectRecord;
}

export function validateDependencyGraph(
  objects: GeometryObjectRecord,
): GeometryError | null {
  const graphResult = DependencyGraph.fromObjects(normalizeDependencyMetadata(objects));

  if (graphResult.valid) {
    return null;
  }

  return toGeometryError(
    graphResult.error.code,
    graphResult.error.message,
    graphResult.error.objectId,
  );
}

export function propagateGeometryUpdates(
  objects: GeometryObjectRecord,
  changedObjectId: string,
): PropagationResult {
  const normalizedObjects = normalizeDependencyMetadata(objects);
  const graphResult = DependencyGraph.fromObjects(normalizedObjects);

  if (!graphResult.valid) {
    return {
      error: toGeometryError(
        graphResult.error.code,
        graphResult.error.message,
        graphResult.error.objectId,
      ),
      valid: false,
    };
  }

  const changedObject = normalizedObjects[changedObjectId];

  if (!changedObject) {
    return {
      error: toGeometryError(
        "GEOMETRY_OBJECT_NOT_FOUND",
        "Cannot propagate updates from a missing object.",
        changedObjectId,
      ),
      valid: false,
    };
  }

  const updatedAt = Date.now();
  const orderedDependents = graphResult.value.getTopologicalDependents(changedObjectId);
  let nextObjects: GeometryObjectRecord = normalizedObjects;

  for (const dependentId of orderedDependents) {
    const dependent = nextObjects[dependentId];

    if (!dependent) {
      continue;
    }

    nextObjects = {
      ...nextObjects,
      [dependentId]: {
        ...dependent,
        updatedAt,
      },
    };
  }

  return {
    objects: nextObjects,
    valid: true,
  };
}
