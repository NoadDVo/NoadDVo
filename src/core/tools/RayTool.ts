import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  pointsAlmostEqual,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
  type RayObject,
} from "../geometry";
import {
  clipRayToBounds,
  getViewportWorldBounds,
  worldToScreen,
} from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type RayEndpoint = {
  readonly point: PointObject;
};

let rayIdCounter = 0;

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
  return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}

function hasDuplicateRay(
  startPointId: string,
  throughPointId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some(
    (object) =>
      object.type === "ray" &&
      object.startPointId === startPointId &&
      object.throughPointId === throughPointId,
  );
}

function createRayName(start: PointObject, through: PointObject): string {
  if (start.name && through.name) {
    return `${start.name}${through.name}`;
  }

  return "Ray";
}

function createRayId(start: PointObject, through: PointObject): string {
  rayIdCounter += 1;

  return `ray-${start.id}-${through.id}-${Date.now().toString(36)}-${rayIdCounter}`;
}

function createRay(start: PointObject, through: PointObject): RayObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [start.id, through.id],
    dependents: [],
    id: createRayId(start, through),
    locked: false,
    name: createRayName(start, through),
    startPointId: start.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 1.85,
    },
    throughPointId: through.id,
    type: "ray",
    updatedAt: now,
    visible: true,
  };
}

export class RayTool extends BaseTool {
  private startEndpoint = null as RayEndpoint | null;
  private previewThroughPoint = null as Point2D | null;
  private readonly history = new ToolHistorySession("create", "Create ray");

  constructor() {
    super({
      cursor: "crosshair",
      id: "ray",
      name: "Ray",
      shortcut: "R",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.startEndpoint) {
      const endpoint = this.resolveEndpoint(event, context);

      if (!endpoint) {
        return;
      }

      this.startEndpoint = endpoint;
      this.previewThroughPoint = this.startEndpoint.point;
      this.transitionState("preview", "preview");

      return;
    }

    this.completeRay(event, context);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.startEndpoint) {
      const hit = hitTest(
        event.screenPoint,
        event.worldPoint,
        context.objects,
        context.viewport,
      );

      context.setHoveredObject(hit?.objectId ?? null);

      return;
    }

    this.previewThroughPoint = resolveSnapPoint(event, context);
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
    if (!this.startEndpoint || !this.previewThroughPoint) {
      return null;
    }

    const clippedRay = clipRayToBounds(
      this.startEndpoint.point,
      this.previewThroughPoint,
      getViewportWorldBounds(context.viewport),
    );

    if (!clippedRay) {
      return null;
    }

    const start = worldToScreen(clippedRay[0], context.viewport);
    const end = worldToScreen(clippedRay[1], context.viewport);

    return createElement("line", {
      x1: start.x,
      x2: end.x,
      y1: start.y,
      y2: end.y,
      stroke: "#7ddcff",
      strokeDasharray: "10 8",
      strokeLinecap: "round",
      strokeOpacity: 0.72,
      strokeWidth: 2,
    });
  }

  private completeRay(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.startEndpoint) {
      return;
    }

    const throughPoint = getPointFromHit(event, context);
    const throughWorldPoint = throughPoint ?? event.snappedWorldPoint;

    if (
      this.startEndpoint.point.id === throughPoint?.id ||
      pointsAlmostEqual(this.startEndpoint.point, throughWorldPoint)
    ) {
      return;
    }

    const finalThroughPoint =
      throughPoint ?? createNamedFreePoint(throughWorldPoint, context.objects);

    if (hasDuplicateRay(this.startEndpoint.point.id, finalThroughPoint.id, context.objects)) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    this.history.ensure(context);

    if (!throughPoint && !context.addObject(finalThroughPoint)) {
      this.history.commit(context);

      return;
    }

    this.createAndSelectRay(finalThroughPoint, context);
  }

  private createAndSelectRay(throughPoint: PointObject, context: ToolContext): void {
    if (!this.startEndpoint) {
      return;
    }

    const latestObjects = {
      ...context.objects,
      [throughPoint.id]: throughPoint,
    };
    const ray = createRay(this.startEndpoint.point, throughPoint);

    if (hasDuplicateRay(ray.startPointId, ray.throughPointId, latestObjects)) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (context.addObject(ray)) {
      context.selectObject(ray.id);
      context.setHoveredObject(ray.id);
      this.history.commit(context);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    } else {
      this.history.commit(context);
    }
  }

  private resolveEndpoint(
    event: ToolPointerEvent,
    context: ToolContext,
  ): RayEndpoint | null {
    const existingPoint = getPointFromHit(event, context);

    if (existingPoint) {
      context.selectObject(existingPoint.id);
      context.setHoveredObject(existingPoint.id);

      return { point: existingPoint };
    }

    const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
    this.history.ensure(context);

    if (!context.addObject(point)) {
      this.history.cancel(context);

      return null;
    }

    context.selectObject(point.id);

    return { point };
  }

  private reset(): void {
    this.startEndpoint = null;
    this.previewThroughPoint = null;
  }
}

export const rayTool = new RayTool();

