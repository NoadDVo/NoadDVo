import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  EPSILON,
  distance,
  type ArcObject,
  type Point2D,
  type PointObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let arcIdCounter = 0;

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

function createArcName(_center: PointObject, start: PointObject, end: PointObject): string {
  if (start.name && end.name) {
    return `Arc ${start.name}${end.name}`;
  }

  return "Arc";
}

function createArcId(center: PointObject, start: PointObject, end: PointObject): string {
  arcIdCounter += 1;

  return `arc-${center.id}-${start.id}-${end.id}-${Date.now().toString(36)}-${arcIdCounter}`;
}

function createArc(
  center: PointObject,
  start: PointObject,
  end: PointObject,
  direction: "clockwise" | "counterclockwise" = "counterclockwise",
): ArcObject {
  const now = Date.now();

  return {
    centerPointId: center.id,
    createdAt: now,
    dependencies: [center.id, start.id, end.id],
    dependents: [],
    direction,
    endPointId: end.id,
    id: createArcId(center, start, end),
    locked: false,
    name: createArcName(center, start, end),
    startPointId: start.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 1.85,
      dash: "solid",
    },
    type: "arc",
    updatedAt: now,
    visible: true,
  };
}

export class ArcTool extends BaseTool {
  private centerEndpoint: PointObject | null = null;
  private startEndpoint: PointObject | null = null;
  private previewRadiusPoint: Point2D | null = null;
  private previewEndPoint: Point2D | null = null;
  private readonly history = new ToolHistorySession("create", "Create arc");

  constructor() {
    super({
      cursor: "crosshair",
      id: "three-point-arc",
      name: "Arc",
      shortcut: "A",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    // Step 1: Select Center Point
    if (!this.centerEndpoint) {
      const point = getPointFromHit(event, context);
      const worldPoint = point ?? event.snappedWorldPoint;
      
      const finalPoint = point ?? createNamedFreePoint(worldPoint, context.objects);
      
      this.history.ensure(context);
      if (!point && !context.addObject(finalPoint)) {
        this.history.commit(context);
        return;
      }

      this.centerEndpoint = finalPoint;
      this.previewRadiusPoint = this.centerEndpoint;
      this.transitionState("preview", "preview");
      return;
    }

    // Step 2: Select Start Point
    if (!this.startEndpoint) {
      const point = getPointFromHit(event, context);
      const worldPoint = point ?? event.snappedWorldPoint;

      if (distance(this.centerEndpoint, worldPoint) <= EPSILON) {
        return;
      }

      const finalPoint = point ?? createNamedFreePoint(worldPoint, context.objects);

      if (!point && !context.addObject(finalPoint)) {
        this.history.commit(context);
        return;
      }

      this.startEndpoint = finalPoint;
      this.previewEndPoint = this.startEndpoint;
      this.transitionState("preview", "preview");
      return;
    }

    // Step 3: Select End Point
    const point = getPointFromHit(event, context);
    const worldPoint = point ?? event.snappedWorldPoint;

    if (distance(this.centerEndpoint, worldPoint) <= EPSILON) {
      return;
    }

    const finalPoint = point ?? createNamedFreePoint(worldPoint, context.objects);

    if (!point && !context.addObject(finalPoint)) {
      this.history.commit(context);
      return;
    }

    const arc = createArc(this.centerEndpoint, this.startEndpoint, finalPoint);

    if (context.addObject(arc)) {
      context.selectObject(arc.id);
      context.setHoveredObject(arc.id);
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

    if (!this.startEndpoint) {
      this.previewRadiusPoint = resolveSnapPoint(event, context);
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

  private reset(): void {
    this.centerEndpoint = null;
    this.startEndpoint = null;
    this.previewRadiusPoint = null;
    this.previewEndPoint = null;
  }

  renderPreview(context: ToolContext): ReactNode {
    if (!this.centerEndpoint) {
      return null;
    }

    if (!this.startEndpoint) {
      if (!this.previewRadiusPoint) return null;
      const radius = distance(this.centerEndpoint, this.previewRadiusPoint);
      if (radius <= EPSILON) return null;

      const centerScreen = worldToScreen(this.centerEndpoint, context.viewport);
      return createElement("circle", {
        cx: centerScreen.x,
        cy: centerScreen.y,
        fill: "transparent",
        r: radius * context.viewport.scale,
        stroke: "#7ddcff",
        strokeDasharray: "8 7",
        strokeOpacity: 0.72,
        strokeWidth: 2,
      });
    }

    if (!this.previewEndPoint) return null;
    const radius = distance(this.centerEndpoint, this.startEndpoint);
    if (radius <= EPSILON) return null;

    const startAngle = Math.atan2(
      this.startEndpoint.y - this.centerEndpoint.y,
      this.startEndpoint.x - this.centerEndpoint.x
    );
    const endAngle = Math.atan2(
      this.previewEndPoint.y - this.centerEndpoint.y,
      this.previewEndPoint.x - this.centerEndpoint.x
    );

    let delta = endAngle - startAngle;
    if (delta < 0) delta += 2 * Math.PI;

    const startScreen = worldToScreen(this.startEndpoint, context.viewport);
    
    const exactEndWorld = {
      x: this.centerEndpoint.x + radius * Math.cos(endAngle),
      y: this.centerEndpoint.y + radius * Math.sin(endAngle)
    };
    const endScreen = worldToScreen(exactEndWorld, context.viewport);

    const screenRadius = radius * context.viewport.scale;
    const largeArcFlag = delta > Math.PI ? 1 : 0;
    const sweepFlag = 0; 

    const path = `M ${startScreen.x} ${startScreen.y} A ${screenRadius} ${screenRadius} 0 ${largeArcFlag} ${sweepFlag} ${endScreen.x} ${endScreen.y}`;

    return createElement("path", {
      d: path,
      fill: "none",
      stroke: "#7ddcff",
      strokeLinecap: "round",
      strokeDasharray: "8 7",
      strokeOpacity: 0.72,
      strokeWidth: 2,
    });
  }
}

export const arcTool = new ArcTool();
