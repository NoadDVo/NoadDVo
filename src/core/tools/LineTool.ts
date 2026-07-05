import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  pointsAlmostEqual,
  type GeometryObjectRecord,
  type LineObject,
  type Point2D,
  type PointObject,
} from "../geometry";
import {
  getViewportWorldBounds,
  worldToScreen,
  type WorldBounds,
} from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type LineEndpoint = {
  readonly point: PointObject;
};

let lineIdCounter = 0;

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

function hasDuplicateLine(
  pointAId: string,
  pointBId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some((object) => {
    if (object.type !== "line") {
      return false;
    }

    return (
      (object.pointAId === pointAId && object.pointBId === pointBId) ||
      (object.pointAId === pointBId && object.pointBId === pointAId)
    );
  });
}

function createLineName(pointA: PointObject, pointB: PointObject): string {
  if (pointA.name && pointB.name) {
    return `${pointA.name}${pointB.name}`;
  }

  return "Line";
}

function createLineId(pointA: PointObject, pointB: PointObject): string {
  lineIdCounter += 1;

  return `line-${pointA.id}-${pointB.id}-${Date.now().toString(36)}-${lineIdCounter}`;
}

function createLine(pointA: PointObject, pointB: PointObject): LineObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [pointA.id, pointB.id],
    dependents: [],
    id: createLineId(pointA, pointB),
    locked: false,
    name: createLineName(pointA, pointB),
    pointAId: pointA.id,
    pointBId: pointB.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#dff6ff",
      strokeOpacity: 0.88,
      strokeWidth: 1.85,
    },
    type: "line",
    updatedAt: now,
    visible: true,
  };
}

function isInsideBounds(point: Point2D, bounds: WorldBounds): boolean {
  const tolerance = 1e-8;

  return (
    point.x >= bounds.minX - tolerance &&
    point.x <= bounds.maxX + tolerance &&
    point.y >= bounds.minY - tolerance &&
    point.y <= bounds.maxY + tolerance
  );
}

function uniquePush(points: Point2D[], point: Point2D): void {
  if (!points.some((candidate) => pointsAlmostEqual(candidate, point))) {
    points.push(point);
  }
}

function clipLineToBounds(
  pointA: Point2D,
  pointB: Point2D,
  bounds: WorldBounds,
): readonly [Point2D, Point2D] | null {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const points: Point2D[] = [];

  if (Math.abs(dx) > 1e-10) {
    const leftT = (bounds.minX - pointA.x) / dx;
    const rightT = (bounds.maxX - pointA.x) / dx;

    uniquePush(points, { x: bounds.minX, y: pointA.y + leftT * dy });
    uniquePush(points, { x: bounds.maxX, y: pointA.y + rightT * dy });
  }

  if (Math.abs(dy) > 1e-10) {
    const bottomT = (bounds.minY - pointA.y) / dy;
    const topT = (bounds.maxY - pointA.y) / dy;

    uniquePush(points, { x: pointA.x + bottomT * dx, y: bounds.minY });
    uniquePush(points, { x: pointA.x + topT * dx, y: bounds.maxY });
  }

  const visiblePoints = points.filter((point) => isInsideBounds(point, bounds));
  const first = visiblePoints[0];
  const second = visiblePoints[1];

  return first && second ? [first, second] : null;
}

export class LineTool extends BaseTool {
  private startEndpoint = null as LineEndpoint | null;
  private previewEndPoint = null as Point2D | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "line",
      name: "Line",
      shortcut: "L",
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

    if (hasDuplicateLine(this.startEndpoint.point.id, finalEndPoint.id, context.objects)) {
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (!endPoint && !context.addObject(finalEndPoint)) {
      return;
    }

    const latestObjects = {
      ...context.objects,
      [finalEndPoint.id]: finalEndPoint,
    };
    const line = createLine(this.startEndpoint.point, finalEndPoint);

    if (hasDuplicateLine(line.pointAId, line.pointBId, latestObjects)) {
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (context.addObject(line)) {
      context.selectObject(line.id);
      context.setHoveredObject(line.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
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

  cancel(_context: ToolContext): void {
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.transitionState("waitingInput", "await-input");
  }

  deactivate(_context: ToolContext): void {
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.resetState("reset");
  }

  renderPreview(context: ToolContext): ReactNode {
    if (!this.startEndpoint || !this.previewEndPoint) {
      return null;
    }

    const clippedLine = clipLineToBounds(
      this.startEndpoint.point,
      this.previewEndPoint,
      getViewportWorldBounds(context.viewport),
    );

    if (!clippedLine) {
      return null;
    }

    const start = worldToScreen(clippedLine[0], context.viewport);
    const end = worldToScreen(clippedLine[1], context.viewport);

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

  private resolveEndpoint(
    event: ToolPointerEvent,
    context: ToolContext,
  ): LineEndpoint | null {
    const existingPoint = getPointFromHit(event, context);

    if (existingPoint) {
      context.selectObject(existingPoint.id);
      context.setHoveredObject(existingPoint.id);

      return {
        point: existingPoint,
      };
    }

    const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);

    if (!context.addObject(point)) {
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

export const lineTool = new LineTool();
