import type {
  BoundingBox,
  CircleObject,
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
} from "../geometry";
import { distance } from "../geometry";

function getPoint(
  objectId: string,
  objects: GeometryObjectRecord,
): PointObject | null {
  const object = objects[objectId];

  return object?.type === "point" ? object : null;
}

function boxFromPoints(points: readonly Point2D[]): BoundingBox | null {
  if (points.length === 0) {
    return null;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
    minX: Math.min(...xs),
    minY: Math.min(...ys),
  };
}

function getCircleBoundingBox(
  object: CircleObject,
  objects: GeometryObjectRecord,
): BoundingBox | null {
  if (object.circleKind === "three-points") {
    return null;
  }

  const center = getPoint(object.centerPointId, objects);

  if (!center) {
    return null;
  }

  const radius =
    object.circleKind === "center-radius"
      ? object.radius
      : (() => {
          const radiusPoint = getPoint(object.radiusPointId, objects);

          return radiusPoint ? distance(center, radiusPoint) : null;
        })();

  if (radius === null) {
    return null;
  }

  return {
    maxX: center.x + radius,
    maxY: center.y + radius,
    minX: center.x - radius,
    minY: center.y - radius,
  };
}

export function getBoundingBox(
  object: GeometryObject,
  objects: GeometryObjectRecord,
): BoundingBox | null {
  if (object.type === "point") {
    return {
      maxX: object.x,
      maxY: object.y,
      minX: object.x,
      minY: object.y,
    };
  }

  if (object.type === "segment") {
    const start = getPoint(object.startPointId, objects);
    const end = getPoint(object.endPointId, objects);

    return start && end ? boxFromPoints([start, end]) : null;
  }

  if (object.type === "circle") {
    return getCircleBoundingBox(object, objects);
  }

  if (object.type === "polygon") {
    const points = object.pointIds
      .map((pointId) => getPoint(pointId, objects))
      .filter((point): point is PointObject => Boolean(point));

    return boxFromPoints(points);
  }

  return null;
}

export function boxContainsPoint(box: BoundingBox, point: Point2D): boolean {
  return (
    point.x >= box.minX &&
    point.x <= box.maxX &&
    point.y >= box.minY &&
    point.y <= box.maxY
  );
}

export function boxIntersectsBox(a: BoundingBox, b: BoundingBox): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

export function boxFromCorners(a: Point2D, b: Point2D): BoundingBox {
  return {
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
  };
}
