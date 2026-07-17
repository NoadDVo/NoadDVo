import { createElement } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  distance,
  type EllipticalArcObject,
  type Point2D,
  type PointObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let ellipticalArcIdCounter = 0;

function generateObjectId(prefix: string): string {
  ellipticalArcIdCounter += 1;
  return `${prefix}-${Date.now()}-${ellipticalArcIdCounter}`;
}

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

type EllipticalArcEndpoint = {
  readonly point: PointObject;
};

function resolveHoveredPoint(
  event: ToolPointerEvent,
  context: ToolContext,
): Point2D {
  const point = getPointFromHit(event, context);
  context.setHoveredObject(point?.id ?? null);
  return point ?? event.snappedWorldPoint;
}

function createEllipticalArcName(_center: PointObject, startPoint: PointObject, endPoint: PointObject): string {
  if (startPoint.name && endPoint.name) {
    return `Elliptical Arc ${startPoint.name}${endPoint.name}`;
  }

  return "Elliptical Arc";
}

function createEllipticalArc(
  center: PointObject,
  startPoint: PointObject,
  endPoint: PointObject,
  direction: "clockwise" | "counterclockwise" = "counterclockwise",
): EllipticalArcObject {
  const now = Date.now();
  const rx = distance(center, startPoint);
  return {
    centerPointId: center.id,
    createdAt: now,
    dependencies: [center.id, startPoint.id, endPoint.id],
    dependents: [],
    direction,
    id: generateObjectId("elliptical-arc"),
    locked: false,
    name: createEllipticalArcName(center, startPoint, endPoint),
    startPointId: startPoint.id,
    endPointId: endPoint.id,
    ry: 0.6 * rx,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      dash: "solid",
      fill: "transparent",
      fillOpacity: 0.2,
      stroke: "#2C3E50",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
    type: "elliptical-arc",
    updatedAt: now,
    visible: true,
  };
}

export class EllipticalArcTool extends BaseTool {
  private centerEndpoint: PointObject | null = null;
  private startEndpoint: PointObject | null = null;

  private previewStartPoint: Point2D | null = null;
  private previewEndPoint: Point2D | null = null;

  private readonly history = new ToolHistorySession("create", "Create Elliptical Arc");

  constructor() {
    super({
      cursor: "crosshair",
      id: "elliptical-arc",
      name: "Elliptical Arc",
    });
  }

  override pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (this.state === "waitingInput") {
      const endpoint = this.resolveEndpoint(event, context);

      if (!endpoint) {
        return;
      }

      this.centerEndpoint = endpoint.point;
      this.previewStartPoint = this.centerEndpoint;
      this.transitionState("preview", "preview");
      return;
    }

    if (this.state === "preview" && !this.startEndpoint) {
      const endpoint = this.resolveEndpoint(event, context);

      if (!endpoint) {
        return;
      }

      this.startEndpoint = endpoint.point;
      this.previewEndPoint = this.startEndpoint;
      this.transitionState("preview", "preview");
      return;
    }

    if (this.state === "preview" && this.startEndpoint) {
      const endpoint = this.resolveEndpoint(event, context);

      if (!endpoint) {
        return;
      }

      if (this.centerEndpoint) {
        const ellipticalArc = createEllipticalArc(
          this.centerEndpoint,
          this.startEndpoint,
          endpoint.point,
        );

        if (context.addObject(ellipticalArc)) {
          this.history.commit(context);
        } else {
          this.history.cancel(context);
        }
      }

      context.clearSelection();
      this.resetState("reset");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  override pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.state === "preview") {
      if (!this.startEndpoint) {
        this.previewStartPoint = resolveHoveredPoint(event, context);
      } else {
        this.previewEndPoint = resolveHoveredPoint(event, context);
      }
    }
  }

  override cancel(context: ToolContext): void {
    super.cancel(context);
    this.reset();
    context.clearSelection();
  }

  override deactivate(context: ToolContext): void {
    super.deactivate(context);
    this.reset();
    context.clearSelection();
  }

  override renderPreview(context: ToolContext): React.ReactNode {
    if (this.state !== "preview" || !this.centerEndpoint) {
      return null;
    }

    if (!this.startEndpoint && this.previewStartPoint) {
      const centerScreen = worldToScreen(this.centerEndpoint, context.viewport);
      const startScreen = worldToScreen(this.previewStartPoint, context.viewport);
      return createElement("line", {
        x1: centerScreen.x,
        y1: centerScreen.y,
        x2: startScreen.x,
        y2: startScreen.y,
        stroke: "#7ddcff",
        strokeWidth: 2,
        strokeDasharray: "4 4",
      });
    }

    if (this.startEndpoint && this.previewEndPoint) {
      const centerScreen = worldToScreen(this.centerEndpoint, context.viewport);
      const startScreen = worldToScreen(this.startEndpoint, context.viewport);
      const endScreen = worldToScreen(this.previewEndPoint, context.viewport);

      const dxStart = startScreen.x - centerScreen.x;
      const dyStart = startScreen.y - centerScreen.y;
      const rx = Math.hypot(dxStart, dyStart);
      const ry = 0.6 * rx;

      const dxEnd = endScreen.x - centerScreen.x;
      const dyEnd = endScreen.y - centerScreen.y;

      if (rx < 1e-5 || ry < 1e-5) return null;

      const phiScreen = Math.atan2(dyStart, dxStart);
      const absBScreen = Math.atan2(dyEnd, dxEnd);

      let theta_end = absBScreen - phiScreen;
      if (theta_end < 0) theta_end += 2 * Math.PI;
      if (theta_end === 0) theta_end = 2 * Math.PI;

      const largeArcFlag = theta_end > Math.PI ? 1 : 0;
      const sweepFlag = 0; // CCW in SVG coordinates because Y is flipped

      const startScreenX = startScreen.x;
      const startScreenY = startScreen.y;
      
      const endScreenX = centerScreen.x + rx * Math.cos(theta_end) * Math.cos(phiScreen) - ry * Math.sin(theta_end) * Math.sin(phiScreen);
      const endScreenY = centerScreen.y + rx * Math.cos(theta_end) * Math.sin(phiScreen) + ry * Math.sin(theta_end) * Math.cos(phiScreen);

      const phiDegrees = (phiScreen * 180) / Math.PI;

      const path = `M ${startScreenX} ${startScreenY} A ${rx} ${ry} ${phiDegrees} ${largeArcFlag} ${sweepFlag} ${endScreenX} ${endScreenY}`;

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

    return null;
  }

  private resolveEndpoint(
    event: ToolPointerEvent,
    context: ToolContext,
  ): EllipticalArcEndpoint | null {
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
    this.startEndpoint = null;
    this.previewStartPoint = null;
    this.previewEndPoint = null;
  }
}

export const ellipticalArcTool = new EllipticalArcTool();
