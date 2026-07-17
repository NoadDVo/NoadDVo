import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  EPSILON,
  distance,
  type CircleObject,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type CircleEndpoint = {
  readonly point: PointObject;
};

type CenterPointCircleObject = Extract<
  CircleObject,
  { readonly circleKind: "center-point" }
>;

let circleIdCounter = 0;

function getPointFromHit(
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

function resolveSnapPoint(event: ToolPointerEvent, context: ToolContext): Point2D {
  const point = getPointFromHit(event, context);
  context.setHoveredObject(point?.id ?? null);
  return point ?? event.snappedWorldPoint;
}

function hasDuplicateCircle(
  centerPointId: string,
  radiusPointId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some(
    (object) =>
      object.type === "circle" &&
      object.circleKind === "center-point" &&
      object.centerPointId === centerPointId &&
      object.radiusPointId === radiusPointId,
  );
}

function createCircleName(center: PointObject, radiusPoint: PointObject): string {
  if (center.name && radiusPoint.name) {
    return `Circle ${center.name}${radiusPoint.name}`;
  }

  return "Circle";
}

function createCircleId(center: PointObject, radiusPoint: PointObject): string {
  circleIdCounter += 1;

  return `circle-${center.id}-${radiusPoint.id}-${Date.now().toString(36)}-${circleIdCounter}`;
}

function createCircle(
  center: PointObject,
  radiusPoint: PointObject,
): CenterPointCircleObject {
  const now = Date.now();

  return {
    centerPointId: center.id,
    circleKind: "center-point",
    createdAt: now,
    dependencies: [center.id, radiusPoint.id],
    dependents: [],
    id: createCircleId(center, radiusPoint),
    locked: false,
    name: createCircleName(center, radiusPoint),
    radiusPointId: radiusPoint.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 1.85,
    },
    type: "circle",
    updatedAt: now,
    visible: true,
  };
}

export class CircleTool extends BaseTool {
  private centerEndpoint = null as CircleEndpoint | null;
  private previewRadiusPoint = null as Point2D | null;
  private readonly history = new ToolHistorySession("create", "Create circle");

  constructor() {
    super({
      cursor: "crosshair",
      id: "circle",
      name: "Circle",
      shortcut: "C",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.centerEndpoint) {
      const endpoint = this.resolveEndpoint(event, context);

      if (!endpoint) {
        return;
      }

      this.centerEndpoint = endpoint;
      this.previewRadiusPoint = this.centerEndpoint.point;
      this.transitionState("preview", "preview");

      return;
    }

    const radiusPoint = getPointFromHit(event, context);
    const radiusWorldPoint = radiusPoint ?? event.snappedWorldPoint;

    if (distance(this.centerEndpoint.point, radiusWorldPoint) <= EPSILON) {
      return;
    }

    const finalRadiusPoint =
      radiusPoint ?? createNamedFreePoint(radiusWorldPoint, context.objects);

    if (
      hasDuplicateCircle(
        this.centerEndpoint.point.id,
        finalRadiusPoint.id,
        context.objects,
      )
    ) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    this.history.ensure(context);

    if (!radiusPoint && !context.addObject(finalRadiusPoint)) {
      this.history.commit(context);

      return;
    }

    const latestObjects = {
      ...context.objects,
      [finalRadiusPoint.id]: finalRadiusPoint,
    };
    const circle = createCircle(this.centerEndpoint.point, finalRadiusPoint);

    if (hasDuplicateCircle(circle.centerPointId, circle.radiusPointId, latestObjects)) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (context.addObject(circle)) {
      context.selectObject(circle.id);
      context.setHoveredObject(circle.id);
      this.history.commit(context);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    } else {
      this.history.commit(context);
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.centerEndpoint) {
      const hit = hitTest(
        event.screenPoint,
        event.worldPoint,
        context.objects,
        context.viewport,
      );

      context.setHoveredObject(hit?.objectId ?? null);

      return;
    }

    this.previewRadiusPoint = resolveSnapPoint(event, context);
  }

  cancel(context: ToolContext): void {
    this.history.commit(context);
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.transitionState("waitingInput", "await-input");
  }

  deactivate(context: ToolContext): void {
    this.history.commit(context);
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.resetState("reset");
  }

  renderPreview(context: ToolContext): ReactNode {
    if (!this.centerEndpoint || !this.previewRadiusPoint) {
      return null;
    }

    const radius = distance(this.centerEndpoint.point, this.previewRadiusPoint);

    if (radius <= EPSILON) {
      return null;
    }

    const center = worldToScreen(this.centerEndpoint.point, context.viewport);

    return createElement("circle", {
      cx: center.x,
      cy: center.y,
      fill: "transparent",
      r: radius * context.viewport.scale,
      stroke: "#7ddcff",
      strokeDasharray: "8 7",
      strokeOpacity: 0.72,
      strokeWidth: 2,
    });
  }

  private resolveEndpoint(
    event: ToolPointerEvent,
    context: ToolContext,
  ): CircleEndpoint | null {
    const existingPoint = getPointFromHit(event, context);

    if (existingPoint) {
      context.selectObject(existingPoint.id);
      context.setHoveredObject(existingPoint.id);

      return {
        point: existingPoint,
      };
    }

    const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
    this.history.ensure(context);

    if (!context.addObject(point)) {
      this.history.cancel(context);

      return null;
    }

    context.selectObject(point.id);

    return {
      point,
    };
  }

  private reset(): void {
    this.centerEndpoint = null;
    this.previewRadiusPoint = null;
  }
}

export const circleTool = new CircleTool();
