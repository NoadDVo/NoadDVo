import {
  DEFAULT_GEOMETRY_STYLE,
  normalizeDependencyMetadata,
  propagateGeometryUpdates,
  distance,
  midpoint,
  polygonArea,
  validateGeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type RayObject,
  type TextObject,
  type VectorObject,
} from "../../core/geometry";
import { clipRayToBounds, type WorldBounds } from "../../core/geometry/viewport";
import { assert, assertEqual } from "../assert";

function createPoint(id: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

export function runGeometryTests(): void {
  const pointA = createPoint("a", 0, 0);
  const pointB = createPoint("b", 3, 4);
  const center = midpoint(pointA, pointB);
  const validation = validateGeometryObject(pointA, { a: pointA });

  assertEqual(distance(pointA, pointB), 5, "distance computes a 3-4-5 triangle");
  assertEqual(center.x, 1.5, "midpoint x is averaged");
  assertEqual(center.y, 2, "midpoint y is averaged");
  assertEqual(polygonArea([pointA, pointB, createPoint("c", 0, 4)]), 6, "polygon area is signed");
  assert(validation.valid, "valid point passes validation");
  assertRayValidationAndClipping();
  assertRayDependencyMetadata();
  assertVectorValidation();
  assertVectorDependencyMetadata();
  assertTextValidation();
  assertTextDependencyMetadata();
}

function createRay(startPointId: string, throughPointId: string): RayObject {
  return {
    createdAt: 2,
    dependencies: [startPointId, throughPointId],
    dependents: [],
    id: "ray-ab",
    locked: false,
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    throughPointId,
    type: "ray",
    updatedAt: 2,
    visible: true,
  };
}

function assertRayValidationAndClipping(): void {
  const pointA = createPoint("a", 0, 0);
  const pointB = createPoint("b", 1, 0);
  const validRay = createRay("a", "b");
  const invalidRay = createRay("a", "a");
  const bounds: WorldBounds = {
    maxX: 10,
    maxY: 10,
    minX: -10,
    minY: -10,
  };
  const clipped = clipRayToBounds(pointA, pointB, bounds);

  assert(validateGeometryObject(validRay, { a: pointA, b: pointB }).valid, "ray validates distinct points");
  assert(!validateGeometryObject(invalidRay, { a: pointA }).valid, "ray rejects duplicate endpoints");
  assert(clipped !== null, "ray clips to viewport bounds");
  assertEqual(clipped?.[0].x, 0, "ray clipping starts at ray origin");
  assertEqual(clipped?.[1].x, 10, "ray clipping extends to positive x bound");
}

function assertRayDependencyMetadata(): void {
  const pointA = createPoint("a", 0, 0);
  const pointB = createPoint("b", 1, 0);
  const ray = createRay("a", "b");
  const objects = normalizeDependencyMetadata({
    a: pointA,
    b: pointB,
    "ray-ab": ray,
  });
  const movedObjects: GeometryObjectRecord = {
    ...objects,
    a: { ...pointA, updatedAt: 3, x: 2 },
  };
  const propagated = propagateGeometryUpdates(movedObjects, "a");

  assert(objects.a?.dependents.includes("ray-ab"), "ray depends on start point");
  assert(objects.b?.dependents.includes("ray-ab"), "ray depends on through point");
  assert(propagated.valid, "ray dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects["ray-ab"]?.updatedAt ?? 0) > ray.updatedAt,
    "ray dependent metadata updates when endpoint moves",
  );
}

function createVector(startPointId: string, endPointId: string): VectorObject {
  return {
    createdAt: 2,
    dependencies: [startPointId, endPointId],
    dependents: [],
    endPointId,
    id: "vector-ab",
    locked: false,
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "vector",
    updatedAt: 2,
    visible: true,
  };
}

function assertVectorValidation(): void {
  const pointA = createPoint("a", 0, 0);
  const pointB = createPoint("b", 2, 0);
  const validVector = createVector("a", "b");
  const invalidVector = createVector("a", "a");

  assert(validateGeometryObject(validVector, { a: pointA, b: pointB }).valid, "vector validates distinct points");
  assert(!validateGeometryObject(invalidVector, { a: pointA }).valid, "vector rejects duplicate endpoints");
}

function assertVectorDependencyMetadata(): void {
  const pointA = createPoint("a", 0, 0);
  const pointB = createPoint("b", 2, 0);
  const vector = createVector("a", "b");
  const objects = normalizeDependencyMetadata({
    a: pointA,
    b: pointB,
    "vector-ab": vector,
  });
  const movedObjects: GeometryObjectRecord = {
    ...objects,
    b: { ...pointB, updatedAt: 3, x: 4 },
  };
  const propagated = propagateGeometryUpdates(movedObjects, "b");

  assert(objects.a?.dependents.includes("vector-ab"), "vector depends on start point");
  assert(objects.b?.dependents.includes("vector-ab"), "vector depends on end point");
  assert(propagated.valid, "vector dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects["vector-ab"]?.updatedAt ?? 0) > vector.updatedAt,
    "vector dependent metadata updates when endpoint moves",
  );
}

function createText(id: string, x: number, y: number): TextObject {
  return {
    content: "Hello",
    createdAt: 2,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    style: DEFAULT_GEOMETRY_STYLE,
    textMode: "plain",
    type: "text",
    updatedAt: 2,
    visible: true,
    x,
    y,
  };
}

function assertTextValidation(): void {
  const text = createText("text-a", 1, 2);
  const invalidText = createText("text-b", Number.NaN, 2);

  assert(validateGeometryObject(text, {}).valid, "text validates finite position");
  assert(!validateGeometryObject(invalidText, {}).valid, "text rejects invalid position");
}

function assertTextDependencyMetadata(): void {
  const pointA = createPoint("a", 1, 1);
  const text: TextObject = {
    ...createText("text-a", 0.25, 0.5),
    dependencies: ["a"],
    metadata: {
      followObject: true,
    },
  };
  const objects = normalizeDependencyMetadata({
    a: pointA,
    "text-a": text,
  });
  const propagated = propagateGeometryUpdates(
    {
      ...objects,
      a: { ...pointA, updatedAt: 3, x: 2 },
    },
    "a",
  );

  assert(objects.a?.dependents.includes("text-a"), "text may depend on an attached point");
  assert(propagated.valid, "text dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects["text-a"]?.updatedAt ?? 0) > text.updatedAt,
    "text dependent metadata updates when attachment moves",
  );
}
