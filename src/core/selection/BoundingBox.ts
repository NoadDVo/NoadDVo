import type {
  BoundingBox,
  CircleObject,
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
} from "../geometry";
import {
  getArcGeometry,
  getCircleGeometry,
  getPointObject,
  getPolygonPoints,
  getTextPosition,
} from "../geometry";

function getPoint(
  objectId: string,
  objects: GeometryObjectRecord,
): PointObject | null {
  return getPointObject(objects, objectId);
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
  const geometry = getCircleGeometry(object, objects);

  if (!geometry) {
    return null;
  }

  return {
    maxX: geometry.center.x + geometry.radius,
    maxY: geometry.center.y + geometry.radius,
    minX: geometry.center.x - geometry.radius,
    minY: geometry.center.y - geometry.radius,
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

  if (object.type === "vector") {
    const start = getPoint(object.startPointId, objects);
    const end = getPoint(object.endPointId, objects);

    return start && end ? boxFromPoints([start, end]) : null;
  }

  if (object.type === "circle") {
    return getCircleBoundingBox(object, objects);
  }

  if (object.type === "polygon") {
    return boxFromPoints(getPolygonPoints(object, objects) ?? []);
  }

  if (object.type === "region") {
    return boxFromPoints(getPolygonPoints(object, objects) ?? []);
  }

  if (object.type === "arc") {
    const arc = getArcGeometry(object, objects);

    return arc ? boxFromPoints([arc.center, arc.startPoint, arc.endPoint]) : null;
  }

  if (object.type === "angle") {
    const pointA = getPoint(object.pointAId, objects);
    const vertex = getPoint(object.vertexPointId, objects);
    const pointC = getPoint(object.pointCId, objects);

    return pointA && vertex && pointC ? boxFromPoints([pointA, vertex, pointC]) : null;
  }

  if (object.type === "text") {
    return boxFromPoints([getTextPosition(object, objects)]);
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
