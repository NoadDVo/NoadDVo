import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  DependencyGraph,
  EPSILON,
  distance,
  getArcGeometry,
  getCircleGeometry,
  getPointObject,
  getPolygonPoints,
  pointsAlmostEqual,
  type ArcObject,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type LineObject,
  type Point2D,
  type PointObject,
  type PolygonObject,
  type RayObject,
  type SegmentObject,
  type VectorObject,
} from "../geometry";
import { getRegionBoundaryPath } from "../geometry/regionGeometry";
import { worldToScreen } from "../geometry/viewport";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type TrimmableObject = SegmentObject | LineObject | RayObject | CircleObject;

export type EraseCandidateType =
  | "delete-object"
  | "trim-piece"
  | "split-object"
  | "delete-boundary-edge";

export type EraseCandidateSeverity = "safe" | "warning" | "blocked";

type ErasePreviewGeometry =
  | {
      readonly kind: "line";
      readonly start: Point2D;
      readonly end: Point2D;
    }
  | {
      readonly kind: "arc";
      readonly center: Point2D;
      readonly radius: number;
      readonly startAngleDegrees: number;
      readonly endAngleDegrees: number;
      readonly direction: "clockwise" | "counterclockwise";
    }
  | {
      readonly kind: "path";
      readonly path: string;
    }
  | {
      readonly kind: "box";
      readonly center: Point2D;
      readonly width: number;
      readonly height: number;
    }
  | {
      readonly kind: "point";
      readonly point: Point2D;
    };

export type EraseCandidate = {
  readonly id: string;
  readonly sourceObjectId: string;
  readonly objectType: GeometryObject["type"];
  readonly candidateType: EraseCandidateType;
  readonly previewGeometry: ErasePreviewGeometry;
  readonly affectedRange?: {
    readonly startParameter?: number;
    readonly endParameter?: number;
    readonly edgeIndex?: number;
  };
  readonly severity: EraseCandidateSeverity;
  readonly warnings: readonly string[];
};

type PendingTrim = {
  readonly objectId: string;
  readonly point: Point2D;
};

let trimObjectCounter = 0;

function nextTrimId(prefix: string): string {
  trimObjectCounter += 1;

  return `${prefix}-trim-${Date.now().toString(36)}-${trimObjectCounter}`;
}

function angleDegrees(center: Point2D, point: Point2D): number {
  const degrees = (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;

  return degrees < 0 ? degrees + 360 : degrees;
}

function angleDelta(startDegrees: number, endDegrees: number, direction: "clockwise" | "counterclockwise"): number {
  return direction === "counterclockwise"
    ? (endDegrees - startDegrees + 360) % 360
    : (startDegrees - endDegrees + 360) % 360;
}

function polar(center: Point2D, radius: number, degrees: number): Point2D {
  const radians = (degrees * Math.PI) / 180;

  return {
    x: center.x + Math.cos(radians) * radius,
    y: center.y + Math.sin(radians) * radius,
  };
}

function distanceToSegment(point: Point2D, start: Point2D, end: Point2D): number {
  return distance(point, projectPointToSegment(point, start, end));
}

function distanceToLine(point: Point2D, start: Point2D, end: Point2D): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  return length <= EPSILON
    ? Number.POSITIVE_INFINITY
    : Math.abs(dy * point.x - dx * point.y + end.x * start.y - end.y * start.x) / length;
}

function distanceToRay(point: Point2D, start: Point2D, through: Point2D): number {
  return distance(point, projectPointToRay(point, start, through));
}

function projectPointToSegment(point: Point2D, start: Point2D, end: Point2D): Point2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared <= EPSILON) {
    return start;
  }

  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));

  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
}

function projectPointToLine(point: Point2D, start: Point2D, end: Point2D): Point2D {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared <= EPSILON) {
    return start;
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;

  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
}

function projectPointToRay(point: Point2D, start: Point2D, through: Point2D): Point2D {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared <= EPSILON) {
    return start;
  }

  const t = Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared);

  return {
    x: start.x + dx * t,
    y: start.y + dy * t,
  };
}

function projectPointToCircle(point: Point2D, center: Point2D, radius: number): Point2D {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.hypot(dx, dy);

  if (length <= EPSILON) {
    return {
      x: center.x + radius,
      y: center.y,
    };
  }

  return {
    x: center.x + (dx / length) * radius,
    y: center.y + (dy / length) * radius,
  };
}

function isAngleWithinArc(
  angle: number,
  start: number,
  end: number,
  direction: "clockwise" | "counterclockwise",
): boolean {
  const span = angleDelta(start, end, direction) || 360;
  const pointer = direction === "counterclockwise"
    ? (angle - start + 360) % 360
    : (start - angle + 360) % 360;

  return pointer <= span;
}

function getLinearEndpoints(
  object: SegmentObject | LineObject | RayObject | VectorObject,
  objects: GeometryObjectRecord,
): { readonly start: PointObject; readonly end: PointObject } | null {
  if (object.type === "segment" || object.type === "vector") {
    const start = getPointObject(objects, object.startPointId);
    const end = getPointObject(objects, object.endPointId);

    return start && end ? { start, end } : null;
  }

  if (object.type === "line") {
    const start = getPointObject(objects, object.pointAId);
    const end = getPointObject(objects, object.pointBId);

    return start && end ? { start, end } : null;
  }

  const start = getPointObject(objects, object.startPointId);
  const end = getPointObject(objects, object.throughPointId);

  return start && end ? { start, end } : null;
}

function projectPointToObject(
  object: TrimmableObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): Point2D | null {
  if (object.type === "circle") {
    const circle = getCircleGeometry(object, objects);

    return circle ? projectPointToCircle(point, circle.center, circle.radius) : null;
  }

  const endpoints = getLinearEndpoints(object, objects);

  if (!endpoints) {
    return null;
  }

  if (object.type === "segment") {
    return projectPointToSegment(point, endpoints.start, endpoints.end);
  }

  if (object.type === "ray") {
    return projectPointToRay(point, endpoints.start, endpoints.end);
  }

  return projectPointToLine(point, endpoints.start, endpoints.end);
}

function removeObjectAndDependents(
  objectId: string,
  objects: GeometryObjectRecord,
): GeometryObjectRecord {
  const graph = DependencyGraph.fromObjects(objects);
  const idsToRemove = new Set([objectId]);

  if (graph.valid) {
    graph.value.getDependentIds(objectId).forEach((dependentId) => idsToRemove.add(dependentId));
  }

  return Object.fromEntries(
    Object.entries(objects).filter(([id]) => !idsToRemove.has(id)),
  ) as GeometryObjectRecord;
}

function createTrimmedSegment(
  source: SegmentObject | LineObject | RayObject,
  startPoint: PointObject,
  endPoint: PointObject,
): SegmentObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [startPoint.id, endPoint.id],
    dependents: [],
    endPointId: endPoint.id,
    id: nextTrimId("segment"),
    locked: false,
    name: source.name ? `${source.name} Trim` : "Trimmed Segment",
    startPointId: startPoint.id,
    style: source.style,
    type: "segment",
    updatedAt: now,
    visible: true,
  };
}

function createTrimmedArc(
  source: CircleObject,
  centerPointId: string,
  startPoint: PointObject,
  endPoint: PointObject,
  direction: "clockwise" | "counterclockwise" = "counterclockwise",
): ArcObject {
  const now = Date.now();

  return {
    centerPointId,
    createdAt: now,
    dependencies: [centerPointId, startPoint.id, endPoint.id],
    dependents: [],
    direction,
    endPointId: endPoint.id,
    id: nextTrimId("arc"),
    locked: false,
    name: source.name ? `${source.name} Arc` : "Trimmed Arc",
    startPointId: startPoint.id,
    style: {
      ...source.style,
      fill: "transparent",
      fillOpacity: 0,
    },
    type: "arc",
    updatedAt: now,
    visible: true,
  };
}

function isTrimmable(object: GeometryObject): object is TrimmableObject {
  return object.type === "segment" || object.type === "line" || object.type === "ray" || object.type === "circle";
}

function isCandidateObject(object: GeometryObject): boolean {
  return object.visible && !object.locked;
}

function candidateSort(first: EraseCandidate, second: EraseCandidate): number {
  const typeOrder: Record<EraseCandidateType, number> = {
    "trim-piece": 0,
    "delete-boundary-edge": 1,
    "split-object": 2,
    "delete-object": 3,
  };
  const typeDelta = typeOrder[first.candidateType] - typeOrder[second.candidateType];

  return typeDelta === 0 ? first.sourceObjectId.localeCompare(second.sourceObjectId) : typeDelta;
}

function candidateForDelete(object: GeometryObject, previewGeometry: ErasePreviewGeometry): EraseCandidate {
  return {
    candidateType: "delete-object",
    id: `delete:${object.id}`,
    objectType: object.type,
    previewGeometry,
    severity: "safe",
    sourceObjectId: object.id,
    warnings: [],
  };
}

function collectCircleCutAngles(
  circle: { readonly center: Point2D; readonly radius: number },
  objects: GeometryObjectRecord,
): readonly number[] {
  const angles = Object.values(objects)
    .filter((object): object is PointObject => object.type === "point" && object.visible)
    .filter((point) => Math.abs(distance(circle.center, point) - circle.radius) <= 0.02)
    .map((point) => angleDegrees(circle.center, point))
    .sort((first, second) => first - second);
  const unique: number[] = [];

  angles.forEach((angle) => {
    if (!unique.some((candidate) => Math.abs(candidate - angle) <= 0.5)) {
      unique.push(angle);
    }
  });

  return unique;
}

function circleArcCandidate(
  object: CircleObject,
  point: Point2D,
  objects: GeometryObjectRecord,
  toleranceWorld: number,
): EraseCandidate | null {
  const circle = getCircleGeometry(object, objects);

  if (!circle) {
    return null;
  }

  if (Math.abs(distance(point, circle.center) - circle.radius) > toleranceWorld) {
    return null;
  }

  const cutAngles = collectCircleCutAngles(circle, objects);

  if (cutAngles.length < 2) {
    return candidateForDelete(object, {
      center: circle.center,
      endAngleDegrees: 360,
      direction: "counterclockwise",
      kind: "arc",
      radius: circle.radius,
      startAngleDegrees: 0,
    });
  }

  const pointerAngle = angleDegrees(circle.center, point);
  let startAngle = cutAngles[cutAngles.length - 1] ?? 0;
  let endAngle = cutAngles[0] ?? 0;

  for (let index = 0; index < cutAngles.length; index += 1) {
    const start = cutAngles[index] ?? 0;
    const end = cutAngles[(index + 1) % cutAngles.length] ?? 0;

    if (isAngleWithinArc(pointerAngle, start, end, "counterclockwise")) {
      startAngle = start;
      endAngle = end;
      break;
    }
  }

  return {
    affectedRange: {
      endParameter: endAngle,
      startParameter: startAngle,
    },
    candidateType: "trim-piece",
    id: `circle-arc:${object.id}:${startAngle.toFixed(2)}:${endAngle.toFixed(2)}`,
    objectType: "circle",
    previewGeometry: {
      center: circle.center,
      direction: "counterclockwise",
      endAngleDegrees: endAngle,
      kind: "arc",
      radius: circle.radius,
      startAngleDegrees: startAngle,
    },
    severity: "safe",
    sourceObjectId: object.id,
    warnings: [],
  };
}

function polygonEdgeCandidate(
  object: PolygonObject,
  point: Point2D,
  objects: GeometryObjectRecord,
  toleranceWorld: number,
): EraseCandidate | null {
  const points = getPolygonPoints(object, objects);

  if (!points || points.length < 3) {
    return null;
  }

  let best:
    | {
        readonly distance: number;
        readonly index: number;
        readonly start: PointObject;
        readonly end: PointObject;
      }
    | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];

    if (!start || !end) {
      continue;
    }

    const edgeDistance = distanceToSegment(point, start, end);

    if (edgeDistance <= toleranceWorld && (!best || edgeDistance < best.distance)) {
      best = {
        distance: edgeDistance,
        end,
        index,
        start,
      };
    }
  }

  if (!best) {
    return null;
  }

  return {
    affectedRange: { edgeIndex: best.index },
    candidateType: "delete-boundary-edge",
    id: `polygon-edge:${object.id}:${best.index}`,
    objectType: "polygon",
    previewGeometry: {
      end: best.end,
      kind: "line",
      start: best.start,
    },
    severity: "safe",
    sourceObjectId: object.id,
    warnings: [],
  };
}

export function getEraseCandidates(
  point: Point2D,
  objects: GeometryObjectRecord,
  toleranceWorld = 0.16,
): readonly EraseCandidate[] {
  const candidates: EraseCandidate[] = [];

  Object.values(objects).forEach((object) => {
    if (!isCandidateObject(object)) {
      return;
    }

    if (object.type === "segment" || object.type === "vector") {
      const endpoints = getLinearEndpoints(object, objects);

      if (endpoints && distanceToSegment(point, endpoints.start, endpoints.end) <= toleranceWorld) {
        candidates.push(candidateForDelete(object, {
          end: endpoints.end,
          kind: "line",
          start: endpoints.start,
        }));
      }
      return;
    }

    if (object.type === "line") {
      const endpoints = getLinearEndpoints(object, objects);

      if (endpoints && distanceToLine(point, endpoints.start, endpoints.end) <= toleranceWorld) {
        const projected = projectPointToLine(point, endpoints.start, endpoints.end);

        candidates.push(candidateForDelete(object, {
          end: {
            x: projected.x + (endpoints.end.x - endpoints.start.x),
            y: projected.y + (endpoints.end.y - endpoints.start.y),
          },
          kind: "line",
          start: {
            x: projected.x - (endpoints.end.x - endpoints.start.x),
            y: projected.y - (endpoints.end.y - endpoints.start.y),
          },
        }));
      }
      return;
    }

    if (object.type === "ray") {
      const endpoints = getLinearEndpoints(object, objects);

      if (endpoints && distanceToRay(point, endpoints.start, endpoints.end) <= toleranceWorld) {
        const projected = projectPointToRay(point, endpoints.start, endpoints.end);

        candidates.push(candidateForDelete(object, {
          end: {
            x: projected.x + (endpoints.end.x - endpoints.start.x),
            y: projected.y + (endpoints.end.y - endpoints.start.y),
          },
          kind: "line",
          start: endpoints.start,
        }));
      }
      return;
    }

    if (object.type === "circle") {
      const candidate = circleArcCandidate(object, point, objects, toleranceWorld);

      if (candidate) {
        candidates.push(candidate);
      }
      return;
    }

    if (object.type === "arc") {
      const arc = getArcGeometry(object, objects);

      if (!arc) {
        return;
      }

      const pointerAngle = angleDegrees(arc.center, point);

      if (
        Math.abs(distance(point, arc.center) - arc.radius) <= toleranceWorld &&
        isAngleWithinArc(pointerAngle, arc.startAngleDegrees, arc.endAngleDegrees, object.direction)
      ) {
        candidates.push(candidateForDelete(object, {
          center: arc.center,
          direction: object.direction,
          endAngleDegrees: arc.endAngleDegrees,
          kind: "arc",
          radius: arc.radius,
          startAngleDegrees: arc.startAngleDegrees,
        }));
      }
      return;
    }

    if (object.type === "polygon") {
      const candidate = polygonEdgeCandidate(object, point, objects, toleranceWorld);

      if (candidate) {
        candidates.push(candidate);
      }
      return;
    }

    if (object.type === "region") {
      const boundary = getRegionBoundaryPath(object, objects);

      if (boundary) {
        candidates.push(candidateForDelete(object, {
          kind: "path",
          path: boundary.path,
        }));
      }
      return;
    }

    if (object.type === "text") {
      candidates.push(candidateForDelete(object, {
        kind: "point",
        point: { x: object.x, y: object.y },
      }));
      return;
    }

    if (object.type === "image") {
      const halfWidth = object.width / 2;
      const halfHeight = object.height / 2;

      if (
        point.x >= object.x - halfWidth - toleranceWorld &&
        point.x <= object.x + halfWidth + toleranceWorld &&
        point.y >= object.y - halfHeight - toleranceWorld &&
        point.y <= object.y + halfHeight + toleranceWorld
      ) {
        candidates.push(candidateForDelete(object, {
          center: object,
          height: object.height,
          kind: "box",
          width: object.width,
        }));
      }
      return;
    }

    if (object.type === "distance" || object.type === "area" || object.type === "slider") {
      candidates.push(candidateForDelete(object, {
        kind: "point",
        point,
      }));
      return;
    }

    if (object.type === "angle") {
      candidates.push(candidateForDelete(object, {
        kind: "point",
        point,
      }));
      return;
    }

    if (object.type === "point") {
      if (distance(object, point) <= toleranceWorld) {
        candidates.push(candidateForDelete(object, {
          kind: "point",
          point: object,
        }));
      }
    }
  });

  return candidates.sort(candidateSort);
}

function buildDeleteObjectResult(
  candidate: EraseCandidate,
  objects: GeometryObjectRecord,
): { readonly description: string; readonly objects: GeometryObjectRecord; readonly selectedObjectId?: string } {
  return {
    description: `Erase ${candidate.objectType}`,
    objects: removeObjectAndDependents(candidate.sourceObjectId, objects),
  };
}

function buildPolygonEdgeEraseResult(
  candidate: EraseCandidate,
  objects: GeometryObjectRecord,
): { readonly description: string; readonly objects: GeometryObjectRecord; readonly selectedObjectId?: string } | null {
  const object = objects[candidate.sourceObjectId];

  if (object?.type !== "polygon" || candidate.affectedRange?.edgeIndex === undefined) {
    return null;
  }

  const pointIds = [...object.pointIds];
  const edgeIndex = candidate.affectedRange.edgeIndex;
  const remaining = removeObjectAndDependents(object.id, objects);
  const segments: SegmentObject[] = [];

  for (let index = 0; index < pointIds.length; index += 1) {
    if (index === edgeIndex) {
      continue;
    }

    const startId = pointIds[index];
    const endId = pointIds[(index + 1) % pointIds.length];
    const start = startId ? objects[startId] : null;
    const end = endId ? objects[endId] : null;

    if (start?.type !== "point" || end?.type !== "point") {
      continue;
    }

    segments.push({
      createdAt: Date.now(),
      dependencies: [start.id, end.id],
      dependents: [],
      endPointId: end.id,
      id: nextTrimId("segment"),
      locked: false,
      name: `${object.name ?? "Polygon"} Edge`,
      startPointId: start.id,
      style: object.style,
      type: "segment",
      updatedAt: Date.now(),
      visible: true,
    });
  }

  const result = {
    description: "Erase polygon edge",
    objects: {
      ...remaining,
      ...Object.fromEntries(segments.map((segment) => [segment.id, segment])),
    },
  };

  return segments[0]
    ? { ...result, selectedObjectId: segments[0].id }
    : result;
}

export class TrimTool extends BaseTool {
  private candidates: readonly EraseCandidate[] = [];
  private candidateIndex = 0;
  private diagnostics: readonly string[] = [];
  private pendingTrim: PendingTrim | null = null;
  private previewPoint: Point2D | null = null;

  constructor() {
    super({
      cursor: "not-allowed",
      id: "trim",
      name: "Trim",
      shortcut: "E",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const selectedCandidate = this.candidates[this.candidateIndex];

    if (selectedCandidate) {
      this.commitCandidate(selectedCandidate, context);
      return;
    }

    this.handleLegacyTwoPointTrim(event, context);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.pendingTrim) {
      const object = context.objects[this.pendingTrim.objectId];

      this.previewPoint = object && isTrimmable(object)
        ? projectPointToObject(object, event.worldPoint, context.objects)
        : null;
      return;
    }

    this.candidates = getEraseCandidates(
      event.worldPoint,
      context.objects,
      Math.max(0.08, 10 / context.viewport.scale),
    );
    this.candidateIndex = Math.min(this.candidateIndex, Math.max(0, this.candidates.length - 1));
    this.diagnostics = this.candidates.length === 0 ? ["No erasable geometry."] : [];
    context.setHoveredObject(this.candidates[this.candidateIndex]?.sourceObjectId ?? null);
    this.transitionState(this.candidates.length > 0 ? "preview" : "waitingInput", "preview");
  }

  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key === "Escape") {
      this.reset(context);
      event.preventDefault();
      return;
    }

    if ((event.key === "Tab" || event.key === "ArrowDown" || event.key === "ArrowRight") && this.candidates.length > 1) {
      this.candidateIndex = (this.candidateIndex + 1) % this.candidates.length;
      context.setHoveredObject(this.candidates[this.candidateIndex]?.sourceObjectId ?? null);
      event.preventDefault();
      return;
    }

    if ((event.key === "ArrowUp" || event.key === "ArrowLeft") && this.candidates.length > 1) {
      this.candidateIndex = (this.candidateIndex - 1 + this.candidates.length) % this.candidates.length;
      context.setHoveredObject(this.candidates[this.candidateIndex]?.sourceObjectId ?? null);
      event.preventDefault();
    }
  }

  cancel(context: ToolContext): void {
    this.reset(context);
    super.cancel(context);
  }

  deactivate(context: ToolContext): void {
    this.reset(context);
    super.deactivate(context);
  }

  renderPreview(context: ToolContext): ReactNode {
    const candidate = this.candidates[this.candidateIndex];

    if (candidate) {
      return renderCandidatePreview(candidate, this.candidateIndex, this.candidates.length, context);
    }

    if (this.pendingTrim && this.previewPoint) {
      return renderLegacyTrimPreview(this.pendingTrim.point, this.previewPoint, context);
    }

    if (this.diagnostics.length > 0) {
      return renderDiagnosticLabel(this.diagnostics[0] ?? "No erasable geometry.", context.pointerWorld, context);
    }

    return null;
  }

  private handleLegacyTwoPointTrim(event: ToolPointerEvent, context: ToolContext): void {
    const hitCandidates = getEraseCandidates(
      event.worldPoint,
      context.objects,
      Math.max(0.08, 10 / context.viewport.scale),
    );
    const hit = hitCandidates[0];
    const object = hit ? context.objects[hit.sourceObjectId] : null;

    if (!object || object.locked) {
      this.reset(context);
      return;
    }

    if (!isTrimmable(object) || event.altKey || event.shiftKey) {
      this.commitCandidate(candidateForDelete(object, hit?.previewGeometry ?? { kind: "point", point: event.worldPoint }), context);
      return;
    }

    const projectedPoint = projectPointToObject(object, event.worldPoint, context.objects);

    if (!projectedPoint) {
      this.reset(context);
      return;
    }

    if (!this.pendingTrim || this.pendingTrim.objectId !== object.id) {
      this.pendingTrim = {
        objectId: object.id,
        point: projectedPoint,
      };
      this.previewPoint = projectedPoint;
      context.selectObject(object.id);
      context.setHoveredObject(object.id);
      this.transitionState("preview", "preview");
      return;
    }

    this.commitTrim(object, this.pendingTrim.point, projectedPoint, context);
  }

  private commitCandidate(candidate: EraseCandidate, context: ToolContext): void {
    if (candidate.severity === "blocked") {
      this.diagnostics = candidate.warnings;
      return;
    }

    const result = candidate.candidateType === "delete-boundary-edge"
      ? buildPolygonEdgeEraseResult(candidate, context.objects)
      : candidate.candidateType === "trim-piece"
        ? this.buildTrimPieceResult(candidate, context.objects)
        : buildDeleteObjectResult(candidate, context.objects);

    if (!result) {
      this.diagnostics = ["Erase candidate is not safe to apply."];
      return;
    }

    if (context.setObjects(result.objects, result.description, result.selectedObjectId ? [result.selectedObjectId] : [])) {
      context.setHoveredObject(result.selectedObjectId ?? null);
      this.transitionState("completed", "complete");
    }

    this.reset(context);
    this.transitionState("waitingInput", "await-input");
  }

  private buildTrimPieceResult(
    candidate: EraseCandidate,
    objects: GeometryObjectRecord,
  ): { readonly description: string; readonly objects: GeometryObjectRecord; readonly selectedObjectId?: string } | null {
    const object = objects[candidate.sourceObjectId];

    if (object?.type !== "circle") {
      return buildDeleteObjectResult(candidate, objects);
    }

    const circle = getCircleGeometry(object, objects);
    const startAngle = candidate.affectedRange?.startParameter;
    const endAngle = candidate.affectedRange?.endParameter;

    if (!circle || startAngle === undefined || endAngle === undefined) {
      return null;
    }

    let remaining = removeObjectAndDependents(object.id, objects);
    let centerPointId: string;

    if (object.circleKind === "center-radius" || object.circleKind === "center-point") {
      centerPointId = object.centerPointId;
    } else {
      const centerPoint = createNamedFreePoint(circle.center, remaining);

      remaining = {
        ...remaining,
        [centerPoint.id]: {
          ...centerPoint,
          name: "Arc Center",
          style: {
            ...DEFAULT_GEOMETRY_STYLE,
            fill: "#f8fafc",
            pointSize: 4,
            stroke: "#747b84",
            strokeWidth: 1.5,
          },
          visible: false,
        },
      };
      centerPointId = centerPoint.id;
    }

    const startPoint = createNamedFreePoint(polar(circle.center, circle.radius, endAngle), remaining);
    const withStart = { ...remaining, [startPoint.id]: startPoint };
    const endPoint = createNamedFreePoint(polar(circle.center, circle.radius, startAngle), withStart);
    const arc = createTrimmedArc(object, centerPointId, startPoint, endPoint, "counterclockwise");

    return {
      description: "Erase circle arc",
      objects: {
        ...remaining,
        [startPoint.id]: startPoint,
        [endPoint.id]: endPoint,
        [arc.id]: arc,
      },
      selectedObjectId: arc.id,
    };
  }

  private commitTrim(
    object: TrimmableObject,
    firstPoint: Point2D,
    secondPoint: Point2D,
    context: ToolContext,
  ): void {
    if (pointsAlmostEqual(firstPoint, secondPoint) || distance(firstPoint, secondPoint) <= EPSILON) {
      return;
    }

    const nextObjects = object.type === "circle"
      ? this.buildCircleTrimObjects(object, firstPoint, secondPoint, context.objects)
      : this.buildLinearTrimObjects(object, firstPoint, secondPoint, context.objects);

    if (!nextObjects) {
      this.reset(context);
      return;
    }

    if (context.setObjects(nextObjects.objects, nextObjects.description, [nextObjects.selectedObjectId])) {
      context.setHoveredObject(nextObjects.selectedObjectId);
      this.transitionState("completed", "complete");
    }

    this.reset(context);
    this.transitionState("waitingInput", "await-input");
  }

  private buildLinearTrimObjects(
    object: SegmentObject | LineObject | RayObject,
    firstPoint: Point2D,
    secondPoint: Point2D,
    objects: GeometryObjectRecord,
  ): { readonly description: string; readonly objects: GeometryObjectRecord; readonly selectedObjectId: string } | null {
    const start = createNamedFreePoint(firstPoint, objects);
    const objectsWithStart = { ...objects, [start.id]: start };
    const end = createNamedFreePoint(secondPoint, objectsWithStart);
    const segment = createTrimmedSegment(object, start, end);
    const remaining = removeObjectAndDependents(object.id, objects);

    return {
      description: "Trim linear object",
      objects: {
        ...remaining,
        [start.id]: start,
        [end.id]: end,
        [segment.id]: segment,
      },
      selectedObjectId: segment.id,
    };
  }

  private buildCircleTrimObjects(
    object: CircleObject,
    firstPoint: Point2D,
    secondPoint: Point2D,
    objects: GeometryObjectRecord,
  ): { readonly description: string; readonly objects: GeometryObjectRecord; readonly selectedObjectId: string } | null {
    const circle = getCircleGeometry(object, objects);

    if (!circle) {
      return null;
    }

    let remaining = removeObjectAndDependents(object.id, objects);
    let centerPointId: string;

    if (object.circleKind === "center-radius" || object.circleKind === "center-point") {
      centerPointId = object.centerPointId;
    } else {
      const centerPoint = createNamedFreePoint(circle.center, remaining);

      remaining = {
        ...remaining,
        [centerPoint.id]: {
          ...centerPoint,
          name: "Arc Center",
          style: {
            ...DEFAULT_GEOMETRY_STYLE,
            fill: "#f8fafc",
            pointSize: 4,
            stroke: "#747b84",
            strokeWidth: 1.5,
          },
          visible: false,
        },
      };
      centerPointId = centerPoint.id;
    }

    const projectedStart = projectPointToCircle(firstPoint, circle.center, circle.radius);
    const projectedEnd = projectPointToCircle(secondPoint, circle.center, circle.radius);
    const start = createNamedFreePoint(projectedStart, remaining);
    const withStart = { ...remaining, [start.id]: start };
    const end = createNamedFreePoint(projectedEnd, withStart);
    const arc = createTrimmedArc(object, centerPointId, start, end);

    return {
      description: "Trim circle to arc",
      objects: {
        ...remaining,
        [start.id]: start,
        [end.id]: end,
        [arc.id]: arc,
      },
      selectedObjectId: arc.id,
    };
  }

  private reset(context: ToolContext): void {
    this.candidates = [];
    this.candidateIndex = 0;
    this.diagnostics = [];
    this.pendingTrim = null;
    this.previewPoint = null;
    context.setHoveredObject(null);
    this.transitionState("waitingInput", "await-input");
  }
}

export const trimTool = new TrimTool();

function renderCandidatePreview(
  candidate: EraseCandidate,
  candidateIndex: number,
  candidateCount: number,
  context: ToolContext,
): ReactNode {
  const label = candidateCount > 1
    ? `Erase ${candidateIndex + 1} of ${candidateCount}`
    : "Erase";
  const geometry = candidate.previewGeometry;
  const labelPoint = previewLabelPoint(geometry);

  return createElement(
    "g",
    { "data-erase-preview": candidate.id },
    renderPreviewGeometry(geometry, context),
    renderDiagnosticLabel(label, labelPoint, context, "#ffd6d6", "#351018"),
  );
}

function renderPreviewGeometry(geometry: ErasePreviewGeometry, context: ToolContext): ReactNode {
  if (geometry.kind === "line") {
    const start = worldToScreen(geometry.start, context.viewport);
    const end = worldToScreen(geometry.end, context.viewport);

    return createElement("line", {
      stroke: "#ff5d6c",
      strokeDasharray: "8 5",
      strokeLinecap: "round",
      strokeOpacity: 0.95,
      strokeWidth: 5,
      x1: start.x,
      x2: end.x,
      y1: start.y,
      y2: end.y,
    });
  }

  if (geometry.kind === "arc") {
    const startPoint = worldToScreen(polar(geometry.center, geometry.radius, geometry.startAngleDegrees), context.viewport);
    const endPoint = worldToScreen(polar(geometry.center, geometry.radius, geometry.endAngleDegrees), context.viewport);
    const delta = angleDelta(geometry.startAngleDegrees, geometry.endAngleDegrees, geometry.direction) || 360;
    const radius = geometry.radius * context.viewport.scale;
    const sweep = geometry.direction === "counterclockwise" ? 0 : 1;

    return createElement("path", {
      d: `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${delta > 180 ? 1 : 0} ${sweep} ${endPoint.x} ${endPoint.y}`,
      fill: "none",
      stroke: "#ff5d6c",
      strokeDasharray: "8 5",
      strokeLinecap: "round",
      strokeOpacity: 0.95,
      strokeWidth: 5,
    });
  }

  if (geometry.kind === "box") {
    const center = worldToScreen(geometry.center, context.viewport);
    const width = geometry.width * context.viewport.scale;
    const height = geometry.height * context.viewport.scale;

    return createElement("rect", {
      fill: "#ff5d6c",
      fillOpacity: 0.14,
      height,
      stroke: "#ff5d6c",
      strokeDasharray: "8 5",
      strokeOpacity: 0.95,
      strokeWidth: 2,
      width,
      x: center.x - width / 2,
      y: center.y - height / 2,
    });
  }

  if (geometry.kind === "path") {
    return createElement("path", {
      d: worldPathToScreenPath(geometry.path, context),
      fill: "#ff5d6c",
      fillOpacity: 0.13,
      stroke: "#ff5d6c",
      strokeDasharray: "8 5",
      strokeOpacity: 0.95,
      strokeWidth: 2,
    });
  }

  const point = worldToScreen(geometry.point, context.viewport);

  return createElement("circle", {
    cx: point.x,
    cy: point.y,
    fill: "#ff5d6c",
    fillOpacity: 0.22,
    r: 14,
    stroke: "#ff5d6c",
    strokeOpacity: 0.95,
    strokeWidth: 2,
  });
}

function previewLabelPoint(geometry: ErasePreviewGeometry): Point2D {
  if (geometry.kind === "line") {
    return {
      x: (geometry.start.x + geometry.end.x) / 2,
      y: (geometry.start.y + geometry.end.y) / 2,
    };
  }

  if (geometry.kind === "arc") {
    const delta = angleDelta(geometry.startAngleDegrees, geometry.endAngleDegrees, geometry.direction);
    const midAngle = geometry.direction === "counterclockwise"
      ? geometry.startAngleDegrees + delta / 2
      : geometry.startAngleDegrees - delta / 2;

    return polar(geometry.center, geometry.radius, midAngle);
  }

  if (geometry.kind === "box") {
    return geometry.center;
  }

  if (geometry.kind === "point") {
    return geometry.point;
  }

  return { x: 0, y: 0 };
}

function renderLegacyTrimPreview(startPoint: Point2D, endPoint: Point2D, context: ToolContext): ReactNode {
  const start = worldToScreen(startPoint, context.viewport);
  const end = worldToScreen(endPoint, context.viewport);

  return createElement(
    "g",
    { "data-trim-preview": "true" },
    createElement("line", {
      stroke: "#ffcf6a",
      strokeDasharray: "7 6",
      strokeLinecap: "round",
      strokeOpacity: 0.9,
      strokeWidth: 2,
      x1: start.x,
      x2: end.x,
      y1: start.y,
      y2: end.y,
    }),
    createElement("circle", {
      cx: start.x,
      cy: start.y,
      fill: "#ffcf6a",
      r: 4,
    }),
    createElement("circle", {
      cx: end.x,
      cy: end.y,
      fill: "#ffcf6a",
      r: 4,
    }),
  );
}

function renderDiagnosticLabel(
  message: string,
  point: Point2D,
  context: ToolContext,
  fill = "#e5f8ff",
  stroke = "#06202a",
): ReactNode {
  const screen = worldToScreen(point, context.viewport);

  return createElement("text", {
    fill,
    fontSize: 12,
    fontWeight: 800,
    paintOrder: "stroke",
    stroke,
    strokeWidth: 4,
    x: screen.x + 10,
    y: screen.y - 10,
  }, message);
}

function worldPathToScreenPath(path: string, context: ToolContext): string {
  const tokens = path.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  const output: string[] = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token === "M" || token === "L") {
      const x = Number(tokens[index + 1]);
      const y = Number(tokens[index + 2]);
      const screen = worldToScreen({ x, y }, context.viewport);

      output.push(token, String(screen.x), String(screen.y));
      index += 3;
      continue;
    }

    if (token === "A") {
      const rx = Number(tokens[index + 1]) * context.viewport.scale;
      const ry = Number(tokens[index + 2]) * context.viewport.scale;
      const rotation = tokens[index + 3] ?? "0";
      const largeArc = tokens[index + 4] ?? "0";
      const sweep = tokens[index + 5] === "1" ? "0" : "1";
      const x = Number(tokens[index + 6]);
      const y = Number(tokens[index + 7]);
      const screen = worldToScreen({ x, y }, context.viewport);

      output.push("A", String(rx), String(ry), rotation, largeArc, sweep, String(screen.x), String(screen.y));
      index += 8;
      continue;
    }

    if (token === "Z") {
      output.push("Z");
    }

    index += 1;
  }

  return output.join(" ");
}
