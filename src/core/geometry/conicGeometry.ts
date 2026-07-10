import { distance, midpoint } from "./math";
import type { Point2D, GeometryObjectRecord, EllipseObject, HyperbolaObject } from "./types";
import { getPointObject } from "./derivedGeometry";

export type EllipseGeometry = {
  readonly center: Point2D;
  readonly rx: number;
  readonly ry: number;
  readonly angleDegrees: number;
};

export type HyperbolaGeometry = {
  readonly center: Point2D;
  readonly a: number;
  readonly b: number;
  readonly angleDegrees: number;
  readonly tRange: number;
};


export function getEllipseGeometry(
  object: EllipseObject,
  objects: GeometryObjectRecord,
): EllipseGeometry | null {
  const focusA = getPointObject(objects, object.focusAId);
  const focusB = getPointObject(objects, object.focusBId);
  const pointOnEllipse = getPointObject(objects, object.pointOnEllipseId);

  if (!focusA || !focusB || !pointOnEllipse) {
    return null;
  }

  const c = distance(focusA, focusB) / 2;
  const a = (distance(pointOnEllipse, focusA) + distance(pointOnEllipse, focusB)) / 2;
  
  if (a <= c) {
    return null; // Invalid ellipse
  }

  const b = Math.sqrt(a * a - c * c);
  const center = midpoint(focusA, focusB);
  
  const dx = focusB.x - focusA.x;
  const dy = focusB.y - focusA.y;
  let angleDegrees = Math.atan2(dy, dx) * 180 / Math.PI;

  return { center, rx: a, ry: b, angleDegrees };
}

export function getHyperbolaGeometry(
  object: HyperbolaObject,
  objects: GeometryObjectRecord,
): HyperbolaGeometry | null {
  const focusA = getPointObject(objects, object.focusAId);
  const focusB = getPointObject(objects, object.focusBId);
  const pointOnHyperbola = getPointObject(objects, object.pointOnHyperbolaId);

  if (!focusA || !focusB || !pointOnHyperbola) {
    return null;
  }

  const c = distance(focusA, focusB) / 2;
  const a = Math.abs(distance(pointOnHyperbola, focusA) - distance(pointOnHyperbola, focusB)) / 2;
  
  if (a >= c || a === 0) {
    return null; // Invalid hyperbola
  }

  const b = Math.sqrt(c * c - a * a);
  const center = midpoint(focusA, focusB);
  
  const dx = focusB.x - focusA.x;
  const dy = focusB.y - focusA.y;
  const angleDegrees = Math.atan2(dy, dx) * 180 / Math.PI;
  const tRange = Math.acosh(Math.sqrt(9 + (b * b) / (c * c)));

  return { center, a, b, angleDegrees, tRange };
}

