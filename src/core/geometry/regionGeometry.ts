import { polygonArea } from "./math";

import {
  getCircleGeometry,
  getArcGeometry,
  getEllipticalArcGeometry,
  isPointInPolygon,
  getPointObject,
  getPolygonPoints,
} from "./derivedGeometry";
import { collectBoundaryPrimitives } from "./regions/BoundaryFillEngine";
import type {
  BoundaryEdge,
  CompoundRegionObject,
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  PointObject,
  RegionObject,
} from "./types";

export type ResolvedBoundaryPath =
  | {
      readonly kind: "polygon";
      readonly points: readonly PointObject[];
      readonly path: string;
    }
  | {
      readonly kind: "boundary";
      readonly path: string;
    };

function polar(center: Point2D, radius: number, degrees: number): Point2D {
  const radians = (degrees * Math.PI) / 180;

  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y + Math.sin(radians) * radius,
  };
}

function format(value: number): string {
  const rounded = Number(value.toFixed(6));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function moveTo(point: Point2D): string {
  return `M ${format(point.x)} ${format(point.y)}`;
}

function lineTo(point: Point2D): string {
  return `L ${format(point.x)} ${format(point.y)}`;
}

function edgeObject(edge: BoundaryEdge, objects: GeometryObjectRecord): GeometryObject | null {
  return objects[edge.objectId] ?? null;
}

function edgeStartEnd(
  edge: BoundaryEdge,
  objects: GeometryObjectRecord,
): readonly [Point2D, Point2D] | null {
  if (edge.startParameter !== undefined && edge.endParameter !== undefined) {
    const allPrimitives = collectBoundaryPrimitives(objects);
    const primitive = allPrimitives.find((candidate) =>
      edge.sourcePrimitiveId
        ? candidate.id === edge.sourcePrimitiveId
        : candidate.objectId === edge.objectId,
    );

    if (!primitive) {
      console.log('[EDGE_START_END] primitive NOT FOUND for edge:', {
        objectId: edge.objectId,
        sourcePrimitiveId: edge.sourcePrimitiveId,
        edgeKind: edge.edgeKind,
        availablePrimitiveIds: allPrimitives.map(p => p.id).slice(0, 20),
      });
    }

    if (primitive?.kind === "linear" && primitive.origin && primitive.vector) {
      const start = {
        x: primitive.origin.x + primitive.vector.x * edge.startParameter,
        y: primitive.origin.y + primitive.vector.y * edge.startParameter,
      };
      const end = {
        x: primitive.origin.x + primitive.vector.x * edge.endParameter,
        y: primitive.origin.y + primitive.vector.y * edge.endParameter,
      };

      return [start, end];
    }
  }

  const start = edge.startPointId ? getPointObject(objects, edge.startPointId) : null;
  const end = edge.endPointId ? getPointObject(objects, edge.endPointId) : null;

  if (start && end) {
    return edge.direction === "reverse" ? [end, start] : [start, end];
  }

  const object = edgeObject(edge, objects);

  if (object?.type === "segment" || object?.type === "vector") {
    const objectStart = getPointObject(objects, object.startPointId);
    const objectEnd = getPointObject(objects, object.endPointId);

    return objectStart && objectEnd
      ? edge.direction === "reverse" ? [objectEnd, objectStart] : [objectStart, objectEnd]
      : null;
  }

  return null;
}

function arcCommand(
  center: Point2D,
  radius: number,
  startDegrees: number,
  endDegrees: number,
  direction: "forward" | "reverse",
  physicalDirection: "clockwise" | "counterclockwise" = "counterclockwise",
): string {
  const start = polar(center, radius, startDegrees);
  const end = polar(center, radius, endDegrees);
  const rawDelta = direction === "reverse"
    ? (startDegrees - endDegrees + 360) % 360
    : (endDegrees - startDegrees + 360) % 360;
  const delta = rawDelta === 0 ? 360 : rawDelta;
  const largeArc = delta > 180 ? 1 : 0;
  // If the physical arc is clockwise, "forward" traversal is clockwise (sweep = 1).
  // If the physical arc is counter-clockwise, "forward" traversal is counter-clockwise (sweep = 0).
  const isPhysicalCw = physicalDirection === "clockwise";
  const sweep = direction === "reverse" ? (isPhysicalCw ? 0 : 1) : (isPhysicalCw ? 1 : 0);

  return `${moveTo(start)} A ${format(radius)} ${format(radius)} 0 ${largeArc} ${sweep} ${format(end.x)} ${format(end.y)}`;
}

function edgePath(edge: BoundaryEdge, objects: GeometryObjectRecord, first: boolean): string | null {
  const object = edgeObject(edge, objects);

  if (
    edge.edgeKind === "segment" ||
    edge.edgeKind === "polygon-edge" ||
    edge.edgeKind === "line" ||
    edge.edgeKind === "ray" ||
    edge.edgeKind === "ellipse" ||
    edge.edgeKind === "hyperbola" ||
    edge.edgeKind === "polynomial"
  ) {
    const endpoints = edgeStartEnd(edge, objects);

    if (!endpoints) {
      return null;
    }

    const [start, end] = endpoints;

    return `${first ? moveTo(start) : ""} ${lineTo(end)}`.trim();
  }

  if (edge.edgeKind === "circle" && object?.type === "circle") {
    const circle = getCircleGeometry(object, objects);

    if (!circle) {
      return null;
    }

    const start = edge.startParameter ?? 0;
    const end = edge.endParameter ?? 360;
    const firstArc = arcCommand(circle.center, circle.radius, start, start + 180, "forward");
    const secondArc = arcCommand(circle.center, circle.radius, start + 180, end, "forward")
      .replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");

    return `${firstArc} ${secondArc}`;
  }

  if (edge.edgeKind === "arc") {
    if (object?.type === "circle") {
      const circle = getCircleGeometry(object, objects);

      if (!circle || edge.startParameter === undefined || edge.endParameter === undefined) {
        return null;
      }

      const path = arcCommand(
        circle.center,
        circle.radius,
        edge.startParameter,
        edge.endParameter,
        edge.direction,
        "counterclockwise",
      );

      return first ? path : path.replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");
    }

    if (object?.type === "arc") {
      const geometry = getArcGeometry(object, objects);

      if (!geometry) {
        return null;
      }

      const startAngle = edge.startParameter ?? geometry.startAngleDegrees;
      const endAngle = edge.endParameter ?? geometry.endAngleDegrees;
      const path = arcCommand(
        geometry.center,
        geometry.radius,
        startAngle,
        endAngle,
        edge.direction,
        object.direction,
      );

      return first ? path : path.replace(/^M\s+[-0-9.]+\s+[-0-9.]+\s+/, "");
    }
  }

  if (edge.edgeKind === "elliptical-arc" && object?.type === "elliptical-arc") {
    const geom = getEllipticalArcGeometry(object, objects);

    if (!geom) {
      return null;
    }

    const { rx, ry, phi, thetaEnd, startPoint, endPoint } = geom;
    const thetaStart = 0; // start point is always at parametric angle 0 by definition (phi is axis rotation)

    const isReverse = edge.direction === "reverse";
    const fromPt = isReverse ? endPoint : startPoint;
    const toPt = isReverse ? startPoint : endPoint;
    const arcDirection = isReverse
      ? (object.direction === "clockwise" ? "counterclockwise" : "clockwise")
      : object.direction;

    // Delta in parametric angle space
    let delta = isReverse ? (thetaStart - thetaEnd) : (thetaEnd - thetaStart);
    if (arcDirection === "counterclockwise") {
      if (delta <= 0) delta += 2 * Math.PI;
    } else {
      if (delta >= 0) delta -= 2 * Math.PI;
    }
    const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
    // SVG: sweep=1 means clockwise in screen coords (Y-down)
    const sweep = arcDirection === "clockwise" ? 1 : 0;
    const rotationDeg = (phi * 180) / Math.PI;

    const startCmd = first ? `M ${format(fromPt.x)} ${format(fromPt.y)} ` : "";
    return `${startCmd}A ${format(rx)} ${format(ry)} ${format(rotationDeg)} ${largeArc} ${sweep} ${format(toPt.x)} ${format(toPt.y)}`;
  }

  return null;
}

export function getRegionDependencyIds(object: RegionObject): readonly string[] {
  if (object.regionKind === "boundary" && object.loops) {
    const ids = object.loops.flatMap((loop) =>
      loop.edges.flatMap((edge) => [
        edge.objectId,
        ...(edge.startPointId ? [edge.startPointId] : []),
        ...(edge.endPointId ? [edge.endPointId] : []),
      ]),
    );

    return Array.from(new Set(ids));
  }



  return object.boundaryPointIds;
}

export function getRegionBoundaryPath(
  object: RegionObject,
  objects: GeometryObjectRecord,
): ResolvedBoundaryPath | null {
  if (object.regionKind === "boundary" && object.loops?.length) {
    const paths = object.loops.map((loop) => {
      const parts = loop.edges.map((edge, index) => {
        const result = edgePath(edge, objects, index === 0);
        if (result === null) {
          console.log('[REGION_RENDER] edgePath returned null for edge:', {
            regionId: object.id,
            edgeKind: edge.edgeKind,
            objectId: edge.objectId,
            sourcePrimitiveId: edge.sourcePrimitiveId,
            objectExists: Boolean(objects[edge.objectId]),
          });
        }
        return result;
      });

      return parts.some((part) => part === null)
        ? null
        : `${parts.join(" ")}${loop.closed ? " Z" : ""}`;
    });

    if (paths.some((path) => path === null)) {
      console.log('[REGION_RENDER] boundary path returned null for region:', object.id);
      return null;
    }

    return {
      kind: "boundary",
      path: paths.join(" "),
    };
  }

  const points = getPolygonPoints(object, objects);

  if (!points || points.length < 3) {
    return null;
  }

  return {
    kind: "polygon",
    path: `${points.map((point, index) => `${index === 0 ? "M" : "L"} ${format(point.x)} ${format(point.y)}`).join(" ")} Z`,
    points,
  };
}

export function getRegionArea(object: RegionObject, objects: GeometryObjectRecord): number | null {
  const boundary = getRegionBoundaryPath(object, objects);

  if (!boundary) {
    return null;
  }

  if (boundary.kind === "polygon") {
    return Math.abs(polygonArea(boundary.points));
  }

  return null;
}

export function regionContainsPoint(
  object: RegionObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): boolean {
  const boundary = getRegionBoundaryPath(object, objects);

  if (!boundary) {
    return false;
  }

  if (boundary.kind === "polygon") {
    return isPointInPolygon(point, boundary.points);
  }

  return false;
}

export function compoundRegionContainsPoint(
  object: CompoundRegionObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): boolean {
  const { segments } = object;
  if (!segments || segments.length === 0) return false;

  // Approximate the boundary as a polygon for hit testing
  const polygonPoints: Point2D[] = [];

  function addPoint(pt: Point2D) {
    if (polygonPoints.length === 0) {
      polygonPoints.push(pt);
      return;
    }
    const last = polygonPoints[polygonPoints.length - 1]!;
    if (Math.hypot(last.x - pt.x, last.y - pt.y) > 1e-6) {
      polygonPoints.push(pt);
    }
  }

  for (const segment of segments) {
    const startPt =
      segment.startPointId && segment.startPointId !== "__trimmed__"
        ? getPointObject(objects, segment.startPointId)
        : segment.startCoord;
    const endPt =
      segment.endPointId && segment.endPointId !== "__trimmed__"
        ? getPointObject(objects, segment.endPointId)
        : segment.endCoord;

    if (!startPt || !endPt) continue;
    addPoint(startPt);

    if (segment.type === "circle-arc" || segment.type === "ellipse-arc") {
      const centerCoord = "centerCoord" in segment ? segment.centerCoord : undefined;
      const centerPt =
        segment.centerPointId && segment.centerPointId !== "__trimmed__"
          ? getPointObject(objects, segment.centerPointId)
          : centerCoord;

      if (centerPt) {
        const dxStart = startPt.x - centerPt.x;
        const dyStart = startPt.y - centerPt.y;
        const dxEnd = endPt.x - centerPt.x;
        const dyEnd = endPt.y - centerPt.y;

        let startAngle = Math.atan2(dyStart, dxStart);
        let endAngle = Math.atan2(dyEnd, dxEnd);
        if (startAngle < 0) startAngle += 2 * Math.PI;
        if (endAngle < 0) endAngle += 2 * Math.PI;

        const sweepFlag = segment.direction === "clockwise" ? 1 : 0;
        let deltaAngle = endAngle - startAngle;
        if (sweepFlag === 1 && deltaAngle <= 0) deltaAngle += 2 * Math.PI;
        if (sweepFlag === 0 && deltaAngle >= 0) deltaAngle -= 2 * Math.PI;

        // Number of segments based on angular delta (approx 5 degrees per step)
        const steps = Math.max(2, Math.ceil((Math.abs(deltaAngle) * 180) / Math.PI / 5));

        if (segment.type === "circle-arc") {
          const r = segment.radius ?? Math.hypot(dxStart, dyStart);
          for (let j = 1; j < steps; j++) {
            const angle = startAngle + (deltaAngle * j) / steps;
            addPoint({
              x: centerPt.x + r * Math.cos(angle),
              y: centerPt.y + r * Math.sin(angle),
            });
          }
        } else {
          // ellipse-arc
          const rx = segment.radiusX > 0 ? segment.radiusX : Math.hypot(dxStart, dyStart);
          const ry = segment.radiusY;
          const rotation = segment.rotation || Math.atan2(dyStart, dxStart);
          const cosRot = Math.cos(rotation);
          const sinRot = Math.sin(rotation);

          // For ellipse, we need to map the angles back to parameter t
          // A rough approximation is directly interpolating the geometric angle
          for (let j = 1; j < steps; j++) {
            const angle = startAngle + (deltaAngle * j) / steps;
            // Map geometric angle to parametric angle
            // tan(angle - rotation) = (ry * sin(t)) / (rx * cos(t)) = (ry/rx) * tan(t)
            // t = atan2(rx * sin(angle - rot), ry * cos(angle - rot))
            const relAngle = angle - rotation;
            const t = Math.atan2(rx * Math.sin(relAngle), ry * Math.cos(relAngle));
            
            const ex = rx * Math.cos(t);
            const ey = ry * Math.sin(t);
            addPoint({
              x: centerPt.x + ex * cosRot - ey * sinRot,
              y: centerPt.y + ex * sinRot + ey * cosRot,
            });
          }
        }
      }
    } else if (segment.type === "curve") {
      // Very rough polyline approximation for curves if control points exist
      // In HitTest, we just need the polygon interior
      const cps = segment.controlPoints
        .map((id: string) => getPointObject(objects, id))
        .filter((p: any): p is NonNullable<typeof p> => Boolean(p));
      for (const cp of cps) {
        addPoint(cp);
      }
    }

    addPoint(endPt);
  }

  return isPointInPolygon(point, polygonPoints);
}

