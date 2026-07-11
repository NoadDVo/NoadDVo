import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  pointsAlmostEqual,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
  type SegmentObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type SegmentEndpoint = {
  readonly point: PointObject;
};

let segmentIdCounter = 0;

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

function hasDuplicateSegment(
  startPointId: string,
  endPointId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some((object) => {
    if (object.type !== "segment") {
      return false;
    }

    return (
      (object.startPointId === startPointId && object.endPointId === endPointId) ||
      (object.startPointId === endPointId && object.endPointId === startPointId)
    );
  });
}

function createSegmentName(start: PointObject, end: PointObject): string {
  if (start.name && end.name) {
    return `${start.name}${end.name}`;
  }

  return "Segment";
}

function createSegmentId(start: PointObject, end: PointObject): string {
  segmentIdCounter += 1;

  return `segment-${start.id}-${end.id}-${Date.now().toString(36)}-${segmentIdCounter}`;
}

function createSegment(start: PointObject, end: PointObject): SegmentObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [start.id, end.id],
    dependents: [],
    endPointId: end.id,
    id: createSegmentId(start, end),
    locked: false,
    name: createSegmentName(start, end),
    startPointId: start.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
    type: "segment",
    updatedAt: now,
    visible: true,
  };
}

export class SegmentTool extends BaseTool {
  private startEndpoint = null as SegmentEndpoint | null;
  private previewEndPoint = null as Point2D | null;
  private readonly history = new ToolHistorySession("create", "Create segment");

  constructor() {
    super({
      cursor: "crosshair",
      id: "segment",
      name: "Segment",
      shortcut: "S",
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
      this.previewEndPoint = this.startEndpoint.point;
      this.transitionState("preview", "preview");

      return;
    }

    const endPoint = getPointFromHit(event, context);
    const endWorldPoint = endPoint ?? event.snappedWorldPoint;

    if (
      this.startEndpoint.point.id === endPoint?.id ||
      pointsAlmostEqual(this.startEndpoint.point, endWorldPoint)
    ) {
      return;
    }

    const finalEndPoint =
      endPoint ?? createNamedFreePoint(endWorldPoint, context.objects);

    if (
      hasDuplicateSegment(
        this.startEndpoint.point.id,
        finalEndPoint.id,
        context.objects,
      )
    ) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    this.history.ensure(context);

    if (!endPoint && !context.addObject(finalEndPoint)) {
      this.history.commit(context);

      return;
    }

    const latestObjects = {
      ...context.objects,
      [finalEndPoint.id]: finalEndPoint,
    };
    const segment = createSegment(this.startEndpoint.point, finalEndPoint);

    if (hasDuplicateSegment(segment.startPointId, segment.endPointId, latestObjects)) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (context.addObject(segment)) {
      context.selectObject(segment.id);
      context.setHoveredObject(segment.id);
      this.history.commit(context);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    } else {
      this.history.commit(context);
    }
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

    this.previewEndPoint = resolveSnapPoint(event, context);
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
    if (!this.startEndpoint || !this.previewEndPoint) {
      return null;
    }

    const start = worldToScreen(this.startEndpoint.point, context.viewport);
    const end = worldToScreen(this.previewEndPoint, context.viewport);

    return createElement("line", {
      x1: start.x,
      x2: end.x,
      y1: start.y,
      y2: end.y,
      stroke: "#7ddcff",
      strokeDasharray: "7 6",
      strokeLinecap: "round",
      strokeOpacity: 0.74,
      strokeWidth: 2,
    });
  }

  private resolveEndpoint(
    event: ToolPointerEvent,
    context: ToolContext,
  ): SegmentEndpoint | null {
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
    this.startEndpoint = null;
    this.previewEndPoint = null;
  }
}

export const segmentTool = new SegmentTool();
