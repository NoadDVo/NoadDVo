import {
  angleDegrees,
  distance,
  polygonArea,
  type GeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type PolygonObject,
  type SegmentObject,
} from "../geometry";
import type { ContextMenuActionContext } from "./ContextMenuTypes";

export function getTargetObject(context: ContextMenuActionContext): GeometryObject | null {
  if (context.target.kind !== "object") {
    return null;
  }

  return context.objects[context.target.objectId] ?? null;
}

export function getPoint(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

export function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

export function getSegmentPoints(
  object: SegmentObject,
  objects: GeometryObjectRecord,
): readonly [PointObject, PointObject] | null {
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  return start && end ? [start, end] : null;
}

export function getCircleRadius(
  object: GeometryObject,
  objects: GeometryObjectRecord,
): number | null {
  if (object.type !== "circle") {
    return null;
  }

  if (object.circleKind === "center-radius") {
    return object.radius;
  }

  if (object.circleKind === "center-point") {
    const center = getPoint(objects, object.centerPointId);
    const radiusPoint = getPoint(objects, object.radiusPointId);

    return center && radiusPoint ? distance(center, radiusPoint) : null;
  }

  return null;
}

export function getPolygonPoints(
  object: PolygonObject,
  objects: GeometryObjectRecord,
): readonly PointObject[] {
  return object.pointIds
    .map((pointId) => getPoint(objects, pointId))
    .filter((point): point is PointObject => Boolean(point));
}

export function getPolygonPerimeter(
  object: PolygonObject,
  objects: GeometryObjectRecord,
): number | null {
  const points = getPolygonPoints(object, objects);

  if (points.length < 3) {
    return null;
  }

  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];

    return next ? sum + distance(point, next) : sum;
  }, 0);
}

export function disabled(): false {
  return false;
}

export function isObjectTarget(context: ContextMenuActionContext): boolean {
  return context.target.kind === "object";
}

export function isUnlockedObject(context: ContextMenuActionContext): boolean {
  const object = getTargetObject(context);

  return Boolean(object && !object.locked);
}

export function detailFromValue(label: string, value: number | null): string {
  return value === null ? `${label} unavailable` : `${label} ${formatNumber(value)}`;
}

export function getAngleDetail(context: ContextMenuActionContext): string | null {
  const object = getTargetObject(context);

  if (object?.type !== "angle") {
    return null;
  }

  const pointA = getPoint(context.objects, object.pointAId);
  const vertex = getPoint(context.objects, object.vertexPointId);
  const pointC = getPoint(context.objects, object.pointCId);

  return detailFromValue(
    "Angle",
    pointA && vertex && pointC ? angleDegrees(pointA, vertex, pointC) : null,
  );
}

export function getPolygonAreaDetail(context: ContextMenuActionContext): string | null {
  const object = getTargetObject(context);

  if (object?.type !== "polygon") {
    return null;
  }

  const points = getPolygonPoints(object, context.objects);

  return detailFromValue("Area", points.length >= 3 ? Math.abs(polygonArea(points)) : null);
}

