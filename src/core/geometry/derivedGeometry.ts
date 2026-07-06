import {
  EPSILON,
  distance,
  isFiniteNumber,
  polygonArea,
} from "./math";
import type {
  ArcObject,
  CircleObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  PolygonObject,
  RegionObject,
} from "./types";

export type CircleGeometry = {
  readonly center: Point2D;
  readonly radius: number;
};

export type ArcGeometry = {
  readonly center: Point2D;
  readonly radius: number;
  readonly startAngleDegrees: number;
  readonly endAngleDegrees: number;
  readonly startPoint: Point2D;
  readonly endPoint: Point2D;
};

export function getPointObject(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

export function getPolygonPoints(
  object: PolygonObject | RegionObject,
  objects: GeometryObjectRecord,
): readonly PointObject[] | null {
  const pointIds = object.type === "polygon" ? object.pointIds : object.boundaryPointIds;
  const points = pointIds.map((pointId) => getPointObject(objects, pointId));

  return points.some((point) => point === null)
    ? null
    : points.filter((point): point is PointObject => Boolean(point));
}

export function circumcircleFromPoints(
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D,
): CircleGeometry | null {
  const determinant =
    2 *
    (pointA.x * (pointB.y - pointC.y) +
      pointB.x * (pointC.y - pointA.y) +
      pointC.x * (pointA.y - pointB.y));

  if (Math.abs(determinant) <= EPSILON) {
    return null;
  }

  const aSquared = pointA.x * pointA.x + pointA.y * pointA.y;
  const bSquared = pointB.x * pointB.x + pointB.y * pointB.y;
  const cSquared = pointC.x * pointC.x + pointC.y * pointC.y;
  const center = {
    x:
      (aSquared * (pointB.y - pointC.y) +
        bSquared * (pointC.y - pointA.y) +
        cSquared * (pointA.y - pointB.y)) /
      determinant,
    y:
      (aSquared * (pointC.x - pointB.x) +
        bSquared * (pointA.x - pointC.x) +
        cSquared * (pointB.x - pointA.x)) /
      determinant,
  };

  if (!isFiniteNumber(center.x) || !isFiniteNumber(center.y)) {
    return null;
  }

  const radius = distance(center, pointA);

  return radius > EPSILON ? { center, radius } : null;
}

export function getCircleGeometry(
  object: CircleObject,
  objects: GeometryObjectRecord,
): CircleGeometry | null {
  if (object.circleKind === "center-radius") {
    const center = getPointObject(objects, object.centerPointId);

    return center ? { center, radius: object.radius } : null;
  }

  if (object.circleKind === "center-point") {
    const center = getPointObject(objects, object.centerPointId);
    const radiusPoint = getPointObject(objects, object.radiusPointId);

    return center && radiusPoint
      ? { center, radius: distance(center, radiusPoint) }
      : null;
  }

  const pointA = getPointObject(objects, object.pointAId);
  const pointB = getPointObject(objects, object.pointBId);
  const pointC = getPointObject(objects, object.pointCId);

  return pointA && pointB && pointC
    ? circumcircleFromPoints(pointA, pointB, pointC)
    : null;
}

function angleDegrees(center: Point2D, point: Point2D): number {
  const degrees = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;

  return degrees < 0 ? degrees + 360 : degrees;
}

export function getArcGeometry(
  object: ArcObject,
  objects: GeometryObjectRecord,
): ArcGeometry | null {
  const center = getPointObject(objects, object.centerPointId);
  const startPoint = getPointObject(objects, object.startPointId);
  const endPoint = getPointObject(objects, object.endPointId);

  if (!center || !startPoint || !endPoint) {
    return null;
  }

  const radius = distance(center, startPoint);

  if (radius <= EPSILON || Math.abs(distance(center, endPoint) - radius) > EPSILON * 1000) {
    return null;
  }

  return {
    center,
    endAngleDegrees: angleDegrees(center, endPoint),
    endPoint,
    radius,
    startAngleDegrees: angleDegrees(center, startPoint),
    startPoint,
  };
}

export function isPointInPolygon(
  point: Point2D,
  polygonPoints: readonly Point2D[],
): boolean {
  let inside = false;

  for (
    let index = 0, previousIndex = polygonPoints.length - 1;
    index < polygonPoints.length;
    previousIndex = index, index += 1
  ) {
    const current = polygonPoints[index];
    const previous = polygonPoints[previousIndex];

    if (!current || !previous) {
      continue;
    }

    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function getRegionArea(
  object: RegionObject,
  objects: GeometryObjectRecord,
): number | null {
  const points = getPolygonPoints(object, objects);

  return points ? Math.abs(polygonArea(points)) : null;
}
