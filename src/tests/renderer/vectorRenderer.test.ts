import {
  DEFAULT_GEOMETRY_STYLE,
  type ArcObject,
  type CircleObject,
  type GeometryObjectRecord,
  type PointObject,
  type RegionObject,
  type VectorObject,
} from "../../core/geometry";
import { ArcRenderer } from "../../core/renderer/ArcRenderer";
import { CircleRenderer } from "../../core/renderer/CircleRenderer";
import { RegionRenderer } from "../../core/renderer/RegionRenderer";
import { VectorRenderer } from "../../core/renderer/VectorRenderer";
import { assert } from "../assert";

type InspectableElement = {
  readonly props?: Readonly<Record<string, unknown>>;
};

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

function hasPropValue(node: unknown, propName: string, expected: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some((child) => hasPropValue(child, propName, expected));
  }

  if (typeof node !== "object" || node === null) {
    return false;
  }

  const props = (node as InspectableElement).props;

  if (!props) {
    return false;
  }

  return props[propName] === expected || hasPropValue(props.children, propName, expected);
}

export function runVectorRendererTests(): void {
  assertVectorRenderer();
  assertThreePointCircleRenderer();
  assertArcRenderer();
  assertRegionRenderer();
}

function defaultViewport() {
  return {
    height: 100,
    offsetX: 0,
    offsetY: 0,
    scale: 10,
    width: 100,
  };
}

function assertVectorRenderer(): void {
  const vector: VectorObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "vector-ab",
    locked: false,
    metadata: {
      arrowSize: 12,
      arrowStyle: "stealth",
    },
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "vector",
    updatedAt: 2,
    visible: true,
  };
  const objects: GeometryObjectRecord = {
    a: point("a", 0, 0),
    b: point("b", 1, 0),
    "vector-ab": vector,
  };
  const rendered = VectorRenderer.render(vector, {
    hoveredObjectId: null,
    objects,
    selectedObjectIds: [],
    viewport: defaultViewport(),
    appTheme: "theme1",
  });

  assert(
    hasPropValue(rendered, "markerEnd", "url(#ndv-vector-arrow-vector-ab)"),
    "vector renderer applies a per-vector arrow marker",
  );
  assert(
    hasPropValue(rendered, "id", "ndv-vector-arrow-vector-ab"),
    "vector renderer defines the configured arrow marker",
  );
}

function assertThreePointCircleRenderer(): void {
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
    a: point("a", 1, 0),
    b: point("b", 0, 1),
    c: point("c", -1, 0),
    "circle-abc": circle,
  };
  const rendered = CircleRenderer.render(circle, {
    hoveredObjectId: null,
    objects,
    selectedObjectIds: [],
    viewport: defaultViewport(),
    appTheme: "theme1",
  });

  assert(hasPropValue(rendered, "r", 10), "three-point circle renderer computes screen radius");
}

function assertArcRenderer(): void {
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
    a: point("a", 1, 0),
    b: point("b", 0, 1),
    o: point("o", 0, 0),
    "arc-ab": arc,
  };
  const rendered = ArcRenderer.render(arc, {
    hoveredObjectId: null,
    objects,
    selectedObjectIds: [],
    viewport: defaultViewport(),
    appTheme: "theme1",
  });

  assert(hasPropValue(rendered, "data-object-type", "arc"), "arc renderer emits an arc object group");
}

function assertRegionRenderer(): void {
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
  const objects: GeometryObjectRecord = {
    a: point("a", 0, 0),
    b: point("b", 4, 0),
    c: point("c", 0, 3),
    "region-abc": region,
  };
  const rendered = RegionRenderer.render(region, {
    hoveredObjectId: null,
    objects,
    selectedObjectIds: [],
    viewport: defaultViewport(),
    appTheme: "theme1",
  });

  assert(hasPropValue(rendered, "data-object-type", "region"), "region renderer emits a region object group");
}
