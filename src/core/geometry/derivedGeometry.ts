import {
  EPSILON,
  distance,
  isFiniteNumber,
} from "./math";
import { lineLineIntersection } from "./constructions/ConstructionAlgorithms";
import type {
  LineObject,
  ArcObject,
  CircleObject,
  EllipticalArcObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  PolygonObject,
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

export type EllipticalArcGeometry = {
  readonly center: Point2D;
  readonly rx: number;
  readonly ry: number;
  readonly startAngleDegrees: number;
  readonly endAngleDegrees: number;
  readonly startPoint: Point2D;
  readonly endPoint: Point2D;
  readonly phi: number;
  readonly thetaEnd: number;
};

export function getPointObject(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

export function getPolygonPoints(
  object: PolygonObject | { readonly type: "region"; readonly boundaryPointIds: readonly string[] },
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

  if (radius <= EPSILON) {
    return null;
  }
  
  const endAngle = angleDegrees(center, endPoint);
  const endAngleRad = (endAngle * Math.PI) / 180;
  const projectedEndPoint = {
    x: center.x + radius * Math.cos(endAngleRad),
    y: center.y + radius * Math.sin(endAngleRad),
  };

  return {
    center,
    endAngleDegrees: endAngle,
    endPoint: projectedEndPoint,
    radius,
    startAngleDegrees: angleDegrees(center, startPoint),
    startPoint,
  };
}

export function getEllipticalArcGeometry(
  object: EllipticalArcObject,
  objects: GeometryObjectRecord,
): EllipticalArcGeometry | null {
  const center = getPointObject(objects, object.centerPointId);
  const startPointObj = getPointObject(objects, object.startPointId);
  const endPointObj = getPointObject(objects, object.endPointId);

  if (!center || !startPointObj || !endPointObj) {
    return null;
  }

  const rx = distance(center, startPointObj);
  const ry = object.ry;

  if (rx <= EPSILON || ry <= EPSILON) {
    return null;
  }

  const phi = Math.atan2(startPointObj.y - center.y, startPointObj.x - center.x);
  const absB = Math.atan2(endPointObj.y - center.y, endPointObj.x - center.x);
  
  let theta_end = absB - phi;
  if (theta_end < 0) theta_end += 2 * Math.PI;
  if (theta_end === 0) theta_end = 2 * Math.PI;

  const startPoint = {
    x: center.x + rx * Math.cos(phi),
    y: center.y + rx * Math.sin(phi),
  };

  const endPoint = {
    x: center.x + rx * Math.cos(theta_end) * Math.cos(phi) - ry * Math.sin(theta_end) * Math.sin(phi),
    y: center.y + rx * Math.cos(theta_end) * Math.sin(phi) + ry * Math.sin(theta_end) * Math.cos(phi),
  };

  return {
    center,
    rx,
    ry,
    startAngleDegrees: (phi * 180) / Math.PI,
    endAngleDegrees: (absB * 180) / Math.PI,
    startPoint,
    endPoint,
    phi,
    thetaEnd: theta_end,
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

export function getBoundedLineEndpoints(
  line: LineObject,
  objects: GeometryObjectRecord,
): [Point2D, Point2D] | null {
  const pointA = objects[line.pointAId];
  const pointB = objects[line.pointBId];

  if (pointA?.type !== "point" || pointB?.type !== "point") {
    return null;
  }

  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const length = Math.hypot(dx, dy);

  if (length < 1e-9) {
    return null;
  }

  const dirX = dx / length;
  const dirY = dy / length;

  // 1. Perpendicular Line (from C to foot H)
  // 1. Perpendicular Line (from anchor to foot)
  if (pointB.construction?.type === "perpendicular-line-point") {
    const sourceLine = objects[pointB.construction.lineId];
    if (sourceLine) {
      const srcA = objects[(sourceLine as any).pointAId || (sourceLine as any).startPointId];
      const srcB = objects[(sourceLine as any).pointBId || (sourceLine as any).endPointId || (sourceLine as any).throughPointId];
      if (srcA?.type === "point" && srcB?.type === "point") {
        const intersection = lineLineIntersection(pointA, pointB, srcA, srcB)?.point;
        if (intersection) {
          return [pointA, intersection];
        }
      }
    }
    return [pointA, pointB];
  }

  // 2. Perpendicular Bisector (centered at midpoint, length = original AB)
  if (
    pointA.construction?.type === "midpoint" &&
    pointB.construction?.type === "perpendicular-bisector-point"
  ) {
    const origA = objects[pointB.construction.pointAId];
    const origB = objects[pointB.construction.pointBId];
    if (origA?.type === "point" && origB?.type === "point") {
      const origLength = Math.hypot(origB.x - origA.x, origB.y - origA.y);
      const halfLength = origLength / 2;
      return [
        { x: pointA.x - dirX * halfLength, y: pointA.y - dirY * halfLength },
        { x: pointA.x + dirX * halfLength, y: pointA.y + dirY * halfLength },
      ];
    }
  }

  // 2.5 Parallel Line (centered at anchor, length = source line)
  if (pointB.construction?.type === "parallel-line-point") {
    const sourceLine = objects[pointB.construction.lineId];
    if (sourceLine) {
      const srcA = objects[(sourceLine as any).pointAId || (sourceLine as any).startPointId];
      const srcB = objects[(sourceLine as any).pointBId || (sourceLine as any).endPointId || (sourceLine as any).throughPointId];
      if (srcA?.type === "point" && srcB?.type === "point") {
        const origLength = Math.hypot(srcB.x - srcA.x, srcB.y - srcA.y);
        const halfLength = origLength / 2;
        return [
          { x: pointA.x - dirX * halfLength, y: pointA.y - dirY * halfLength },
          { x: pointA.x + dirX * halfLength, y: pointA.y + dirY * halfLength },
        ];
      }
    }
  }

  // 3. Angle Bisector (from vertex to min length of sides)
  if (pointB.construction?.type === "angle-bisector-point") {
    const origA = objects[pointB.construction.pointAId];
    const origC = objects[pointB.construction.pointCId];
    if (origA?.type === "point" && origC?.type === "point") {
      const lenA = Math.hypot(origA.x - pointA.x, origA.y - pointA.y);
      const lenC = Math.hypot(origC.x - pointA.x, origC.y - pointA.y);
      const minLength = Math.min(lenA, lenC);
      return [
        pointA,
        { x: pointA.x + dirX * minLength, y: pointA.y + dirY * minLength },
      ];
    }
  }

  // 4. Default: extend by 20% past A and B
  const extension = length * 0.2;
  return [
    { x: pointA.x - dirX * extension, y: pointA.y - dirY * extension },
    { x: pointB.x + dirX * extension, y: pointB.y + dirY * extension },
  ];
}
