import type { Point2D, Vector2D } from "./types";

export const EPSILON = 1e-9;

export function almostEqual(a: number, b: number, eps = EPSILON): boolean {
  return Math.abs(a - b) <= eps;
}

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

export function cleanNumber(value: number, precision = 6): number {
  const rounded = Number(value.toFixed(precision));

  return Object.is(rounded, -0) ? 0 : rounded;
}

export function pointsAlmostEqual(
  a: Point2D,
  b: Point2D,
  eps = EPSILON,
): boolean {
  return almostEqual(a.x, b.x, eps) && almostEqual(a.y, b.y, eps);
}

export function distance(a: Point2D, b: Point2D): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function distanceSquared(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return dx * dx + dy * dy;
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

export function vectorFromPoints(a: Point2D, b: Point2D): Vector2D {
  return {
    x: b.x - a.x,
    y: b.y - a.y,
  };
}

export function dot(a: Vector2D, b: Vector2D): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vector2D, b: Vector2D): number {
  return a.x * b.y - a.y * b.x;
}

export function vectorLength(vector: Vector2D): number {
  return Math.hypot(vector.x, vector.y);
}

export function normalize(vector: Vector2D): Vector2D {
  const length = vectorLength(vector);

  if (length < EPSILON) {
    return { x: 0, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}

export function perpendicular(vector: Vector2D): Vector2D {
  return {
    x: -vector.y,
    y: vector.x,
  };
}

export function addVectors(a: Vector2D, b: Vector2D): Vector2D {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function scaleVector(vector: Vector2D, scalar: number): Vector2D {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
}

export function polygonArea(points: readonly Point2D[]): number {
  let sum = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    if (!current || !next) {
      continue;
    }

    sum += current.x * next.y - next.x * current.y;
  }

  return sum / 2;
}

export function angleRadians(pointA: Point2D, vertex: Point2D, pointC: Point2D): number {
  const vectorA = vectorFromPoints(vertex, pointA);
  const vectorC = vectorFromPoints(vertex, pointC);
  const unsigned = Math.atan2(Math.abs(cross(vectorA, vectorC)), dot(vectorA, vectorC));

  return unsigned < 0 ? unsigned + Math.PI * 2 : unsigned;
}

export function angleDegrees(pointA: Point2D, vertex: Point2D, pointC: Point2D): number {
  return (angleRadians(pointA, vertex, pointC) * 180) / Math.PI;
}

export function isRightAngle(
  pointA: Point2D,
  vertex: Point2D,
  pointC: Point2D,
  toleranceDegrees = 1,
): boolean {
  return Math.abs(angleDegrees(pointA, vertex, pointC) - 90) <= toleranceDegrees;
}
