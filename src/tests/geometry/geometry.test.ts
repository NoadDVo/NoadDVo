import {
  DEFAULT_GEOMETRY_STYLE,
  normalizeDependencyMetadata,
  propagateGeometryUpdates,
  distance,
  midpoint,
  polygonArea,
  validateGeometryObject,
  getCircleGeometry,
  recomputeConstructedPoint,
  type GeometryObjectRecord,
  type ArcObject,
  type CircleObject,
  type PointObject,
  type RayObject,
  type RegionObject,
  type TextObject,
  type VectorObject,
} from "../../core/geometry";
import { clipRayToBounds, type WorldBounds } from "../../core/geometry/viewport";
import { toolManager } from "../../core/tools/ToolManager";
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
  assertThreePointCircleGeometry();
  assertArcValidationAndDependencies();
  assertRegionValidationAndDependencies();
  assertAdvancedConstructionRecomputation();
  assertAdvancedConstructionToolsAreRegistered();
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

function assertThreePointCircleGeometry(): void {
  const pointA = createPoint("a", 1, 0);
  const pointB = createPoint("b", 0, 1);
  const pointC = createPoint("c", -1, 0);
  const circle: CircleObject = {
    circleKind: "three-points",
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "circle-abc",
    locked: false,
    pointAId: "a",
    pointBId: "b",
    pointCId: "c",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 2,
    visible: true,
  };
  const objects = { a: pointA, b: pointB, c: pointC, "circle-abc": circle };
  const geometry = getCircleGeometry(circle, objects);

  assert(validateGeometryObject(circle, objects).valid, "three-point circle validates non-collinear points");
  assertEqual(geometry?.center.x, 0, "three-point circle computes center x");
  assertEqual(geometry?.center.y, 0, "three-point circle computes center y");
  assertEqual(geometry?.radius, 1, "three-point circle computes radius");
}

function assertArcValidationAndDependencies(): void {
  const arc: ArcObject = {
    centerPointId: "o",
    createdAt: 2,
    dependencies: ["o", "a", "b"],
    dependents: [],
    direction: "counterclockwise",
    endPointId: "b",
    id: "arc-ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 2,
    visible: true,
  };
  const objects = normalizeDependencyMetadata({
    a: createPoint("a", 1, 0),
    b: createPoint("b", 0, 1),
    o: createPoint("o", 0, 0),
    "arc-ab": arc,
  });
  const propagated = propagateGeometryUpdates(
    {
      ...objects,
      a: { ...objects.a as PointObject, updatedAt: 3, x: 0, y: -1 },
    },
    "a",
  );

  assert(validateGeometryObject(arc, objects).valid, "arc validates center/start/end points on same radius");
  assert(objects.o?.dependents.includes("arc-ab"), "arc depends on center point");
  assert(objects.a?.dependents.includes("arc-ab"), "arc depends on start point");
  assert(propagated.valid, "arc dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects["arc-ab"]?.updatedAt ?? 0) > arc.updatedAt,
    "arc metadata updates when an endpoint moves",
  );
}

function assertRegionValidationAndDependencies(): void {
  const region: RegionObject = {
    boundaryPointIds: ["a", "b", "c"],
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "region-abc",
    locked: false,
    style: { ...DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
    type: "region",
    updatedAt: 2,
    visible: true,
  };
  const objects = normalizeDependencyMetadata({
    a: createPoint("a", 0, 0),
    b: createPoint("b", 4, 0),
    c: createPoint("c", 0, 3),
    "region-abc": region,
  });
  const propagated = propagateGeometryUpdates(
    {
      ...objects,
      c: { ...objects.c as PointObject, updatedAt: 3, y: 4 },
    },
    "c",
  );

  assert(validateGeometryObject(region, objects).valid, "region validates polygonal boundary");
  assert(objects.a?.dependents.includes("region-abc"), "region depends on boundary points");
  assert(propagated.valid, "region dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects["region-abc"]?.updatedAt ?? 0) > region.updatedAt,
    "region metadata updates when a boundary point moves",
  );
}

function assertAdvancedConstructionRecomputation(): void {
  const objects: GeometryObjectRecord = {
    a: createPoint("a", 0, 0),
    b: createPoint("b", 2, 0),
    c: createPoint("c", 0, 2),
    p: createPoint("p", 1, 1),
  };
  const perpendicularBisectorPoint = recomputeConstructedPoint(
    { pointAId: "a", pointBId: "b", type: "perpendicular-bisector-point" },
    objects,
  );
  const angleBisectorPoint = recomputeConstructedPoint(
    {
      pointAId: "b",
      pointCId: "c",
      type: "angle-bisector-point",
      vertexPointId: "a",
    },
    objects,
  );
  const projectionPoint = recomputeConstructedPoint(
    {
      linePointAId: "a",
      linePointBId: "b",
      pointId: "p",
      type: "projection-point",
    },
    objects,
  );
  const incenter = recomputeConstructedPoint(
    {
      pointAId: "a",
      pointBId: "b",
      pointCId: "c",
      type: "incenter",
    },
    objects,
  );

  assertEqual(perpendicularBisectorPoint?.x, 1, "perpendicular bisector helper x is recomputed");
  assertEqual(perpendicularBisectorPoint?.y, 2, "perpendicular bisector helper y is recomputed");
  assertEqual(angleBisectorPoint?.x, 1, "angle bisector helper x is recomputed");
  assertEqual(angleBisectorPoint?.y, 1, "angle bisector helper y is recomputed");
  assertEqual(projectionPoint?.x, 1, "altitude projection x is recomputed");
  assertEqual(projectionPoint?.y, 0, "altitude projection y is recomputed");
  assertEqual(Number(incenter?.x.toFixed(6)), 0.585786, "incenter x is recomputed");
  assertEqual(Number(incenter?.y.toFixed(6)), 0.585786, "incenter y is recomputed");
}

function assertAdvancedConstructionToolsAreRegistered(): void {
  const expectedTools = [
    "perpendicular-bisector",
    "angle-bisector",
    "median",
    "altitude",
    "circumcircle",
    "incircle",
    "fill",
  ] as const;

  expectedTools.forEach((toolId) => {
    assertEqual(toolManager.getTool(toolId).id, toolId, `${toolId} tool is registered`);
  });
}
