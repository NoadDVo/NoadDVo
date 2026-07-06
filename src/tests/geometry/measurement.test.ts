import {
  DEFAULT_GEOMETRY_STYLE,
  formatMeasurementValue,
  measureValue,
  normalizeDependencyMetadata,
  propagateGeometryUpdates,
  type AngleObject,
  type ArcObject,
  type CircleObject,
  type MeasurementObject,
  type MeasurementType,
  type PointObject,
  type PolygonObject,
  type RegionObject,
  type SegmentObject,
} from "../../core/geometry";
import { assert, assertEqual } from "../assert";

function point(id: string, x: number, y: number): PointObject {
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

function measurement(type: MeasurementType, targetObjectId: string): MeasurementObject {
  return {
    createdAt: 2,
    dependencies: [targetObjectId],
    dependents: [],
    id: `measurement-${type}`,
    labelPosition: "above",
    locked: false,
    measurementType: type,
    precision: 2,
    style: DEFAULT_GEOMETRY_STYLE,
    targetObjectId,
    type: "measurement",
    updatedAt: 2,
    visible: true,
  };
}

export function runMeasurementTests(): void {
  assertSegmentLength();
  assertPolygonMeasurements();
  assertCircleMeasurements();
  assertThreePointCircleMeasurements();
  assertArcMeasurement();
  assertRegionMeasurement();
  assertAngleMeasurement();
  assertMeasurementDependencyUpdate();
}

function assertSegmentLength(): void {
  const segment: SegmentObject = {
    createdAt: 1,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 1,
    visible: true,
  };
  const objects = { a: point("a", 0, 0), ab: segment, b: point("b", 3, 4) };

  assertEqual(measureValue(measurement("segment-length", "ab"), objects), 5, "segment length is dynamic");
}

function assertPolygonMeasurements(): void {
  const polygon: PolygonObject = {
    closed: true,
    createdAt: 1,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "triangle",
    locked: false,
    pointIds: ["a", "b", "c"],
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 1,
    visible: true,
  };
  const objects = {
    a: point("a", 0, 0),
    b: point("b", 4, 0),
    c: point("c", 0, 3),
    triangle: polygon,
  };

  assertEqual(measureValue(measurement("polygon-area", "triangle"), objects), 6, "polygon area is measured");
  assertEqual(measureValue(measurement("polygon-perimeter", "triangle"), objects), 12, "polygon perimeter is measured");
}

function assertCircleMeasurements(): void {
  const circle: CircleObject = {
    centerPointId: "o",
    circleKind: "center-radius",
    createdAt: 1,
    dependencies: ["o"],
    dependents: [],
    id: "circle-o",
    locked: false,
    radius: 3,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 1,
    visible: true,
  };
  const objects = { "circle-o": circle, o: point("o", 0, 0) };

  assertEqual(measureValue(measurement("circle-radius", "circle-o"), objects), 3, "circle radius is measured");
  assertEqual(measureValue(measurement("circle-diameter", "circle-o"), objects), 6, "circle diameter is measured");
  assertEqual(formatMeasurementValue(measurement("circle-circumference", "circle-o"), objects), "18.85", "circle circumference is formatted");
  assertEqual(formatMeasurementValue(measurement("circle-area", "circle-o"), objects), "28.27", "circle area is formatted");
}

function assertThreePointCircleMeasurements(): void {
  const circle: CircleObject = {
    circleKind: "three-points",
    createdAt: 1,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "circle-abc",
    locked: false,
    pointAId: "a",
    pointBId: "b",
    pointCId: "c",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 1,
    visible: true,
  };
  const objects = {
    a: point("a", 1, 0),
    b: point("b", 0, 1),
    c: point("c", -1, 0),
    "circle-abc": circle,
  };

  assertEqual(measureValue(measurement("circle-radius", "circle-abc"), objects), 1, "three-point circle radius is measured");
}

function assertArcMeasurement(): void {
  const arc: ArcObject = {
    centerPointId: "o",
    createdAt: 1,
    dependencies: ["o", "a", "b"],
    dependents: [],
    direction: "counterclockwise",
    endPointId: "b",
    id: "arc-ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 1,
    visible: true,
  };
  const objects = {
    a: point("a", 1, 0),
    b: point("b", 0, 1),
    o: point("o", 0, 0),
    "arc-ab": arc,
  };

  assertEqual(formatMeasurementValue(measurement("arc-length", "arc-ab"), objects), "1.57", "arc length is measured");
}

function assertRegionMeasurement(): void {
  const region: RegionObject = {
    boundaryPointIds: ["a", "b", "c"],
    createdAt: 1,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "region-abc",
    locked: false,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "region",
    updatedAt: 1,
    visible: true,
  };
  const objects = {
    a: point("a", 0, 0),
    b: point("b", 4, 0),
    c: point("c", 0, 3),
    "region-abc": region,
  };

  assertEqual(measureValue(measurement("region-area", "region-abc"), objects), 6, "region area is measured");
}

function assertAngleMeasurement(): void {
  const angle: AngleObject = {
    createdAt: 1,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "angle-abc",
    locked: false,
    pointAId: "a",
    pointCId: "c",
    radius: 1,
    showRightAngleMarker: false,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "angle",
    updatedAt: 1,
    vertexPointId: "b",
    visible: true,
  };
  const objects = {
    a: point("a", 1, 0),
    b: point("b", 0, 0),
    c: point("c", 0, 1),
    "angle-abc": angle,
  };

  assertEqual(formatMeasurementValue(measurement("angle-value", "angle-abc"), objects), "90°", "angle value is formatted");
}

function assertMeasurementDependencyUpdate(): void {
  const segment: SegmentObject = {
    createdAt: 1,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 1,
    visible: true,
  };
  const length = measurement("segment-length", "ab");
  const objects = normalizeDependencyMetadata({
    a: point("a", 0, 0),
    ab: segment,
    b: point("b", 3, 4),
    "measurement-segment-length": length,
  });
  const propagated = propagateGeometryUpdates(
    { ...objects, a: { ...objects.a as PointObject, x: 1, updatedAt: 3 } },
    "a",
  );

  assert(objects.ab?.dependents.includes(length.id), "measurement depends on target segment");
  assert(propagated.valid, "measurement dependency propagation remains valid");
  assert(
    propagated.valid && (propagated.objects[length.id]?.updatedAt ?? 0) > length.updatedAt,
    "measurement updates when target dependencies move",
  );
}
