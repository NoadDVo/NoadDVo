import type {
  CircleObject,
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  ScreenPoint,
} from "../geometry";
import { distance, distanceSquared } from "../geometry";
import { worldToScreen, type Viewport } from "../geometry/viewport";

export type HitTestResult = {
  readonly object: GeometryObject;
  readonly objectId: string;
  readonly type: GeometryObject["type"] | "label" | "grid";
};

type HitTestOptions = {
  readonly tolerancePx?: number;
};

function getPoint(
  objectId: string,
  objects: GeometryObjectRecord,
): PointObject | null {
  const object = objects[objectId];

  return object?.type === "point" ? object : null;
}

function distanceToSegmentPx(
  point: ScreenPoint,
  start: ScreenPoint,
  end: ScreenPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared),
  );

  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function distanceToInfiniteLinePx(
  point: ScreenPoint,
  a: ScreenPoint,
  b: ScreenPoint,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(dy * point.x - dx * point.y + b.x * a.y - b.y * a.x) / length;
}

function distanceToRayPx(
  point: ScreenPoint,
  start: ScreenPoint,
  through: ScreenPoint,
): number {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;

  if (t < 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return distanceToInfiniteLinePx(point, start, through);
}

function isPointInPolygon(point: Point2D, polygonPoints: readonly Point2D[]): boolean {
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

function getCircleGeometry(
  object: CircleObject,
  objects: GeometryObjectRecord,
): { readonly center: PointObject; readonly radius: number } | null {
  if (object.circleKind === "three-points") {
    return null;
  }

  const center = getPoint(object.centerPointId, objects);

  if (!center) {
    return null;
  }

  if (object.circleKind === "center-radius") {
    return { center, radius: object.radius };
  }

  const radiusPoint = getPoint(object.radiusPointId, objects);

  return radiusPoint ? { center, radius: distance(center, radiusPoint) } : null;
}

function visibleObjectsByType<TType extends GeometryObject["type"]>(
  objects: GeometryObjectRecord,
  type: TType,
) {
  return Object.values(objects).filter(
    (object): object is Extract<GeometryObject, { readonly type: TType }> =>
      object.visible && object.type === type,
  );
}

export function hitTest(
  screenPoint: ScreenPoint,
  worldPoint: Point2D,
  objects: GeometryObjectRecord,
  viewport: Viewport,
  options: HitTestOptions = {},
): HitTestResult | null {
  const tolerancePx = options.tolerancePx ?? 10;

  for (const object of visibleObjectsByType(objects, "point")) {
    const point = worldToScreen(object, viewport);
    const radius = object.style.pointSize + tolerancePx;

    if (distanceSquared(screenPoint, point) <= radius * radius) {
      return { object, objectId: object.id, type: "point" };
    }
  }

  for (const object of visibleObjectsByType(objects, "point")) {
    if (!object.name || !object.style.labelVisible) {
      continue;
    }

    const point = worldToScreen(object, viewport);
    const labelBox = {
      maxX: point.x + 44,
      maxY: point.y,
      minX: point.x + object.style.pointSize + 8,
      minY: point.y - 24,
    };

    if (
      screenPoint.x >= labelBox.minX &&
      screenPoint.x <= labelBox.maxX &&
      screenPoint.y >= labelBox.minY &&
      screenPoint.y <= labelBox.maxY
    ) {
      return { object, objectId: object.id, type: "label" };
    }
  }

  for (const object of visibleObjectsByType(objects, "segment")) {
    const start = getPoint(object.startPointId, objects);
    const end = getPoint(object.endPointId, objects);

    if (!start || !end) {
      continue;
    }

    if (
      distanceToSegmentPx(
        screenPoint,
        worldToScreen(start, viewport),
        worldToScreen(end, viewport),
      ) <= tolerancePx
    ) {
      return { object, objectId: object.id, type: "segment" };
    }
  }

  for (const object of visibleObjectsByType(objects, "polygon")) {
    const points = object.pointIds
      .map((pointId) => getPoint(pointId, objects))
      .filter((point): point is PointObject => Boolean(point));

    if (points.length >= 3 && isPointInPolygon(worldPoint, points)) {
      return { object, objectId: object.id, type: "polygon" };
    }
  }

  for (const object of visibleObjectsByType(objects, "circle")) {
    const geometry = getCircleGeometry(object, objects);

    if (!geometry) {
      continue;
    }

    const center = worldToScreen(geometry.center, viewport);
    const radiusPx = geometry.radius * viewport.scale;
    const distancePx = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);

    if (Math.abs(distancePx - radiusPx) <= tolerancePx) {
      return { object, objectId: object.id, type: "circle" };
    }
  }

  for (const object of visibleObjectsByType(objects, "line")) {
    const pointA = getPoint(object.pointAId, objects);
    const pointB = getPoint(object.pointBId, objects);

    if (
      pointA &&
      pointB &&
      distanceToInfiniteLinePx(
        screenPoint,
        worldToScreen(pointA, viewport),
        worldToScreen(pointB, viewport),
      ) <= tolerancePx
    ) {
      return { object, objectId: object.id, type: "line" };
    }
  }

  for (const object of visibleObjectsByType(objects, "ray")) {
    const start = getPoint(object.startPointId, objects);
    const through = getPoint(object.throughPointId, objects);

    if (
      start &&
      through &&
      distanceToRayPx(
        screenPoint,
        worldToScreen(start, viewport),
        worldToScreen(through, viewport),
      ) <= tolerancePx
    ) {
      return { object, objectId: object.id, type: "ray" };
    }
  }

  return null;
}
