import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
  type VectorObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { BaseTool } from "./BaseTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import {
  hoverHitObject,
  resolveFinalEndpoint,
  resolveFirstEndpoint,
  resolveTwoPointSnap,
  type TwoPointEndpoint,
} from "./TwoPointToolHelpers";

let vectorIdCounter = 0;

function hasDuplicateVector(
  startPointId: string,
  endPointId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some(
    (object) =>
      object.type === "vector" &&
      object.startPointId === startPointId &&
      object.endPointId === endPointId,
  );
}

function createVectorName(start: PointObject, end: PointObject): string {
  if (start.name && end.name) {
    return `${start.name}${end.name}`;
  }

  return "Vector";
}

function createVectorId(start: PointObject, end: PointObject): string {
  vectorIdCounter += 1;

  return `vector-${start.id}-${end.id}-${Date.now().toString(36)}-${vectorIdCounter}`;
}

function createVector(start: PointObject, end: PointObject): VectorObject {
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [start.id, end.id],
    dependents: [],
    endPointId: end.id,
    id: createVectorId(start, end),
    locked: false,
    metadata: {
      arrowSize: 8,
      arrowStyle: "latex",
    },
    name: createVectorName(start, end),
    startPointId: start.id,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
    type: "vector",
    updatedAt: now,
    visible: true,
  };
}

export class VectorTool extends BaseTool {
  private startEndpoint = null as TwoPointEndpoint | null;
  private previewEndPoint = null as Point2D | null;
  private readonly history = new ToolHistorySession("create", "Create vector");

  constructor() {
    super({
      cursor: "crosshair",
      id: "vector",
      name: "Vector",
      shortcut: "X",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.startEndpoint) {
      const endpoint = resolveFirstEndpoint(event, context, this.history);

      if (!endpoint) {
        return;
      }

      this.startEndpoint = endpoint;
      this.previewEndPoint = endpoint.point;
      this.transitionState("preview", "preview");

      return;
    }

    this.completeVector(event, context);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.startEndpoint) {
      hoverHitObject(event, context);

      return;
    }

    this.previewEndPoint = resolveTwoPointSnap(event, context);
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

    return createElement("g", {}, [
      createElement("defs", { key: "defs" }, [
        createElement(
          "marker",
          {
            id: "ndv-vector-preview-arrow",
            key: "marker",
            markerHeight: 8,
            markerWidth: 8,
            orient: "auto",
            refX: 7,
            refY: 4,
            viewBox: "0 0 8 8",
          },
          createElement("path", {
            d: "M 0 0 L 8 4 L 0 8 L 2.6 4 z",
            fill: "#7ddcff",
          }),
        ),
      ]),
      createElement("line", {
        key: "line",
        markerEnd: "url(#ndv-vector-preview-arrow)",
        stroke: "#7ddcff",
        strokeDasharray: "7 6",
        strokeLinecap: "round",
        strokeOpacity: 0.78,
        strokeWidth: 2,
        x1: start.x,
        x2: end.x,
        y1: start.y,
        y2: end.y,
      }),
    ]);
  }

  private completeVector(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.startEndpoint) {
      return;
    }

    const endPoint = resolveFinalEndpoint({
      context,
      event,
      history: this.history,
      objects: context.objects,
      startPoint: this.startEndpoint.point,
    });

    if (!endPoint) {
      return;
    }

    const latestObjects = {
      ...context.objects,
      [endPoint.id]: endPoint,
    };

    if (hasDuplicateVector(this.startEndpoint.point.id, endPoint.id, latestObjects)) {
      this.history.commit(context);
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    const vector = createVector(this.startEndpoint.point, endPoint);

    if (context.addObject(vector)) {
      context.selectObject(vector.id);
      context.setHoveredObject(vector.id);
      this.history.commit(context);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    } else {
      this.history.commit(context);
    }
  }

  private reset(): void {
    this.startEndpoint = null;
    this.previewEndPoint = null;
  }
}

export const vectorTool = new VectorTool();
