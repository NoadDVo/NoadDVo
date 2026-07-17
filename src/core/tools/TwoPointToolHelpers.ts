import {
  pointsAlmostEqual,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
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
  context.setHoveredObject(point?.id ?? null);
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

  const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
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

  const endpoint = existingPoint ?? createNamedFreePoint(worldPoint, objects);
  history.ensure(context);

  if (!existingPoint && !context.addObject(endpoint)) {
    history.commit(context);

    return null;
  }

  return endpoint;
}
