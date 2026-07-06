import {
  DEFAULT_GEOMETRY_STYLE,
  type ArcObject,
  type CircleObject,
  type GeometryObjectRecord,
  type PointObject,
  type PolygonObject,
  type RegionObject,
  type TextObject,
} from "../../core/geometry";
import { hitTest } from "../../core/selection/HitTest";
import { assertEqual } from "../assert";

function textObject(): TextObject {
  return {
    content: "Annotation",
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id: "text-a",
    locked: false,
    metadata: {
      fontSize: 14,
    },
    style: DEFAULT_GEOMETRY_STYLE,
    textMode: "plain",
    type: "text",
    updatedAt: 1,
    visible: true,
    x: 0,
    y: 0,
  };
}

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

export function runSelectionTests(): void {
  assertTextHitTest();
  assertThreePointCircleHitTest();
  assertArcHitTest();
  assertRegionHitTest();
}

function assertTextHitTest(): void {
  const text = textObject();
  const objects: GeometryObjectRecord = {
    "text-a": text,
  };
  const hit = hitTest(
    { x: 104, y: 96 },
    { x: 0.4, y: 0.4 },
    objects,
    {
      height: 200,
      offsetX: 0,
      offsetY: 0,
      scale: 10,
      width: 200,
    },
  );

  assertEqual(hit?.objectId, "text-a", "hit testing selects text annotations");
}

function assertThreePointCircleHitTest(): void {
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
  const objects: GeometryObjectRecord = {
    a: { ...point("a", 1, 0), visible: false },
    b: { ...point("b", 0, 1), visible: false },
    c: { ...point("c", -1, 0), visible: false },
    "circle-abc": circle,
  };
  const hit = hitTest(
    { x: 110, y: 100 },
    { x: 1, y: 0 },
    objects,
    { height: 200, offsetX: 0, offsetY: 0, scale: 10, width: 200 },
  );

  assertEqual(hit?.objectId, "circle-abc", "hit testing selects three-point circles");
}

function assertArcHitTest(): void {
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
  const objects: GeometryObjectRecord = {
    a: { ...point("a", 1, 0), visible: false },
    b: { ...point("b", 0, 1), visible: false },
    o: { ...point("o", 0, 0), visible: false },
    "arc-ab": arc,
  };
  const hit = hitTest(
    { x: 107, y: 93 },
    { x: 0.7, y: 0.7 },
    objects,
    { height: 200, offsetX: 0, offsetY: 0, scale: 10, width: 200 },
  );

  assertEqual(hit?.objectId, "arc-ab", "hit testing selects arcs");
}

function assertRegionHitTest(): void {
  const polygon: PolygonObject = {
    closed: true,
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: ["region-abc"],
    id: "polygon-abc",
    locked: false,
    pointIds: ["a", "b", "c"],
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 2,
    visible: true,
  };
  const region: RegionObject = {
    boundaryPointIds: ["a", "b", "c"],
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "region-abc",
    locked: false,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "region",
    updatedAt: 2,
    visible: true,
  };
  const objects: GeometryObjectRecord = {
    a: { ...point("a", 0, 0), visible: false },
    b: { ...point("b", 4, 0), visible: false },
    c: { ...point("c", 0, 3), visible: false },
    "polygon-abc": polygon,
    "region-abc": region,
  };
  const hit = hitTest(
    { x: 110, y: 190 },
    { x: 1, y: 1 },
    objects,
    { height: 200, offsetX: 0, offsetY: 0, scale: 10, width: 200 },
  );

  assertEqual(hit?.objectId, "region-abc", "hit testing selects regions above polygon interiors");
}
