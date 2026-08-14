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
  ArcObject,
  CircleObject,
  ConstructionDefinition,
  EllipseObject,
  EllipticalArcObject,
  GeometryObject,
  GeometryObjectRecord,
  LineObject,
  Point2D,
  PointObject,
  RayObject,
  SegmentObject,
} from "../types";
import { getArcGeometry } from "../derivedGeometry";
import { getEllipseGeometry } from "../conicGeometry";
import {
  discretizeEllipseObject,
  discretizeEllipticalArcObject,
  type PolylineSegment,
} from "../curveDiscretization";

type LinearObject = LineObject | SegmentObject | RayObject;

function getPoint(objects: GeometryObjectRecord, objectId: string): PointObject | null {
  const object = objects[objectId];

  return object?.type === "point" ? object : null;
}

function resolveVariable(
  objects: GeometryObjectRecord,
  valueOrVariable: number | string,
  defaultValue: number,
): number {
  if (typeof valueOrVariable === "number") {
    return valueOrVariable;
  }

  // Find slider by variableName
  const sliders = Object.values(objects).filter(
    (obj): obj is import("../types").SliderObject => obj.type === "slider"
  );
  const slider = sliders.find((s) => s.variableName === valueOrVariable);

  if (slider) {
    return slider.value;
  }

  return parseFloat(valueOrVariable) || defaultValue;
}

export function getLinearPoints(
  object: LinearObject,
  objects: GeometryObjectRecord,
): readonly [PointObject, PointObject] | null {
  let pointAId: string;
  let pointBId: string;
  
  if (object.type === "line") {
    pointAId = object.pointAId;
    pointBId = object.pointBId;
  } else if (object.type === "segment") {
    pointAId = object.startPointId;
    pointBId = object.endPointId;
  } else {
    pointAId = object.startPointId;
    pointBId = object.throughPointId;
  }
  
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
  
  if (first.type === "ray" && result.t < -EPSILON) {
    return [];
  }

  if (second.type === "segment" && !isBetween01(result.u)) {
    return [];
  }
  
  if (second.type === "ray" && result.u < -EPSILON) {
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

// ─── Arc angle checking helpers ──────────────────────────────────────────────

function normalizeAngle(degrees: number): number {
  const v = degrees % 360;
  return v < 0 ? v + 360 : v;
}

function isAngleOnArc(
  angleDeg: number,
  startDeg: number,
  endDeg: number,
  direction: "clockwise" | "counterclockwise",
): boolean {
  const a = normalizeAngle(angleDeg);
  const s = normalizeAngle(startDeg);
  const e = normalizeAngle(endDeg);

  if (direction === "counterclockwise") {
    const span = (e - s + 360) % 360 || 360;
    const delta = (a - s + 360) % 360;
    return delta <= span + 1e-4;
  } else {
    const span = (s - e + 360) % 360 || 360;
    const delta = (s - a + 360) % 360;
    return delta <= span + 1e-4;
  }
}

function pointAngleDeg(center: Point2D, point: Point2D): number {
  return normalizeAngle((Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI);
}

// ─── Arc ↔ Linear intersection ──────────────────────────────────────────────

function intersectLineArc(
  linear: GeometryObject,
  arc: ArcObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const arcGeom = getArcGeometry(arc, objects);
  if (!arcGeom) return [];

  // Build a temporary circle object to reuse intersectLineCircle
  const tempCircle: CircleObject = {
    id: arc.id + ":temp-circle",
    type: "circle",
    circleKind: "center-radius",
    centerPointId: arc.centerPointId,
    radius: arcGeom.radius,
    dependencies: [],
    dependents: [],
    name: "",
    style: arc.style,
    visible: true,
    locked: false,
    createdAt: 0,
    updatedAt: 0,
  };

  const circlePoints = intersectLineCircle(linear as LineObject, tempCircle, objects);

  // Filter to points that lie on the arc's angular domain
  return circlePoints.filter((pt) => {
    const angle = pointAngleDeg(arcGeom.center, pt);
    return isAngleOnArc(angle, arcGeom.startAngleDegrees, arcGeom.endAngleDegrees, arc.direction);
  });
}

// ─── Arc ↔ Circle intersection ──────────────────────────────────────────────

function intersectArcCircle(
  arc: ArcObject,
  circle: CircleObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const arcGeom = getArcGeometry(arc, objects);
  if (!arcGeom) return [];

  const tempCircle: CircleObject = {
    id: arc.id + ":temp-circle",
    type: "circle",
    circleKind: "center-radius",
    centerPointId: arc.centerPointId,
    radius: arcGeom.radius,
    dependencies: [],
    dependents: [],
    name: "",
    style: arc.style,
    visible: true,
    locked: false,
    createdAt: 0,
    updatedAt: 0,
  };

  const circlePoints = intersectCircles(tempCircle, circle, objects);

  return circlePoints.filter((pt) => {
    const angle = pointAngleDeg(arcGeom.center, pt);
    return isAngleOnArc(angle, arcGeom.startAngleDegrees, arcGeom.endAngleDegrees, arc.direction);
  });
}

// ─── Arc ↔ Arc intersection ─────────────────────────────────────────────────

function intersectArcArc(
  firstArc: ArcObject,
  secondArc: ArcObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const firstGeom = getArcGeometry(firstArc, objects);
  const secondGeom = getArcGeometry(secondArc, objects);
  if (!firstGeom || !secondGeom) return [];

  const tempCircle1: CircleObject = {
    id: firstArc.id + ":temp-circle",
    type: "circle",
    circleKind: "center-radius",
    centerPointId: firstArc.centerPointId,
    radius: firstGeom.radius,
    dependencies: [],
    dependents: [],
    name: "",
    style: firstArc.style,
    visible: true,
    locked: false,
    createdAt: 0,
    updatedAt: 0,
  };

  const tempCircle2: CircleObject = {
    id: secondArc.id + ":temp-circle",
    type: "circle",
    circleKind: "center-radius",
    centerPointId: secondArc.centerPointId,
    radius: secondGeom.radius,
    dependencies: [],
    dependents: [],
    name: "",
    style: secondArc.style,
    visible: true,
    locked: false,
    createdAt: 0,
    updatedAt: 0,
  };

  const circlePoints = intersectCircles(tempCircle1, tempCircle2, objects);

  return circlePoints.filter((pt) => {
    const angle1 = pointAngleDeg(firstGeom.center, pt);
    const angle2 = pointAngleDeg(secondGeom.center, pt);
    return (
      isAngleOnArc(angle1, firstGeom.startAngleDegrees, firstGeom.endAngleDegrees, firstArc.direction) &&
      isAngleOnArc(angle2, secondGeom.startAngleDegrees, secondGeom.endAngleDegrees, secondArc.direction)
    );
  });
}

// ─── Linear ↔ Ellipse intersection ─────────────────────────────────────────

function intersectLineEllipse(
  linear: GeometryObject,
  ellipse: EllipseObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const linePoints = getLinearPoints(linear as LinearObject, objects);
  const geom = getEllipseGeometry(ellipse, objects);
  if (!linePoints || !geom) return [];

  const { center, rx, ry, angleDegrees } = geom;
  const theta = (angleDegrees * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  // Transform line endpoints into ellipse-local coordinates (unrotated, centered at origin)
  function toLocal(p: Point2D): Point2D {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: dx * cosT + dy * sinT,
      y: -dx * sinT + dy * cosT,
    };
  }

  function toWorld(p: Point2D): Point2D {
    return {
      x: center.x + p.x * cosT - p.y * sinT,
      y: center.y + p.x * sinT + p.y * cosT,
    };
  }

  const lp0 = toLocal(linePoints[0]);
  const lp1 = toLocal(linePoints[1]);
  const dx = lp1.x - lp0.x;
  const dy = lp1.y - lp0.y;

  // Parametric line: P(t) = lp0 + t*(lp1-lp0)
  // Ellipse equation: (x/rx)^2 + (y/ry)^2 = 1
  // Substituting: A*t^2 + B*t + C = 0
  const A = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  const B = 2 * ((lp0.x * dx) / (rx * rx) + (lp0.y * dy) / (ry * ry));
  const C = (lp0.x * lp0.x) / (rx * rx) + (lp0.y * lp0.y) / (ry * ry) - 1;

  const discriminant = B * B - 4 * A * C;
  if (A <= EPSILON || discriminant < -EPSILON) return [];

  const results: Point2D[] = [];
  const sqrt = Math.sqrt(Math.max(0, discriminant));
  const t1 = (-B - sqrt) / (2 * A);
  const t2 = (-B + sqrt) / (2 * A);

  for (const t of [t1, t2]) {
    // Check domain constraints for segment/ray
    if (linear.type === "segment" && (t < -EPSILON || t > 1 + EPSILON)) continue;
    if (linear.type === "ray" && t < -EPSILON) continue;

    const localPt = { x: lp0.x + t * dx, y: lp0.y + t * dy };
    results.push(toWorld(localPt));
  }

  // Deduplicate very close points
  return results.filter((pt, i, arr) =>
    arr.findIndex((other) => distance(other, pt) <= EPSILON) === i,
  );
}

// ─── Generic discretization-based intersection ──────────────────────────────

function discretizeObject(
  object: GeometryObject,
  objects: GeometryObjectRecord,
): PolylineSegment[] | null {
  if (object.type === "ellipse") {
    return discretizeEllipseObject(object as EllipseObject, objects);
  }
  if (object.type === "elliptical-arc") {
    return discretizeEllipticalArcObject(object as EllipticalArcObject, objects);
  }
  if (object.type === "arc") {
    // Discretize arc into segments for generic fallback
    const arcGeom = getArcGeometry(object as ArcObject, objects);
    if (!arcGeom) return null;
    const steps = 36;
    const startRad = (arcGeom.startAngleDegrees * Math.PI) / 180;
    const endRad = (arcGeom.endAngleDegrees * Math.PI) / 180;
    const dir = (object as ArcObject).direction;
    let delta = dir === "counterclockwise"
      ? ((endRad - startRad + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI)
      : -((startRad - endRad + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI);
    const segs: PolylineSegment[] = [];
    let prev = {
      x: arcGeom.center.x + arcGeom.radius * Math.cos(startRad),
      y: arcGeom.center.y + arcGeom.radius * Math.sin(startRad),
    };
    for (let i = 1; i <= steps; i++) {
      const angle = startRad + (delta * i) / steps;
      const curr = {
        x: arcGeom.center.x + arcGeom.radius * Math.cos(angle),
        y: arcGeom.center.y + arcGeom.radius * Math.sin(angle),
      };
      segs.push({ start: prev, end: curr });
      prev = curr;
    }
    return segs;
  }
  if (object.type === "circle") {
    const circGeom = getCircleGeometry(object as CircleObject, objects);
    if (!circGeom) return null;
    const steps = 72;
    const segs: PolylineSegment[] = [];
    let prev = {
      x: circGeom.center.x + circGeom.radius,
      y: circGeom.center.y,
    };
    for (let i = 1; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      const curr = {
        x: circGeom.center.x + circGeom.radius * Math.cos(angle),
        y: circGeom.center.y + circGeom.radius * Math.sin(angle),
      };
      segs.push({ start: prev, end: curr });
      prev = curr;
    }
    return segs;
  }
  // For linear objects, create a single segment
  const linPts = getLinearPoints(object as LinearObject, objects);
  if (!linPts) return null;
  return [{ start: linPts[0], end: linPts[1] }];
}

function segmentSegmentIntersection(
  a1: Point2D, a2: Point2D,
  b1: Point2D, b2: Point2D,
): Point2D | null {
  const result = lineLineIntersection(a1, a2, b1, b2);
  if (!result) return null;
  if (result.t < -EPSILON || result.t > 1 + EPSILON) return null;
  if (result.u < -EPSILON || result.u > 1 + EPSILON) return null;
  return result.point;
}

function intersectByDiscretization(
  first: GeometryObject,
  second: GeometryObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const segsA = discretizeObject(first, objects);
  const segsB = discretizeObject(second, objects);
  if (!segsA || !segsB) return [];

  const results: Point2D[] = [];

  for (const sa of segsA) {
    for (const sb of segsB) {
      const pt = segmentSegmentIntersection(sa.start, sa.end, sb.start, sb.end);
      if (pt) {
        // Deduplicate: skip if too close to existing result
        if (!results.some((existing) => distance(existing, pt) < 0.01)) {
          results.push(pt);
        }
      }
    }
  }

  return results.sort((a, b) => a.x - b.x || a.y - b.y);
}

// ─── Main dispatch ──────────────────────────────────────────────────────────

export function getIntersectionPoints(
  first: GeometryObject,
  second: GeometryObject,
  objects: GeometryObjectRecord,
): readonly Point2D[] {
  const linearTypes = ["line", "segment", "ray"];
  const circularTypes = ["circle", "arc"];
  const conicTypes = ["ellipse", "elliptical-arc"];

  // Linear ↔ Linear
  if (linearTypes.includes(first.type) && linearTypes.includes(second.type)) {
    return intersectLinearObjects(first as LinearObject, second as LinearObject, objects);
  }

  // Linear ↔ Circle
  if (linearTypes.includes(first.type) && second.type === "circle") {
    return intersectLineCircle(first as LineObject, second as CircleObject, objects);
  }
  if (first.type === "circle" && linearTypes.includes(second.type)) {
    return intersectLineCircle(second as LineObject, first as CircleObject, objects);
  }

  // Circle ↔ Circle
  if (first.type === "circle" && second.type === "circle") {
    return intersectCircles(first as CircleObject, second as CircleObject, objects);
  }

  // Linear ↔ Arc
  if (linearTypes.includes(first.type) && second.type === "arc") {
    return intersectLineArc(first, second as ArcObject, objects);
  }
  if (first.type === "arc" && linearTypes.includes(second.type)) {
    return intersectLineArc(second, first as ArcObject, objects);
  }

  // Arc ↔ Circle
  if (first.type === "arc" && second.type === "circle") {
    return intersectArcCircle(first as ArcObject, second as CircleObject, objects);
  }
  if (first.type === "circle" && second.type === "arc") {
    return intersectArcCircle(second as ArcObject, first as CircleObject, objects);
  }

  // Arc ↔ Arc
  if (first.type === "arc" && second.type === "arc") {
    return intersectArcArc(first as ArcObject, second as ArcObject, objects);
  }

  // Linear ↔ Ellipse (analytical)
  if (linearTypes.includes(first.type) && second.type === "ellipse") {
    return intersectLineEllipse(first, second as EllipseObject, objects);
  }
  if (first.type === "ellipse" && linearTypes.includes(second.type)) {
    return intersectLineEllipse(second, first as EllipseObject, objects);
  }

  // All remaining combinations involving conics, arcs, circles, ellipses, elliptical-arcs:
  // Use discretization-based generic intersection
  const supportedTypes = [...linearTypes, ...circularTypes, ...conicTypes];
  if (supportedTypes.includes(first.type) && supportedTypes.includes(second.type)) {
    return intersectByDiscretization(first, second, objects);
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

  if (construction.type === "line-projection-point") {
    const point = getPoint(objects, construction.pointId);
    const line = objects[construction.lineId];
    if (!point || !line) return null;
    const linePoints = getLinearPoints(line as import("../types").LineObject, objects);
    if (!linePoints) return null;
    return projectPointToLine(point, linePoints[0], linePoints[1]);
  }

  if (construction.type === "perpendicular-intersection-point") {
    const point = getPoint(objects, construction.pointId);
    const parentLine = objects[construction.parentLineId];
    const targetLine = objects[construction.targetLineId];
    if (!point || !parentLine || !targetLine) return null;
    const parentPoints = getLinearPoints(parentLine as import("../types").LineObject, objects);
    const targetPoints = getLinearPoints(targetLine as import("../types").LineObject, objects);
    if (!parentPoints || !targetPoints) return null;
    
    const u = vectorFromPoints(parentPoints[0], parentPoints[1]);
    const perp = perpendicular(u);
    const intersection = lineLineIntersection(
      point,
      { x: point.x + perp.x, y: point.y + perp.y },
      targetPoints[0],
      targetPoints[1]
    );
    return intersection ? intersection.point : null;
  }

  if (construction.type === "inradius-point") {
    const center = getPoint(objects, construction.centerPointId);
    const sidePointA = getPoint(objects, construction.sidePointAId);
    const sidePointB = getPoint(objects, construction.sidePointBId);

    return center && sidePointA && sidePointB
      ? projectPointToLine(center, sidePointA, sidePointB)
      : null;
  }

  if (construction.type === "angle-given-size-point") {
    const vertex = getPoint(objects, construction.vertexPointId);
    const anchor = getPoint(objects, construction.anchorPointId);

    if (!vertex || !anchor) {
      return null;
    }

    const dx = anchor.x - vertex.x;
    const dy = anchor.y - vertex.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r < EPSILON) return null;

    const alpha = Math.atan2(dy, dx);
    const thetaRad = (construction.angleDeg * Math.PI) / 180;
    const newAngle = construction.direction === "ccw" ? alpha - thetaRad : alpha + thetaRad;

    return {
      x: vertex.x + r * Math.cos(newAngle),
      y: vertex.y + r * Math.sin(newAngle),
    };
  }

  if (construction.type === "point-by-distance") {
    const startPoint = getPoint(objects, construction.fromPointId);
    const targetPoint = getPoint(objects, construction.toPointId);

    if (!startPoint || !targetPoint) return null;

    const dx = targetPoint.x - startPoint.x;
    const dy = targetPoint.y - startPoint.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    
    if (r < EPSILON) return null;

    const ratio = construction.distance / r;

    return {
      x: startPoint.x + dx * ratio,
      y: startPoint.y + dy * ratio,
    };
  }

  const pointId = "pointId" in construction ? construction.pointId : undefined;
  const point = pointId ? getPoint(objects, pointId) : null;
  const lineId = "lineId" in construction ? construction.lineId : undefined;
  const line = lineId ? objects[lineId] : undefined;

  if (!point || (line?.type !== "line" && line?.type !== "segment" && line?.type !== "ray")) {
    return null;
  }

  const linePoints = getLinearPoints(line as LinearObject, objects);

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

  if (construction.type === "reflect-line-point") {
    const point = getPoint(objects, construction.pointId);
    const line = objects[construction.lineId];

    if (!point || (line?.type !== "line" && line?.type !== "segment" && line?.type !== "ray")) {
      return null;
    }

    const linePoints = getLinearPoints(line as LinearObject, objects);

    if (!linePoints) {
      return null;
    }

    const projection = projectPointToLine(point, linePoints[0], linePoints[1]);

    if (!projection) {
      return null;
    }

    return {
      x: point.x + 2 * (projection.x - point.x),
      y: point.y + 2 * (projection.y - point.y),
    };
  }

  if (construction.type === "reflect-point-point") {
    const point = getPoint(objects, construction.pointId);
    const center = getPoint(objects, construction.centerPointId);

    if (!point || !center) {
      return null;
    }

    return {
      x: 2 * center.x - point.x,
      y: 2 * center.y - point.y,
    };
  }

  if (construction.type === "rotate-point") {
    const point = getPoint(objects, construction.pointId);
    const center = getPoint(objects, construction.centerPointId);

    if (!point || !center) {
      return null;
    }

    let angleDegrees = resolveVariable(objects, construction.angle, 0);

    const rad = (angleDegrees * Math.PI) / 180;
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: center.y + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }

  if (construction.type === "translate-vector-point") {
    const point = getPoint(objects, construction.pointId);
    const vector = objects[construction.vectorId];

    if (!point || vector?.type !== "vector") {
      return null;
    }

    const start = getPoint(objects, vector.startPointId);
    const end = getPoint(objects, vector.endPointId);

    if (!start || !end) {
      return null;
    }

    return {
      x: point.x + (end.x - start.x),
      y: point.y + (end.y - start.y),
    };
  }

  if (construction.type === "dilate-point") {
    const point = getPoint(objects, construction.pointId);
    const center = getPoint(objects, construction.centerPointId);

    if (!point || !center) {
      return null;
    }

    let factor = resolveVariable(objects, construction.factor, 1);

    return {
      x: center.x + factor * (point.x - center.x),
      y: center.y + factor * (point.y - center.y),
    };
  }

  if (construction.type === "special-line-projection") {
    const vertex = getPoint(objects, construction.vertexId);
    const segment = objects[construction.segmentId];
    if (!vertex || segment?.type !== "segment") return null;
    
    const b = getPoint(objects, segment.startPointId);
    const c = getPoint(objects, segment.endPointId);
    if (!b || !c) return null;
    
    const u = vectorFromPoints(b, c);
    const v = vectorFromPoints(b, vertex);
    const uLenSq = u.x * u.x + u.y * u.y;
    
    if (uLenSq <= EPSILON) return null;
    
    const scalar = dot(v, u) / uLenSq;
    return {
      x: b.x + scalar * u.x,
      y: b.y + scalar * u.y,
    };
  }

  if (construction.type === "special-line-midpoint") {
    const segment = objects[construction.segmentId];
    if (segment?.type !== "segment") return null;
    
    const b = getPoint(objects, segment.startPointId);
    const c = getPoint(objects, segment.endPointId);
    if (!b || !c) return null;
    
    return midpoint(b, c);
  }

  if (construction.type === "special-line-bisector") {
    const vertex = getPoint(objects, construction.vertexId);
    const segment = objects[construction.segmentId];
    if (!vertex || segment?.type !== "segment") return null;
    
    const b = getPoint(objects, segment.startPointId);
    const c = getPoint(objects, segment.endPointId);
    if (!b || !c) return null;
    
    const dAB = distance(vertex, b);
    const dAC = distance(vertex, c);
    const sum = dAB + dAC;
    
    if (sum <= EPSILON) return null;
    
    return {
      x: (dAC * b.x + dAB * c.x) / sum,
      y: (dAC * b.y + dAB * c.y) / sum,
    };
  }

  if (construction.type === "angle-bisector-endpoint") {
    const a = getPoint(objects, construction.pointAId);
    const b = getPoint(objects, construction.pointBId);
    const c = getPoint(objects, construction.pointCId);
    const limitObj = objects[construction.limitObjectId];
    if (!a || !b || !c || !limitObj) return null;

    const u = normalize(vectorFromPoints(b, a));
    const v = normalize(vectorFromPoints(b, c));
    let w = normalize({ x: u.x + v.x, y: u.y + v.y });
    // if a, b, c are collinear, w could be 0,0, fallback to normal of u
    if (Math.abs(w.x) < EPSILON && Math.abs(w.y) < EPSILON) {
      w = { x: -u.y, y: u.x };
    }

    if (limitObj.type === "point") {
      const dist = distance(b, limitObj as PointObject);
      return { x: b.x + w.x * dist, y: b.y + w.y * dist };
    } else if (limitObj.type === "segment") {
      const e1 = getPoint(objects, limitObj.startPointId);
      const e2 = getPoint(objects, limitObj.endPointId);
      if (e1 && e2) {
        const intersection = lineLineIntersection(b, { x: b.x + w.x, y: b.y + w.y }, e1, e2);
        if (intersection) {
          return intersection.point;
        }
        // Fallback: parallel
        const mid = midpoint(e1, e2);
        const dist = distance(b, mid);
        return { x: b.x + w.x * dist, y: b.y + w.y * dist };
      }
    }
    return null;
  }

  if (construction.type === "perpendicular-bisector-endpoint") {
    const a = getPoint(objects, construction.pointAId);
    const b = getPoint(objects, construction.pointBId);
    const limitObj = objects[construction.limitObjectId];
    if (!a || !b || !limitObj) return null;

    const m = midpoint(a, b);
    const dir = vectorFromPoints(m, b);
    let perp = normalize({ x: -dir.y, y: dir.x });
    
    if (limitObj.type === "point") {
      // Legacy fallback: project onto bisector ray
      const toP = vectorFromPoints(m, limitObj as PointObject);
      const projDist = dot(perp, toP);
      if (projDist < 0) perp = { x: -perp.x, y: -perp.y };
      return { x: m.x + perp.x * Math.abs(projDist), y: m.y + perp.y * Math.abs(projDist) };
    }

    // Segment / Line / Ray: compute intersection with infinite line through endpoints
    let e1: PointObject | null = null;
    let e2: PointObject | null = null;
    if (limitObj.type === "segment") {
      e1 = getPoint(objects, (limitObj as any).startPointId);
      e2 = getPoint(objects, (limitObj as any).endPointId);
    } else if (limitObj.type === "line" || limitObj.type === "ray") {
      e1 = getPoint(objects, (limitObj as any).pointAId);
      e2 = getPoint(objects, (limitObj as any).pointBId ?? (limitObj as any).throughPointId);
    }

    if (e1 && e2) {
      const toMidE = vectorFromPoints(m, midpoint(e1, e2));
      if (dot(perp, toMidE) < 0) perp = { x: -perp.x, y: -perp.y };
      const intersection = lineLineIntersection(m, { x: m.x + perp.x, y: m.y + perp.y }, e1, e2);
      if (intersection) return intersection.point;
      // Parallel fallback
      const dist = distance(m, midpoint(e1, e2));
      return { x: m.x + perp.x * dist, y: m.y + perp.y * dist };
    }
    return null;
  }

  return pointsAlmostEqual(point, candidate) ? null : candidate;
}

export function evaluatePointOnPath(
  object: GeometryObject,
  t: number,
  objects: GeometryObjectRecord,
): Point2D | null {
  if (
    object.type === "segment" ||
    object.type === "line" ||
    object.type === "ray"
  ) {
    const points = getLinearPoints(object as LinearObject, objects);
    if (!points) return null;
    const [pA, pB] = points;
    return { x: pA.x + t * (pB.x - pA.x), y: pA.y + t * (pB.y - pA.y) };
  }
  
  if (object.type === "vector") {
    const pA = getPoint(objects, object.startPointId);
    const pB = getPoint(objects, object.endPointId);
    if (!pA || !pB) return null;
    return { x: pA.x + t * (pB.x - pA.x), y: pA.y + t * (pB.y - pA.y) };
  }

  if (object.type === "circle") {
    const data = getCircleGeometry(object as any, objects);
    if (!data) return null;
    // t is usually in radians [0, 2pi]. Let's assume t is radians.
    // If users use degrees, they can do so by binding to a slider ranging [0, 360] and multiplying by Math.PI/180?
    // Wait, let's treat t as radians directly.
    return {
      x: data.center.x + data.radius * Math.cos(t),
      y: data.center.y + data.radius * Math.sin(t),
    };
  }

  if (object.type === "arc") {
    // For Arc, it's a circle from startAngle to endAngle. t could be from 0 to 1 mapping the arc length,
    // or t could be the angle. Let's just use t as angle for now.
    const center = getPoint(objects, object.centerPointId);
    const startPoint = getPoint(objects, object.startPointId);
    if (!center || !startPoint) return null;
    const r = distance(center, startPoint);
    return {
      x: center.x + r * Math.cos(t),
      y: center.y + r * Math.sin(t),
    };
  }

  if (object.type === "ellipse") {
    const fA = getPoint(objects, object.focusAId);
    const fB = getPoint(objects, object.focusBId);
    if (!fA || !fB) return null;
    const center = midpoint(fA, fB);
    const c = distance(fA, center);
    
    // We need 'a'. Usually it's derived from pointOnEllipseId
    const pOnCurve = getPoint(objects, object.pointOnEllipseId);
    if (!pOnCurve) return null;
    const a = (distance(fA, pOnCurve) + distance(fB, pOnCurve)) / 2;
    
    if (a <= c) return null;
    const b = Math.sqrt(a * a - c * c);
    const angle = Math.atan2(fB.y - fA.y, fB.x - fA.x);
    
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    
    // Parametric equation of ellipse rotated by angle
    const localX = a * cosT;
    const localY = b * sinT;
    
    return {
      x: center.x + localX * Math.cos(angle) - localY * Math.sin(angle),
      y: center.y + localX * Math.sin(angle) + localY * Math.cos(angle),
    };
  }

  if (object.type === "polygon") {
    // Basic mapping: integer part of t is the edge index, fractional part is the position on the edge.
    if (object.pointIds.length < 2) return null;
    const n = object.pointIds.length;
    // Normalize t to [0, n] for mapping around the perimeter
    const modT = ((t % n) + n) % n; 
    const edgeIndex = Math.floor(modT);
    const frac = modT - edgeIndex;
    
    const v1Id = object.pointIds[edgeIndex];
    const v2Id = object.pointIds[(edgeIndex + 1) % n];
    if (!v1Id || !v2Id) return null;
    const p1 = getPoint(objects, v1Id);
    const p2 = getPoint(objects, v2Id);
    if (!p1 || !p2) return null;
    
    return {
      x: p1.x + frac * (p2.x - p1.x),
      y: p1.y + frac * (p2.y - p1.y),
    };
  }

  // Not supported or not implemented path
  return null;
}
