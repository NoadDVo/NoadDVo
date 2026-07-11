import { polygonArea } from "./math";

import {
  getCircleGeometry,
  getArcGeometry,
  isPointInPolygon,
  getPointObject,
  getPolygonPoints,
} from "./derivedGeometry";
import { collectBoundaryPrimitives } from "./regions/BoundaryFillEngine";
import type {
  BoundaryEdge,
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  RegionObject,
} from "./types";

export type ResolvedBoundaryPath =
  | {
      readonly kind: "polygon";
      readonly points: readonly PointObject[];
      readonly path: string;
    }
  | {
      readonly kind: "boundary";
      readonly path: string;
    };

function polar(center: Point2D, radius: number, degrees: number): Point2D {
  const radians = (degrees * Math.PI) / 180;

  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y + Math.sin(radians) * radius,
  };
}

function format(value: number): string {
  const rounded = Number(value.toFixed(6));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function moveTo(point: Point2D): string {
  return `M ${format(point.x)} ${format(point.y)}`;
}

function lineTo(point: Point2D): string {
  return `L ${format(point.x)} ${format(point.y)}`;
}

function edgeObject(edge: BoundaryEdge, objects: GeometryObjectRecord): GeometryObject | null {
  return objects[edge.objectId] ?? null;
}

function edgeStartEnd(
  edge: BoundaryEdge,
  objects: GeometryObjectRecord,
): readonly [Point2D, Point2D] | null {
  if (edge.startParameter !== undefined && edge.endParameter !== undefined) {
    const primitive = collectBoundaryPrimitives(objects).find((candidate) =>
      edge.sourcePrimitiveId
        ? candidate.id === edge.sourcePrimitiveId
        : candidate.objectId === edge.objectId,
    );

    if (primitive?.kind === "linear" && primitive.origin && primitive.vector) {
      const start = {
        x: primitive.origin.x + primitive.vector.x * edge.startParameter,
        y: primitive.origin.y + primitive.vector.y * edge.startParameter,
      };
      const end = {
        x: primitive.origin.x + primitive.vector.x * edge.endParameter,
        y: primitive.origin.y + primitive.vector.y * edge.endParameter,
      };

      return [start, end];
    }
  }

  const start = edge.startPointId ? getPointObject(objects, edge.startPointId) : null;
  const end = edge.endPointId ? getPointObject(objects, edge.endPointId) : null;

  if (start && end) {
    return edge.direction === "reverse" ? [end, start] : [start, end];
  }

  const object = edgeObject(edge, objects);

  if (object?.type === "segment" || object?.type === "vector") {
    const objectStart = getPointObject(objects, object.startPointId);
    const objectEnd = getPointObject(objects, object.endPointId);

    return objectStart && objectEnd
      ? edge.direction === "reverse" ? [objectEnd, objectStart] : [objectStart, objectEnd]
      : null;
  }

  return null;
}

function arcCommand(
  center: Point2D,
  radius: number,
  startDegrees: number,
  endDegrees: number,
  direction: "forward" | "reverse",
): string {
  const start = polar(center, radius, startDegrees);
  const end = polar(center, radius, endDegrees);
  const rawDelta = direction === "reverse"
    ? (startDegrees - endDegrees + 360) % 360
    : (endDegrees - startDegrees + 360) % 360;
  const delta = rawDelta === 0 ? 360 : rawDelta;
  const largeArc = delta > 180 ? 1 : 0;
  const sweep = direction === "reverse" ? 0 : 1;

  return `${moveTo(start)} A ${format(radius)} ${format(radius)} 0 ${largeArc} ${sweep} ${format(end.x)} ${format(end.y)}`;
}

function edgePath(edge: BoundaryEdge, objects: GeometryObjectRecord, first: boolean): string | null {
  const object = edgeObject(edge, objects);

  if (
    edge.edgeKind === "segment" ||
    edge.edgeKind === "polygon-edge" ||
    edge.edgeKind === "line" ||
    edge.edgeKind === "ray" ||
    edge.edgeKind === "ellipse" ||
    edge.edgeKind === "hyperbola" ||
    edge.edgeKind === "polynomial"
  ) {
    const endpoints = edgeStartEnd(edge, objects);

    if (!endpoints) {
      return null;
    }

    const [start, end] = endpoints;

    return `${first ? moveTo(start) : ""} ${lineTo(end)}`.trim();
  }

  if (edge.edgeKind === "circle" && object?.type === "circle") {
    const circle = getCircleGeometry(object, objects);

    if (!circle) {
      return null;
    }

    const start = edge.startParameter ?? 0;
    const end = edge.endParameter ?? 360;
    const firstArc = arcCommand(circle.center, circle.radius, start, start + 180, "forward");
    const secondArc = arcCommand(circle.center, circle.radius, start + 180, end, "forward")
      .replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");

    return `${firstArc} ${secondArc}`;
  }

  if (edge.edgeKind === "arc") {
    if (object?.type === "circle") {
      const circle = getCircleGeometry(object, objects);

      if (!circle || edge.startParameter === undefined || edge.endParameter === undefined) {
        return null;
      }

      const path = arcCommand(
        circle.center,
        circle.radius,
        edge.startParameter,
        edge.endParameter,
        edge.direction,
      );

      return first ? path : path.replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");
    }

    if (object?.type === "arc") {
      const geometry = getArcGeometry(object, objects);

      if (!geometry) {
        return null;
      }

      const startAngle = edge.startParameter ?? geometry.startAngleDegrees;
      const endAngle = edge.endParameter ?? geometry.endAngleDegrees;
      const path = arcCommand(
        geometry.center,
        geometry.radius,
        startAngle,
        endAngle,
        edge.direction,
      );

      return first ? path : path.replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");
    }
  }

  return null;
}

export function getRegionDependencyIds(object: RegionObject): readonly string[] {
  if (object.regionKind === "boundary" && object.loops) {
    const ids = object.loops.flatMap((loop) =>
      loop.edges.flatMap((edge) => [
        edge.objectId,
        ...(edge.startPointId ? [edge.startPointId] : []),
        ...(edge.endPointId ? [edge.endPointId] : []),
      ]),
    );

    return Array.from(new Set(ids));
  }



  return object.boundaryPointIds;
}

export function getRegionBoundaryPath(
  object: RegionObject,
  objects: GeometryObjectRecord,
): ResolvedBoundaryPath | null {
  if (object.regionKind === "boundary" && object.loops?.length) {
    const paths = object.loops.map((loop) => {
      const parts = loop.edges.map((edge, index) => edgePath(edge, objects, index === 0));

      return parts.some((part) => part === null)
        ? null
        : `${parts.join(" ")}${loop.closed ? " Z" : ""}`;
    });

    if (paths.some((path) => path === null)) {
      return null;
    }

    return {
      kind: "boundary",
      path: paths.join(" "),
    };
  }

  const points = getPolygonPoints(object, objects);

  if (!points || points.length < 3) {
    return null;
  }

  return {
    kind: "polygon",
    path: `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${format(point.x)} ${format(point.y)}`).join(" ")} Z`,
    points,
  };
}

export function getRegionArea(object: RegionObject, objects: GeometryObjectRecord): number | null {
  const boundary = getRegionBoundaryPath(object, objects);

  if (!boundary) {
    return null;
  }

  if (boundary.kind === "polygon") {
    return Math.abs(polygonArea(boundary.points));
  }

  return null;
}

export function regionContainsPoint(
  object: RegionObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): boolean {
  const boundary = getRegionBoundaryPath(object, objects);

  if (!boundary) {
    return false;
  }

  if (boundary.kind === "polygon") {
    return isPointInPolygon(point, boundary.points);
  }

  return false;
}
