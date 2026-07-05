import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type PointObject,
  type VectorObject,
} from "../../core/geometry";
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
    viewport: {
      height: 100,
      offsetX: 0,
      offsetY: 0,
      scale: 10,
      width: 100,
    },
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
