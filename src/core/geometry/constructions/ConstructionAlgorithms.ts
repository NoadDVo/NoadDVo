import {
  EPSILON,
  addVectors,
  cross,
  distance,
  dot,
  midpoint,
  normalize,
  perpendicular,
  pointsAlmostEqual,
  vectorFromPoints,
} from "../math";
import type {
  CircleObject,
  ConstructionDefinition,
  GeometryObject,
  GeometryObjectRecord,
  LineObject,
  Point2D,
  PointObject,
  SegmentObject,
} from "../types";

type LinearObject = LineObject | SegmentObject;

function getPoint(objects: GeometryObjectRecord, objectId: string): PointObject | null {
  const object = objects[objectId];

  return object?.type === "point" ? object : null;
}

function getLinearPoints(
  object: LinearObject,
  objects: GeometryObjectRecord,
): readonly [PointObject, PointObject] | null {
  const pointAId = object.type === "line" ? object.pointAId : object.startPointId;
  const pointBId = object.type === "line" ? object.pointBId : object.endPointId;
  const pointA = getPoint(objects, pointAId);
  const pointB = getPoint(objects, pointBId);

  return pointA && pointB ? [pointA, pointB] : null;
}

function getCircleGeometry(
  object: CircleObject,
  objects: GeometryObjectRecord,
): { readonly center: PointObject; readonly radius: number } | null {
  if (object.circleKind === "three-points") {
    return null;
  }

  const center = getPoint(objects, object.centerPointId);

  if (!center) {
    return null;
  }

  if (object.circleKind === "center-radius") {
    return { center, radius: object.radius };
  }

  const radiusPoint = getPoint(objects, object.radiusPointId);

  return radiusPoint ? { center, radius: distance(center, radiusPoint) } : null;
}

function isBetween01(value: number): boolean {
  return value >= -EPSILON && value <= 1 + EPSILON;
}

export function lineLineIntersection(
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D,
  pointD: Point2D,
): { readonly point: Point2D; readonly t: number; readonly u: number } | null {
  const r = vectorFromPoints(pointA, pointB);
  const s = vectorFromPoints(pointC, pointD);
  const denominator = cross(r, s);

  if (Math.abs(denominator) <= EPSILON) {
    return null;
  }

  const cMinusA = vectorFromPoints(pointA, pointC);
  const t = cross(cMinusA, s) / denominator;
  const u = cross(cMinusA, r) / denominator;

  return {
    point: {
      x: pointA.x + t * r.x,
      y: pointA.y + t * r.y,
    },
    t,
    u,
  };
}

export function intersectLinearObjects(
  first: LinearObject,
  second: LinearObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const firstPoints = getLinearPoints(first, objects);
  const secondPoints = getLinearPoints(second, objects);

  if (!firstPoints || !secondPoints) {
    return [];
  }

  const result = lineLineIntersection(
    firstPoints[0],
    firstPoints[1],
    secondPoints[0],
    secondPoints[1],
  );

  if (!result) {
    return [];
  }

  if (first.type === "segment" && !isBetween01(result.t)) {
    return [];
  }

  if (second.type === "segment" && !isBetween01(result.u)) {
    return [];
  }

  return [result.point];
}

export function intersectLineCircle(
  line: LineObject,
  circle: CircleObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const linePoints = getLinearPoints(line, objects);
  const circleGeometry = getCircleGeometry(circle, objects);

  if (!linePoints || !circleGeometry) {
    return [];
  }

  const direction = vectorFromPoints(linePoints[0], linePoints[1]);
  const fromCenter = vectorFromPoints(circleGeometry.center, linePoints[0]);
  const a = direction.x * direction.x + direction.y * direction.y;
  const b = 2 * (fromCenter.x * direction.x + fromCenter.y * direction.y);
  const c =
    fromCenter.x * fromCenter.x +
    fromCenter.y * fromCenter.y -
    circleGeometry.radius * circleGeometry.radius;
  const discriminant = b * b - 4 * a * c;

  if (a <= EPSILON || discriminant < -EPSILON) {
    return [];
  }

  if (Math.abs(discriminant) <= EPSILON) {
    const t = -b / (2 * a);

    return [{ x: linePoints[0].x + t * direction.x, y: linePoints[0].y + t * direction.y }];
  }

  const sqrt = Math.sqrt(discriminant);
  const firstT = (-b - sqrt) / (2 * a);
  const secondT = (-b + sqrt) / (2 * a);

  return [
    { x: linePoints[0].x + firstT * direction.x, y: linePoints[0].y + firstT * direction.y },
    { x: linePoints[0].x + secondT * direction.x, y: linePoints[0].y + secondT * direction.y },
  ];
}

export function intersectCircles(
  first: CircleObject,
  second: CircleObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const firstCircle = getCircleGeometry(first, objects);
  const secondCircle = getCircleGeometry(second, objects);

  if (!firstCircle || !secondCircle) {
    return [];
  }

  const centerDistance = distance(firstCircle.center, secondCircle.center);

  if (
    centerDistance <= EPSILON ||
    centerDistance > firstCircle.radius + secondCircle.radius + EPSILON ||
    centerDistance < Math.abs(firstCircle.radius - secondCircle.radius) - EPSILON
  ) {
    return [];
  }

  const a =
    (firstCircle.radius * firstCircle.radius -
      secondCircle.radius * secondCircle.radius +
      centerDistance * centerDistance) /
    (2 * centerDistance);
  const hSquared = firstCircle.radius * firstCircle.radius - a * a;

  if (hSquared < -EPSILON) {
    return [];
  }

  const h = Math.sqrt(Math.max(0, hSquared));
  const direction = vectorFromPoints(firstCircle.center, secondCircle.center);
  const base = {
    x: firstCircle.center.x + (a * direction.x) / centerDistance,
    y: firstCircle.center.y + (a * direction.y) / centerDistance,
  };

  if (h <= EPSILON) {
    return [base];
  }

  const offset = {
    x: (-direction.y * h) / centerDistance,
    y: (direction.x * h) / centerDistance,
  };

  return [
    { x: base.x + offset.x, y: base.y + offset.y },
    { x: base.x - offset.x, y: base.y - offset.y },
  ].sort((aPoint, bPoint) => aPoint.x - bPoint.x || aPoint.y - bPoint.y);
}

export function getIntersectionPoints(
  first: GeometryObject,
  second: GeometryObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  if (
    (first.type === "line" && second.type === "line") ||
    (first.type === "segment" && second.type === "segment")
  ) {
    return intersectLinearObjects(first, second, objects);
  }

  if (first.type === "line" && second.type === "circle") {
    return intersectLineCircle(first, second, objects);
  }

  if (first.type === "circle" && second.type === "line") {
    return intersectLineCircle(second, first, objects);
  }

  if (first.type === "circle" && second.type === "circle") {
    return intersectCircles(first, second, objects);
  }

  return [];
}

export function projectPointToLine(
  point: Point2D,
  linePointA: Point2D,
  linePointB: Point2D,
): Point2D | null {
  const direction = vectorFromPoints(linePointA, linePointB);
  const lengthSquared = direction.x * direction.x + direction.y * direction.y;

  if (lengthSquared <= EPSILON) {
    return null;
  }

  const t = dot(vectorFromPoints(linePointA, point), direction) / lengthSquared;

  return {
    x: linePointA.x + t * direction.x,
    y: linePointA.y + t * direction.y,
  };
}

export function angleBisectorDirectionPoint(
  pointA: Point2D,
  vertex: Point2D,
  pointC: Point2D,
): Point2D | null {
  const first = normalize(vectorFromPoints(vertex, pointA));
  const second = normalize(vectorFromPoints(vertex, pointC));
  const direction = addVectors(first, second);

  if (Math.hypot(direction.x, direction.y) <= EPSILON) {
    return null;
  }

  return {
    x: vertex.x + direction.x,
    y: vertex.y + direction.y,
  };
}

export function incenterPoint(
  pointA: Point2D,
  pointB: Point2D,
  pointC: Point2D,
): Point2D | null {
  const sideA = distance(pointB, pointC);
  const sideB = distance(pointC, pointA);
  const sideC = distance(pointA, pointB);
  const perimeter = sideA + sideB + sideC;

  if (perimeter <= EPSILON) {
    return null;
  }

  return {
    x: (sideA * pointA.x + sideB * pointB.x + sideC * pointC.x) / perimeter,
    y: (sideA * pointA.y + sideB * pointB.y + sideC * pointC.y) / perimeter,
  };
}

export function recomputeConstructedPoint(
  construction: ConstructionDefinition,
  objects: GeometryObjectRecord,
): Point2D | null {
  if (construction.type === "midpoint") {
    const pointA = getPoint(objects, construction.pointAId);
    const pointB = getPoint(objects, construction.pointBId);

    return pointA && pointB ? midpoint(pointA, pointB) : null;
  }

  if (construction.type === "intersection") {
    const sourceA = objects[construction.sourceAId];
    const sourceB = objects[construction.sourceBId];

    if (!sourceA || !sourceB) {
      return null;
    }

    return getIntersectionPoints(sourceA, sourceB, objects)[construction.index] ?? null;
  }

  if (construction.type === "perpendicular-bisector-point") {
    const pointA = getPoint(objects, construction.pointAId);
    const pointB = getPoint(objects, construction.pointBId);

    if (!pointA || !pointB) {
      return null;
    }

    const middle = midpoint(pointA, pointB);
    const normal = perpendicular(vectorFromPoints(pointA, pointB));

    if (Math.hypot(normal.x, normal.y) <= EPSILON) {
      return null;
    }

    return {
      x: middle.x + normal.x,
      y: middle.y + normal.y,
    };
  }

  if (construction.type === "angle-bisector-point") {
    const pointA = getPoint(objects, construction.pointAId);
    const vertex = getPoint(objects, construction.vertexPointId);
    const pointC = getPoint(objects, construction.pointCId);

    return pointA && vertex && pointC
      ? angleBisectorDirectionPoint(pointA, vertex, pointC)
      : null;
  }

  if (construction.type === "projection-point") {
    const point = getPoint(objects, construction.pointId);
    const linePointA = getPoint(objects, construction.linePointAId);
    const linePointB = getPoint(objects, construction.linePointBId);

    return point && linePointA && linePointB
      ? projectPointToLine(point, linePointA, linePointB)
      : null;
  }

  if (construction.type === "incenter") {
    const pointA = getPoint(objects, construction.pointAId);
    const pointB = getPoint(objects, construction.pointBId);
    const pointC = getPoint(objects, construction.pointCId);

    return pointA && pointB && pointC
      ? incenterPoint(pointA, pointB, pointC)
      : null;
  }

  if (construction.type === "inradius-point") {
    const center = getPoint(objects, construction.centerPointId);
    const sidePointA = getPoint(objects, construction.sidePointAId);
    const sidePointB = getPoint(objects, construction.sidePointBId);

    return center && sidePointA && sidePointB
      ? projectPointToLine(center, sidePointA, sidePointB)
      : null;
  }

  const point = getPoint(objects, construction.pointId);
  const line = objects[construction.lineId];

  if (!point || line?.type !== "line") {
    return null;
  }

  const linePoints = getLinearPoints(line, objects);

  if (!linePoints) {
    return null;
  }

  const direction = vectorFromPoints(linePoints[0], linePoints[1]);
  const vector =
    construction.type === "perpendicular-line-point"
      ? perpendicular(direction)
      : direction;

  if (Math.hypot(vector.x, vector.y) <= EPSILON) {
    return null;
  }

  const candidate = { x: point.x + vector.x, y: point.y + vector.y };

  return pointsAlmostEqual(point, candidate) ? null : candidate;
}
