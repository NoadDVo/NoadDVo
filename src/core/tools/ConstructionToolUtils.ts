import {
  DEFAULT_GEOMETRY_STYLE,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type LineObject,
  type PointObject,
  type RayObject,
  type SegmentObject,
  type ArcObject,
  type EllipseObject,
  type EllipticalArcObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let constructionIdCounter = 0;

export type IntersectionSource = LineObject | SegmentObject | RayObject | CircleObject | ArcObject | EllipseObject | EllipticalArcObject;

export function getHitObject(
  event: ToolPointerEvent,
  context: ToolContext,
): GeometryObject | null {
  return (
    hitTest(event.screenPoint, event.worldPoint, context.objects, context.viewport)
      ?.object ?? null
  );
}

export function getHitPoint(
  event: ToolPointerEvent,
  context: ToolContext,
): PointObject | null {
  const object = getHitObject(event, context);

  return object?.type === "point" ? object : null;
}

export function getHitLine(
  event: ToolPointerEvent,
  context: ToolContext,
): LineObject | null {
  const object = getHitObject(event, context);

  return object?.type === "line" ? object : null;
}

export function getHitIntersectionSource(
  event: ToolPointerEvent,
  context: ToolContext,
): IntersectionSource | null {
  const object = getHitObject(event, context);

  if (
    object?.type === "line" ||
    object?.type === "segment" ||
    object?.type === "ray" ||
    object?.type === "circle" ||
    object?.type === "arc" ||
    object?.type === "ellipse" ||
    object?.type === "elliptical-arc"
  ) {
    return object as IntersectionSource;
  }

  return null;
}

export function getHitLinearSource(
  event: ToolPointerEvent,
  context: ToolContext,
): LineObject | SegmentObject | RayObject | null {
  const object = getHitObject(event, context);

  if (
    object?.type === "line" ||
    object?.type === "segment" ||
    object?.type === "ray"
  ) {
    return object as LineObject | SegmentObject | RayObject;
  }

  return null;
}

export function createConstructionId(prefix: string): string {
  constructionIdCounter += 1;

  return `${prefix}-${Date.now().toString(36)}-${constructionIdCounter}`;
}

export function createConstructionLine(
  pointA: PointObject,
  pointB: PointObject,
  name: string,
  extra?: Partial<Omit<LineObject, "id" | "type" | "pointAId" | "pointBId" | "createdAt" | "updatedAt" | "name" | "style" | "dependencies" | "dependents" | "locked" | "visible">>,
): LineObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [pointA.id, pointB.id],
    dependents: [],
    id: createConstructionId("line-construction"),
    locked: false,
    name,
    pointAId: pointA.id,
    pointBId: pointB.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      dash: "dashed",
      stroke: "#747b84",
      strokeOpacity: 0.72,
      strokeWidth: 1.4,
    },
    type: "line",
    ...extra,
    updatedAt: now,
    visible: true,
  };
}

export function createConstructionCircle(
  centerPoint: PointObject,
  radiusPoint: PointObject,
  name: string,
): Extract<CircleObject, { readonly circleKind: "center-point" }> {
  const now = Date.now();

  return {
    centerPointId: centerPoint.id,
    circleKind: "center-point",
    createdAt: now,
    dependencies: [centerPoint.id, radiusPoint.id],
    dependents: [],
    id: createConstructionId("circle-construction"),
    locked: false,
    name,
    radiusPointId: radiusPoint.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#747b84",
      strokeOpacity: 0.86,
      strokeWidth: 1.6,
    },
    type: "circle",
    updatedAt: now,
    visible: true,
  };
}

export function createThreePointConstructionCircle(
  pointA: PointObject,
  pointB: PointObject,
  pointC: PointObject,
  name: string,
): Extract<CircleObject, { readonly circleKind: "three-points" }> {
  const now = Date.now();

  return {
    circleKind: "three-points",
    createdAt: now,
    dependencies: [pointA.id, pointB.id, pointC.id],
    dependents: [],
    id: createConstructionId("circle-construction"),
    locked: false,
    name,
    pointAId: pointA.id,
    pointBId: pointB.id,
    pointCId: pointC.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#747b84",
      strokeOpacity: 0.86,
      strokeWidth: 1.6,
    },
    type: "circle",
    updatedAt: now,
    visible: true,
  };
}

export function hasLineWithEndpoints(
  pointAId: string,
  pointBId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some(
    (object) =>
      object.type === "line" &&
      ((object.pointAId === pointAId && object.pointBId === pointBId) ||
        (object.pointAId === pointBId && object.pointBId === pointAId)),
  );
}
