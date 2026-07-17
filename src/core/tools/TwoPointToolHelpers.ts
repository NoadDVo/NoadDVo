import {
  pointsAlmostEqual,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import { getClosestPointOnObject } from "../selection/closestPoint";
import { getHitObject } from "./ConstructionToolUtils";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export type TwoPointEndpoint = {
  readonly point: PointObject;
};

export function getPointFromHit(
  event: ToolPointerEvent,
  context: ToolContext,
): PointObject | null {
  const hit = hitTest(
    event.screenPoint,
    event.worldPoint,
    context.objects,
    context.viewport,
  );

  return hit?.object.type === "point" ? hit.object : null;
}

export function resolveTwoPointSnap(
  event: ToolPointerEvent,
  context: ToolContext,
): Point2D {
  const point = getPointFromHit(event, context);
  const hitObject = getHitObject(event, context);
  context.setHoveredObject(hitObject?.id ?? null);
  return point ?? event.snappedWorldPoint;
}

export function hoverHitObject(event: ToolPointerEvent, context: ToolContext): void {
  const hit = hitTest(
    event.screenPoint,
    event.worldPoint,
    context.objects,
    context.viewport,
  );

  context.setHoveredObject(hit?.objectId ?? null);
}

export function resolveFirstEndpoint(
  event: ToolPointerEvent,
  context: ToolContext,
  history: ToolHistorySession,
): TwoPointEndpoint | null {
  const existingPoint = getPointFromHit(event, context);

  if (existingPoint) {
    context.selectObject(existingPoint.id);
    context.setHoveredObject(existingPoint.id);

    return { point: existingPoint };
  }

  const hitObject = getHitObject(event, context);
  let finalPoint = event.snappedWorldPoint;
  let pointOnObject = false;
  let hitObjectId = "";

  if (
    hitObject &&
    hitObject.type !== "point" &&
    hitObject.type !== "image" &&
    hitObject.type !== "text" &&
    hitObject.type !== "slider" &&
    hitObject.type !== "region"
  ) {
    const closest = getClosestPointOnObject(hitObject, event.worldPoint, context.objects);
    if (closest) {
      finalPoint = closest;
      pointOnObject = true;
      hitObjectId = hitObject.id;
    }
  }

  const basePoint = createNamedFreePoint(finalPoint, context.objects);
  const point = pointOnObject ? {
    ...basePoint,
    pointKind: "derived" as const,
    construction: { type: "point-on-object" as const, objectId: hitObjectId },
    dependencies: [hitObjectId],
  } : basePoint;

  history.ensure(context);

  if (!context.addObject(point)) {
    history.cancel(context);

    return null;
  }

  context.selectObject(point.id);

  return { point };
}

export function resolveFinalEndpoint({
  context,
  event,
  history,
  objects,
  startPoint,
}: {
  readonly context: ToolContext;
  readonly event: ToolPointerEvent;
  readonly history: ToolHistorySession;
  readonly objects: GeometryObjectRecord;
  readonly startPoint: PointObject;
}): PointObject | null {
  const existingPoint = getPointFromHit(event, context);
  const worldPoint = existingPoint ?? event.snappedWorldPoint;

  if (startPoint.id === existingPoint?.id || pointsAlmostEqual(startPoint, worldPoint)) {
    return null;
  }

  let endpoint = existingPoint;
  
  if (!endpoint) {
    const hitObject = getHitObject(event, context);
    let finalPoint = worldPoint;
    let pointOnObject = false;
    let hitObjectId = "";

    if (
      hitObject &&
      hitObject.type !== "point" &&
      hitObject.type !== "image" &&
      hitObject.type !== "text" &&
      hitObject.type !== "slider" &&
      hitObject.type !== "region"
    ) {
      const closest = getClosestPointOnObject(hitObject, event.worldPoint, context.objects);
      if (closest) {
        finalPoint = closest;
        pointOnObject = true;
        hitObjectId = hitObject.id;
      }
    }

    const basePoint = createNamedFreePoint(finalPoint, objects);
    endpoint = pointOnObject ? {
      ...basePoint,
      pointKind: "derived" as const,
      construction: { type: "point-on-object" as const, objectId: hitObjectId },
      dependencies: [hitObjectId],
    } : basePoint;
  }

  history.ensure(context);

  if (!existingPoint && !context.addObject(endpoint)) {
    history.commit(context);

    return null;
  }

  return endpoint;
}
