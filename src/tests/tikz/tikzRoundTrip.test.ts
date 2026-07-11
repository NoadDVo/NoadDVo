import {
  DEFAULT_GEOMETRY_STYLE,
  type AngleObject,
  type ArcObject,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type LineObject,
  type PointObject,
  type PolygonObject,
  type RayObject,
  type RegionObject,
  type SegmentObject,
  type TextObject,
  type VectorObject,
} from "../../core/geometry";
import { generateTikz, parseTikz } from "../../core/tikz";
import { assert, assertEqual } from "../assert";

function point(id: string, name: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

function roundTrip(objects: GeometryObjectRecord): readonly GeometryObject[] {
  const code = generateTikz(objects, "academic").code;
  const parsed = parseTikz(code);

  if (parsed.issues.some((issue) => issue.severity === "error")) {
    throw new Error(`Generated TikZ should parse without errors: ${parsed.issues[0]?.message ?? "unknown"}`);
  }

  return parsed.objects;
}

function firstOfType<TType extends GeometryObject["type"]>(
  objects: readonly GeometryObject[],
  type: TType,
): Extract<GeometryObject, { readonly type: TType }> {
  const object = objects.find(
    (candidate): candidate is Extract<GeometryObject, { readonly type: TType }> =>
      candidate.type === type,
  );

  if (!object) {
    throw new Error(`Expected parsed ${type} object.`);
  }

  return object;
}

function pointIdByName(objects: readonly GeometryObject[], name: string): string {
  const object = objects.find((candidate) => candidate.type === "point" && candidate.name === name);

  if (!object) {
    throw new Error(`Expected point ${name}.`);
  }

  return object.id;
}

export function runTikzRoundTripTests(): void {
  assertPointRoundTrip();
  assertSegmentRoundTrip();
  assertLineRoundTrip();
  assertRayRoundTrip();
  assertVectorRoundTrip();
  assertCenterRadiusCircleRoundTrip();
  assertThreePointCircleRoundTrip();
  assertPolygonRoundTrip();
  assertRegionRoundTrip();
  assertAngleRoundTrip();
  assertArcRoundTrip();
  assertTextRoundTrip();
}

function assertPointRoundTrip(): void {
  const parsed = roundTrip({ a: point("a", "A", 2, 3) });
  const parsedPoint = firstOfType(parsed, "point");

  assertEqual(parsedPoint.name, "A", "point round-trip preserves name");
  assertEqual(parsedPoint.x, 2, "point round-trip preserves x");
  assertEqual(parsedPoint.y, 3, "point round-trip preserves y");
  assert(!parsed.some((object) => object.type === "circle"), "point markers do not parse as circles");
}

function assertSegmentRoundTrip(): void {
  const segment: SegmentObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    ab: segment,
    b: point("b", "B", 4, 0),
  });
  const parsedSegment = firstOfType(parsed, "segment");

  assertEqual(parsedSegment.startPointId, pointIdByName(parsed, "A"), "segment start dependency round-trips");
  assertEqual(parsedSegment.endPointId, pointIdByName(parsed, "B"), "segment end dependency round-trips");
}

function assertLineRoundTrip(): void {
  const line: LineObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    id: "line-ab",
    locked: false,
    pointAId: "a",
    pointBId: "b",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "line",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    b: point("b", "B", 1, 0),
    "line-ab": line,
  });
  const parsedLine = firstOfType(parsed, "line");

  assertEqual(parsedLine.pointAId, pointIdByName(parsed, "A"), "line first dependency round-trips");
  assertEqual(parsedLine.pointBId, pointIdByName(parsed, "B"), "line second dependency round-trips");
}

function assertRayRoundTrip(): void {
  const ray: RayObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    id: "ray-ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    throughPointId: "b",
    type: "ray",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    b: point("b", "B", 1, 0),
    "ray-ab": ray,
  });
  const parsedRay = firstOfType(parsed, "ray");

  assertEqual(parsedRay.startPointId, pointIdByName(parsed, "A"), "ray start dependency round-trips");
  assertEqual(parsedRay.throughPointId, pointIdByName(parsed, "B"), "ray through dependency round-trips");
}

function assertVectorRoundTrip(): void {
  const vector: VectorObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "vector-ab",
    locked: false,
    metadata: { arrowStyle: "latex" },
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "vector",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    b: point("b", "B", 1, 0),
    "vector-ab": vector,
  });
  const parsedVector = firstOfType(parsed, "vector");

  assertEqual(parsedVector.startPointId, pointIdByName(parsed, "A"), "vector start dependency round-trips");
  assertEqual(parsedVector.endPointId, pointIdByName(parsed, "B"), "vector end dependency round-trips");
}

function assertCenterRadiusCircleRoundTrip(): void {
  const circle: CircleObject = {
    centerPointId: "o",
    circleKind: "center-radius",
    createdAt: 2,
    dependencies: ["o"],
    dependents: [],
    id: "circle-o",
    locked: false,
    radius: 2,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    o: point("o", "O", 0, 0),
    "circle-o": circle,
  });
  const parsedCircle = firstOfType(parsed, "circle");

  assertEqual(parsedCircle.circleKind, "center-radius", "center-radius circle kind round-trips");
}

function assertThreePointCircleRoundTrip(): void {
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
  const parsed = roundTrip({
    a: point("a", "A", 1, 0),
    b: point("b", "B", 0, 1),
    c: point("c", "C", -1, 0),
    "circle-abc": circle,
  });
  const parsedCircle = firstOfType(parsed, "circle");

  assertEqual(parsedCircle.circleKind, "three-points", "three-point circle kind round-trips");
  assertEqual(parsed.filter((object) => object.type === "point").length, 3, "three-point circle does not invent a center point");
}

function assertPolygonRoundTrip(): void {
  const polygon: PolygonObject = {
    closed: true,
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "polygon-abc",
    locked: false,
    pointIds: ["a", "b", "c"],
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 2,
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    b: point("b", "B", 4, 0),
    c: point("c", "C", 0, 3),
    "polygon-abc": polygon,
  });

  assertEqual(firstOfType(parsed, "polygon").pointIds.length, 3, "polygon boundary round-trips");
}

function assertRegionRoundTrip(): void {
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
  const parsed = roundTrip({
    a: point("a", "A", 0, 0),
    b: point("b", "B", 4, 0),
    c: point("c", "C", 0, 3),
    "region-abc": region,
  });

  assertEqual(firstOfType(parsed, "region").boundaryPointIds.length, 3, "region boundary round-trips");
}

function assertAngleRoundTrip(): void {
  const angle: AngleObject = {
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "angle-abc",
    locked: false,
    pointAId: "a",
    pointCId: "c",
    radius: 0.6,
    showRightAngleMarker: false,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "angle",
    updatedAt: 2,
    vertexPointId: "b",
    visible: true,
  };
  const parsed = roundTrip({
    a: point("a", "A", 0, 1),
    b: point("b", "B", 0, 0),
    c: point("c", "C", 1, 0),
    "angle-abc": angle,
  });

  assertEqual(firstOfType(parsed, "angle").vertexPointId, pointIdByName(parsed, "B"), "angle vertex round-trips");
}

function assertArcRoundTrip(): void {
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
  const parsed = roundTrip({
    a: point("a", "A", 1, 0),
    b: point("b", "B", 0, 1),
    o: point("o", "O", 0, 0),
    "arc-ab": arc,
  });
  const parsedArc = firstOfType(parsed, "arc");

  assertEqual(parsedArc.centerPointId, pointIdByName(parsed, "O"), "arc center dependency round-trips");
  assertEqual(parsedArc.startPointId, pointIdByName(parsed, "A"), "arc start dependency round-trips");
  assertEqual(parsedArc.endPointId, pointIdByName(parsed, "B"), "arc end dependency round-trips");
}

function assertTextRoundTrip(): void {
  const text: TextObject = {
    content: "$x^2+y^2$",
    createdAt: 2,
    dependencies: [],
    dependents: [],
    id: "text-a",
    locked: false,
    style: DEFAULT_GEOMETRY_STYLE,
    textMode: "math",
    type: "text",
    updatedAt: 2,
    visible: true,
    x: 2,
    y: 3,
  };
  const parsed = roundTrip({ "text-a": text });

  assertEqual(firstOfType(parsed, "text").content, "x^2+y^2", "text content round-trips");
}

