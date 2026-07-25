import { getEllipseGeometry, type EllipseGeometry } from "./conicGeometry";
import { getHyperbolaGeometry, type HyperbolaGeometry } from "./conicGeometry";
import { evaluateLagrange } from "./polynomialGeometry";
import { getPointObject } from "./derivedGeometry";
import type {
  EllipseObject,
  GeometryObjectRecord,
  HyperbolaObject,
  Point2D,
  PolynomialObject,
} from "./types";

export type PolylineSegment = {
  readonly start: Point2D;
  readonly end: Point2D;
};

// ─── Ellipse Discretization ─────────────────────────────────────────────────

const ELLIPSE_STEPS = 72; // 5° per step

/**
 * Discretize an ellipse into a closed polyline of linear segments.
 * Each segment subtends ~5° of arc.
 */
export function discretizeEllipse(
  geom: EllipseGeometry,
  steps: number = ELLIPSE_STEPS,
): PolylineSegment[] {
  const { center, rx, ry, angleDegrees } = geom;
  const theta = (angleDegrees * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const segments: PolylineSegment[] = [];

  function ellipsePoint(t: number): Point2D {
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    return {
      x: center.x + ex * cosT - ey * sinT,
      y: center.y + ex * sinT + ey * cosT,
    };
  }

  let prev = ellipsePoint(0);
  for (let i = 1; i <= steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const curr = ellipsePoint(t);
    segments.push({ start: prev, end: curr });
    prev = curr;
  }

  return segments;
}

/**
 * Discretize an EllipseObject from the scene.
 */
export function discretizeEllipseObject(
  object: EllipseObject,
  objects: GeometryObjectRecord,
  steps?: number,
): PolylineSegment[] | null {
  const geom = getEllipseGeometry(object, objects);
  if (!geom) return null;
  return discretizeEllipse(geom, steps);
}

// ─── Hyperbola Discretization ───────────────────────────────────────────────

const HYPERBOLA_STEPS = 120;

/**
 * Discretize a hyperbola into two branches, each a polyline of linear segments.
 * Returns a flat array containing both branches.
 */
export function discretizeHyperbola(
  geom: HyperbolaGeometry,
  steps: number = HYPERBOLA_STEPS,
): PolylineSegment[] {
  const { center, a, b, angleDegrees, tRange } = geom;
  const theta = (angleDegrees * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const segments: PolylineSegment[] = [];

  function hyperbolaPoint(t: number, branch: 1 | -1): Point2D {
    const hx = branch * a * Math.cosh(t);
    const hy = b * Math.sinh(t);
    return {
      x: center.x + hx * cosT - hy * sinT,
      y: center.y + hx * sinT + hy * cosT,
    };
  }

  // Branch 1 (right)
  let prev = hyperbolaPoint(-tRange, 1);
  for (let i = 1; i <= steps; i++) {
    const t = -tRange + (2 * tRange * i) / steps;
    const curr = hyperbolaPoint(t, 1);
    segments.push({ start: prev, end: curr });
    prev = curr;
  }

  // Branch 2 (left)
  prev = hyperbolaPoint(-tRange, -1);
  for (let i = 1; i <= steps; i++) {
    const t = -tRange + (2 * tRange * i) / steps;
    const curr = hyperbolaPoint(t, -1);
    segments.push({ start: prev, end: curr });
    prev = curr;
  }

  return segments;
}

/**
 * Discretize a HyperbolaObject from the scene.
 */
export function discretizeHyperbolaObject(
  object: HyperbolaObject,
  objects: GeometryObjectRecord,
  steps?: number,
): PolylineSegment[] | null {
  const geom = getHyperbolaGeometry(object, objects);
  if (!geom) return null;
  return discretizeHyperbola(geom, steps);
}

// ─── Polynomial Discretization ──────────────────────────────────────────────

const POLYNOMIAL_STEPS = 200;

/**
 * Discretize a Lagrange interpolation polynomial into a polyline.
 * Only generates segments within the x-range of the defining points.
 */
export function discretizePolynomial(
  points: readonly Point2D[],
  steps: number = POLYNOMIAL_STEPS,
): PolylineSegment[] {
  if (points.length < 2) return [];

  const ptsX = points.map((p, i) => ({ x: i, y: p.x }));
  const ptsY = points.map((p, i) => ({ x: i, y: p.y }));

  const segments: PolylineSegment[] = [];
  const maxT = points.length - 1;
  const step = maxT / steps;

  let prevValid = false;
  let prev: Point2D = { x: 0, y: 0 };

  for (let i = 0; i <= steps; i++) {
    const t = i * step;
    const x = evaluateLagrange(t, ptsX);
    const y = evaluateLagrange(t, ptsY);

    if (Number.isNaN(x) || Number.isNaN(y) || !isFinite(x) || !isFinite(y)) {
      prevValid = false;
      continue;
    }

    const curr: Point2D = { x, y };
    if (prevValid) {
      segments.push({ start: prev, end: curr });
    }
    prev = curr;
    prevValid = true;
  }

  return segments;
}

/**
 * Discretize a PolynomialObject from the scene.
 */
export function discretizePolynomialObject(
  object: PolynomialObject,
  objects: GeometryObjectRecord,
  steps?: number,
): PolylineSegment[] | null {
  const pts = object.pointIds
    .map((id) => getPointObject(objects, id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (pts.length < 2) return null;
  return discretizePolynomial(pts, steps);
}
