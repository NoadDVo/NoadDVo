import type {
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  ScreenPoint,
} from "../geometry";
import {
  angleRadians,
  distance,
  getArcGeometry,
  getCircleGeometry,
  getPolygonPoints,
  regionContainsPoint,
  getTextFontSize,
  getTextPosition,
  isPointInPolygon,
} from "../geometry";
import { getPointObject, getEllipticalArcGeometry } from "../geometry/derivedGeometry";
import { getEllipseGeometry } from "../geometry/conicGeometry";
import { worldToScreen, type Viewport } from "../geometry/viewport";
import { getClosestPointOnObject } from "./closestPoint";

export type HitTestResult = {
  readonly object: GeometryObject;
  readonly objectId: string;
  readonly type: GeometryObject["type"] | "label" | "grid" | "slider-knob";
};

export const HIT_RADIUS = 8;

type HitTestOptions = {
  readonly tolerancePx?: number;
};

function getPoint(
  objectId: string,
  objects: GeometryObjectRecord,
): PointObject | null {
  return getPointObject(objects, objectId);
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

function visibleObjectsByType<TType extends GeometryObject["type"]>(
  objects: GeometryObjectRecord,
  type: TType,
) {
  return Object.values(objects).filter(
    (object): object is Extract<GeometryObject, { readonly type: TType }> =>
      object.visible && object.type === type,
  );
}

export function normalizedAngleDegrees(center: Point2D, pointer: Point2D): number {
  let angle = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI;
  if (angle < 0) {
    angle += 360;
  }
  return angle;
}

export function isAngleOnArc(
  angle: number,
  start: number,
  end: number,
  direction: "clockwise" | "counterclockwise",
): boolean {
  if (direction === "counterclockwise") {
    return ((angle - start + 360) % 360) <= ((end - start + 360) % 360 || 360);
  }

  return ((start - angle + 360) % 360) <= ((start - end + 360) % 360 || 360);
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
    const distance = Math.sqrt(
      Math.pow(screenPoint.x - point.x, 2) + Math.pow(screenPoint.y - point.y, 2)
    );

    if (distance <= HIT_RADIUS) {
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

  for (const object of visibleObjectsByType(objects, "text")) {
    const position = worldToScreen(getTextPosition(object, objects), viewport);
    const fontSize = getTextFontSize(object);
    const width = Math.max(36, object.content.length * fontSize * 0.62);
    const height = fontSize * 1.5;

    if (
      screenPoint.x >= position.x - tolerancePx &&
      screenPoint.x <= position.x + width + tolerancePx &&
      screenPoint.y >= position.y - height - tolerancePx &&
      screenPoint.y <= position.y + tolerancePx
    ) {
      return { object, objectId: object.id, type: "text" };
    }
  }



  for (const object of visibleObjectsByType(objects, "image")) {
    const halfWidth = object.width / 2;
    const halfHeight = object.height / 2;
    const toleranceWorld = tolerancePx / viewport.scale;

    if (
      worldPoint.x >= object.x - halfWidth - toleranceWorld &&
      worldPoint.x <= object.x + halfWidth + toleranceWorld &&
      worldPoint.y >= object.y - halfHeight - toleranceWorld &&
      worldPoint.y <= object.y + halfHeight + toleranceWorld
    ) {
      return { object, objectId: object.id, type: "image" };
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

  for (const object of visibleObjectsByType(objects, "region")) {
    if (regionContainsPoint(object, worldPoint, objects)) {
      return { object, objectId: object.id, type: "region" };
    }
  }

  for (const object of visibleObjectsByType(objects, "polygon")) {
    const points = getPolygonPoints(object, objects) ?? [];

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

  for (const object of visibleObjectsByType(objects, "arc")) {
    const geometry = getArcGeometry(object, objects);

    if (!geometry) {
      continue;
    }

    const center = worldToScreen(geometry.center, viewport);
    const radiusPx = geometry.radius * viewport.scale;
    const distancePx = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);
    const pointerAngle = normalizedAngleDegrees(geometry.center, worldPoint);

    if (
      (Math.abs(distancePx - radiusPx) <= tolerancePx ||
        (object.style.fill !== "transparent" && distancePx <= radiusPx)) &&
      isAngleOnArc(
        pointerAngle,
        geometry.startAngleDegrees,
        geometry.endAngleDegrees,
        object.direction,
      )
    ) {
      return { object, objectId: object.id, type: "arc" };
    }
  }

  for (const object of visibleObjectsByType(objects, "elliptical-arc")) {
    const closestWorld = getClosestPointOnObject(object, worldPoint, objects);
    if (closestWorld) {
      const closestScreen = worldToScreen(closestWorld, viewport);
      const distancePx = Math.hypot(screenPoint.x - closestScreen.x, screenPoint.y - closestScreen.y);
      let isInside = false;
      if (object.style.fill !== "transparent") {
        const geom = getEllipticalArcGeometry(object as any, objects);
        if (geom) {
          const angleRad = geom.phi;
          const dx0 = worldPoint.x - geom.center.x;
          const dy0 = worldPoint.y - geom.center.y;
          const dx = (dx0 * Math.cos(angleRad) + dy0 * Math.sin(angleRad)) / geom.rx;
          const dy = (-dx0 * Math.sin(angleRad) + dy0 * Math.cos(angleRad)) / geom.ry;
          if (dx * dx + dy * dy <= 1) {
             const ptrAngle = normalizedAngleDegrees(geom.center, worldPoint);
             if (isAngleOnArc(ptrAngle, geom.startAngleDegrees, geom.endAngleDegrees, object.direction)) {
               isInside = true;
             }
          }
        }
      }
      if (distancePx <= tolerancePx || isInside) {
        return { object, objectId: object.id, type: "elliptical-arc" };
      }
    }
  }

  for (const object of visibleObjectsByType(objects, "ellipse")) {
    const closestWorld = getClosestPointOnObject(object, worldPoint, objects);
    if (closestWorld) {
      const closestScreen = worldToScreen(closestWorld, viewport);
      const distancePx = Math.hypot(screenPoint.x - closestScreen.x, screenPoint.y - closestScreen.y);
      let isInside = false;
      if (object.style.fill !== "transparent") {
        const geom = getEllipseGeometry(object as any, objects);
        if (geom) {
          const angleRad = (geom.angleDegrees * Math.PI) / 180;
          const dx0 = worldPoint.x - geom.center.x;
          const dy0 = worldPoint.y - geom.center.y;
          const dx = (dx0 * Math.cos(angleRad) + dy0 * Math.sin(angleRad)) / geom.rx;
          const dy = (-dx0 * Math.sin(angleRad) + dy0 * Math.cos(angleRad)) / geom.ry;
          isInside = dx * dx + dy * dy <= 1;
        }
      }
      if (distancePx <= tolerancePx || isInside) {
        return { object, objectId: object.id, type: "ellipse" };
      }
    }
  }

  for (const object of visibleObjectsByType(objects, "hyperbola")) {
    const closestWorld = getClosestPointOnObject(object, worldPoint, objects);
    if (closestWorld) {
      const closestScreen = worldToScreen(closestWorld, viewport);
      const distancePx = Math.hypot(screenPoint.x - closestScreen.x, screenPoint.y - closestScreen.y);
      if (distancePx <= tolerancePx) {
        return { object, objectId: object.id, type: "hyperbola" };
      }
    }
  }

  for (const object of visibleObjectsByType(objects, "polynomial")) {
    const closestWorld = getClosestPointOnObject(object, worldPoint, objects);
    if (closestWorld) {
      const closestScreen = worldToScreen(closestWorld, viewport);
      const distancePx = Math.hypot(screenPoint.x - closestScreen.x, screenPoint.y - closestScreen.y);
      if (distancePx <= tolerancePx) {
        return { object, objectId: object.id, type: "polynomial" };
      }
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

  for (const object of visibleObjectsByType(objects, "angle")) {
    const pointA = getPoint(object.pointAId, objects);
    const vertex = getPoint(object.vertexPointId, objects);
    const pointC = getPoint(object.pointCId, objects);

    if (!pointA || !vertex || !pointC) {
      continue;
    }

    const radius = Math.max(0.15, object.radius);
    const toleranceWorld = tolerancePx / viewport.scale;
    const radialDistance = Math.abs(distance(vertex, worldPoint) - radius);
    const targetAngle = angleRadians(pointA, vertex, pointC);
    const splitAngle =
      angleRadians(pointA, vertex, worldPoint) +
      angleRadians(worldPoint, vertex, pointC);

    if (
      radialDistance <= toleranceWorld &&
      Math.abs(splitAngle - targetAngle) <= (3 * Math.PI) / 180
    ) {
      return { object, objectId: object.id, type: "angle" };
    }
  }

  for (const object of visibleObjectsByType(objects, "slider")) {
    const trackStart = worldToScreen({ x: object.x, y: object.y }, viewport);
    const trackEnd = { x: trackStart.x + object.widthPx, y: trackStart.y };
    
    // Check knob (higher priority)
    const ratio = (object.value - object.min) / (object.max - object.min);
    const knobX = trackStart.x + object.widthPx * ratio;
    const knobDistance = Math.hypot(screenPoint.x - knobX, screenPoint.y - trackStart.y);
    
    if (knobDistance <= HIT_RADIUS + tolerancePx) {
      return { object, objectId: object.id, type: "slider-knob" };
    }
    
    // Check track
    if (
      distanceToSegmentPx(screenPoint, trackStart, trackEnd) <= tolerancePx
    ) {
      return { object, objectId: object.id, type: "slider" };
    }
  }

  return null;
}
