import {
  DEFAULT_GEOMETRY_STYLE,
  type BaseGeometryObject,
  type GeometryObject,
} from "../../core/geometry";
import type { ExampleSceneId } from "./geometryStoreTypes";

function baseObject<TType extends GeometryObject["type"]>(
  id: string,
  type: TType,
  name: string,
  dependencies: readonly string[],
  dependents: readonly string[],
): BaseGeometryObject & { readonly type: TType } {
  return {
    createdAt: 0,
    dependencies,
    dependents,
    id,
    locked: false,
    name,
    style: DEFAULT_GEOMETRY_STYLE,
    type,
    updatedAt: 0,
    visible: true,
  };
}

const sampleSceneObjects = [
  {
    ...baseObject("point-a", "point", "A", [], [
      "segment-ab",
      "triangle-abc",
      "circle-a-through-b",
    ]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: -2,
    y: -1,
  },
  {
    ...baseObject("point-b", "point", "B", [], [
      "segment-ab",
      "triangle-abc",
      "circle-a-through-b",
    ]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: 3,
    y: -1,
  },
  {
    ...baseObject("point-c", "point", "C", [], ["triangle-abc"]),
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    x: 0.5,
    y: 2.6,
  },
  {
    ...baseObject("segment-ab", "segment", "AB", ["point-a", "point-b"], []),
    endPointId: "point-b",
    startPointId: "point-a",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 0.95,
      strokeWidth: 2,
    },
  },
  {
    ...baseObject(
      "triangle-abc",
      "polygon",
      "Triangle ABC",
      ["point-a", "point-b", "point-c"],
      [],
    ),
    closed: true,
    pointIds: ["point-a", "point-b", "point-c"],
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      fillOpacity: 0,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
  },
  {
    ...baseObject(
      "circle-a-through-b",
      "circle",
      "Circle A,B",
      ["point-a", "point-b"],
      [],
    ),
    centerPointId: "point-a",
    circleKind: "center-point",
    radiusPointId: "point-b",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
  },
] satisfies readonly GeometryObject[];

const circleExampleObjects = [
  {
    ...baseObject("circle-center", "point", "O", [], ["circle-radius"]),
    pointKind: "free",
    x: 0,
    y: 0,
  },
  {
    ...baseObject("circle-radius-point", "point", "A", [], ["circle-radius"]),
    pointKind: "free",
    x: 3,
    y: 0,
  },
  {
    ...baseObject("circle-radius", "circle", "c1", ["circle-center", "circle-radius-point"], []),
    centerPointId: "circle-center",
    circleKind: "center-point",
    radiusPointId: "circle-radius-point",
  },
] satisfies readonly GeometryObject[];

const coordinateExampleObjects = [
  {
    ...baseObject("coord-a", "point", "A", [], ["coord-ab"]),
    pointKind: "free",
    x: -4,
    y: -2,
  },
  {
    ...baseObject("coord-b", "point", "B", [], ["coord-ab"]),
    pointKind: "free",
    x: 3,
    y: 2,
  },
  {
    ...baseObject("coord-ab", "segment", "AB", ["coord-a", "coord-b"], []),
    endPointId: "coord-b",
    startPointId: "coord-a",
  },
] satisfies readonly GeometryObject[];

const olympiadExampleObjects = [
  ...sampleSceneObjects,
  {
    ...baseObject("olympiad-d", "point", "D", [], ["olympiad-cd"]),
    pointKind: "free",
    x: 0.5,
    y: -1,
  },
  {
    ...baseObject("olympiad-cd", "segment", "CD", ["point-c", "olympiad-d"], []),
    endPointId: "olympiad-d",
    startPointId: "point-c",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      dash: "dashed",
      stroke: "#747b84",
      strokeWidth: 1.5,
    },
  },
] satisfies readonly GeometryObject[];

export function getExampleObjects(exampleId: ExampleSceneId): readonly GeometryObject[] {
  if (exampleId === "circle") {
    return circleExampleObjects;
  }

  if (exampleId === "coordinate") {
    return coordinateExampleObjects;
  }

  if (exampleId === "olympiad") {
    return olympiadExampleObjects;
  }

  return sampleSceneObjects;
}

