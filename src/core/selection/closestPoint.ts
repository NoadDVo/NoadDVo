import type { GeometryObject, GeometryObjectRecord, Point2D } from "../geometry/types";
import { distanceSquared } from "../geometry/math";
import { getEllipseGeometry } from "../geometry/conicGeometry";
import { 
  getPointObject, 
  getPolygonPoints, 
  getArcGeometry, 
  getCircleGeometry, 
  getEllipticalArcGeometry 
} from "../geometry/derivedGeometry";
import {
  discretizeHyperbolaObject,
  discretizePolynomialObject,
  type PolylineSegment
} from "../geometry/curveDiscretization";
import { isAngleOnArc, normalizedAngleDegrees } from "./HitTest";

export function getClosestPointOnPolyline(point: Point2D, segments: PolylineSegment[]): Point2D | null {
  if (segments.length === 0) return null;
  let minSqDist = Number.POSITIVE_INFINITY;
  let closest: Point2D | null = null;
  
  for (const seg of segments) {
    const cp = projectPointOnSegment(point, seg.start, seg.end);
    const sqDist = distanceSquared(point, cp);
    if (sqDist < minSqDist) {
      minSqDist = sqDist;
      closest = cp;
    }
  }
  return closest;
}

export function projectPointOnInfiniteLine(point: Point2D, a: Point2D, b: Point2D): Point2D {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return { ...a };
  
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared;
  return {
    x: a.x + t * dx,
    y: a.y + t * dy,
  };
}

export function projectPointOnSegment(point: Point2D, start: Point2D, end: Point2D): Point2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return { ...start };
  
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
}

export function projectPointOnRay(point: Point2D, start: Point2D, through: Point2D): Point2D {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return { ...start };
  
  const t = Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared);
  return {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };
}

export function getClosestPointOnObject(
  object: GeometryObject,
  point: Point2D,
  objects: GeometryObjectRecord
): Point2D | null {
  if (object.type === "line") {
    const pA = getPointObject(objects, object.pointAId);
    const pB = getPointObject(objects, object.pointBId);
    if (pA && pB) return projectPointOnInfiniteLine(point, pA, pB);
  }
  
  if (object.type === "segment") {
    const pA = getPointObject(objects, object.startPointId);
    const pB = getPointObject(objects, object.endPointId);
    if (pA && pB) return projectPointOnSegment(point, pA, pB);
  }
  
  if (object.type === "ray") {
    const start = getPointObject(objects, object.startPointId);
    const through = getPointObject(objects, object.throughPointId);
    if (start && through) return projectPointOnRay(point, start, through);
  }
  
  if (object.type === "circle") {
    const geom = getCircleGeometry(object as any, objects);
    if (geom) {
      const dx = point.x - geom.center.x;
      const dy = point.y - geom.center.y;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { x: geom.center.x + geom.radius, y: geom.center.y };
      return {
        x: geom.center.x + (dx / dist) * geom.radius,
        y: geom.center.y + (dy / dist) * geom.radius,
      };
    }
  }
  
  if (object.type === "arc") {
    const geom = getArcGeometry(object as any, objects);
    if (geom) {
      const dx = point.x - geom.center.x;
      const dy = point.y - geom.center.y;
      const dist = Math.hypot(dx, dy);
      
      let pOnCircle: Point2D;
      if (dist === 0) {
        pOnCircle = geom.startPoint;
      } else {
        pOnCircle = {
          x: geom.center.x + (dx / dist) * geom.radius,
          y: geom.center.y + (dy / dist) * geom.radius,
        };
      }
      
      const angle = normalizedAngleDegrees(geom.center, pOnCircle);
      if (isAngleOnArc(angle, geom.startAngleDegrees, geom.endAngleDegrees, object.direction)) {
        return pOnCircle;
      }
      const dStart = distanceSquared(point, geom.startPoint);
      const dEnd = distanceSquared(point, geom.endPoint);
      return dStart < dEnd ? geom.startPoint : geom.endPoint;
    }
  }

  if (object.type === "ellipse" || object.type === "elliptical-arc") {
    let center: Point2D;
    let rx: number;
    let ry: number;
    
    let angleDegrees: number;
    
    if (object.type === "ellipse") {
      const geom = getEllipseGeometry(object as any, objects);
      if (!geom) return null;
      center = geom.center;
      rx = geom.rx;
      ry = geom.ry;
      angleDegrees = geom.angleDegrees;
    } else {
      const geom = getEllipticalArcGeometry(object as any, objects);
      if (!geom) return null;
      center = geom.center;
      rx = geom.rx;
      ry = geom.ry;
      angleDegrees = (geom.phi * 180) / Math.PI;
    }
    
    const angleRad = (angleDegrees * Math.PI) / 180;
    
    // 1. Translate to origin
    const dx0 = point.x - center.x;
    const dy0 = point.y - center.y;
    
    // 2. Rotate to axis-aligned space (rotate by +angleRad)
    const dx = dx0 * Math.cos(angleRad) + dy0 * Math.sin(angleRad);
    const dy = -dx0 * Math.sin(angleRad) + dy0 * Math.cos(angleRad);
    
    // 3. Eccentric anomaly approximation for closest point
    const theta = Math.atan2(dy * rx, dx * ry);
    const ex = rx * Math.cos(theta);
    const ey = ry * Math.sin(theta);
    
    // 4. Rotate back (rotate by +angleRad)
    const rxRot = ex * Math.cos(angleRad) - ey * Math.sin(angleRad);
    const ryRot = ex * Math.sin(angleRad) + ey * Math.cos(angleRad);
    
    let pOnBoundary = {
      x: center.x + rxRot,
      y: center.y + ryRot,
    };
    
    if (object.type === "elliptical-arc") {
      const geom = getEllipticalArcGeometry(object as any, objects);
      if (geom) {
        const ptrAngle = normalizedAngleDegrees(geom.center, pOnBoundary);
        if (!isAngleOnArc(ptrAngle, geom.startAngleDegrees, geom.endAngleDegrees, object.direction)) {
          const dStart = distanceSquared(point, geom.startPoint);
          const dEnd = distanceSquared(point, geom.endPoint);
          pOnBoundary = dStart < dEnd ? geom.startPoint : geom.endPoint;
        }
      }
    }
    
    return pOnBoundary;
  }
  
  if (object.type === "hyperbola") {
    const segments = discretizeHyperbolaObject(object as any, objects);
    return segments ? getClosestPointOnPolyline(point, segments) : null;
  }
  
  if (object.type === "polynomial") {
    const segments = discretizePolynomialObject(object as any, objects);
    return segments ? getClosestPointOnPolyline(point, segments) : null;
  }
  
  if (object.type === "polygon") {
    const pts = getPolygonPoints(object as any, objects);
    if (!pts || pts.length < 3) return null;
    let minSqDist = Number.POSITIVE_INFINITY;
    let closest: Point2D | null = null;
    
    for (let i = 0; i < pts.length; i++) {
      const start = pts[i] as Point2D;
      const end = pts[(i + 1) % pts.length] as Point2D;
      if (!start || !end) continue;
      const cp = projectPointOnSegment(point, start, end);
      const sqDist = distanceSquared(point, cp);
      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        closest = cp;
      }
    }
    return closest;
  }
  
  return null;
}
