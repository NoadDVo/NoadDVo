import { createElement } from "react";

import type { LineObject, PointObject, RayObject, SegmentObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { getHitObject, getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type ReflectLineTarget = LineObject | SegmentObject | RayObject;

function projectPointOntoLine(
  point: { readonly x: number; readonly y: number },
  a: { readonly x: number; readonly y: number },
  b: { readonly x: number; readonly y: number },
): { readonly x: number; readonly y: number } | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-12) return null;
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

export class ReflectLineTool extends BaseTool {
  private targetPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "reflect-line",
      name: "Reflect about Line",
      shortcut: "",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.targetPoint) {
      const point = getHitPoint(event, context);
      if (!point) {
        context.setHoveredObject(null);
        return;
      }
      this.targetPoint = point;
      context.selectObject(point.id);
      this.transitionState("waitingInput", "await-input");
      return;
    }

    const hitObject = getHitObject(event, context);
    if (!hitObject || (hitObject.type !== "line" && hitObject.type !== "segment" && hitObject.type !== "ray")) {
      return;
    }

    const line = hitObject as ReflectLineTarget;

    let pointA, pointB;
    if (line.type === "line") {
      pointA = context.objects[line.pointAId];
      pointB = context.objects[line.pointBId];
    } else if (line.type === "segment") {
      pointA = context.objects[line.startPointId];
      pointB = context.objects[line.endPointId];
    } else {
      pointA = context.objects[line.startPointId];
      pointB = context.objects[line.throughPointId];
    }

    if (!pointA || !pointB || pointA.type !== "point" || pointB.type !== "point") {
      return;
    }

    const projection = projectPointOntoLine(this.targetPoint, pointA, pointB);
    if (!projection) return;

    const reflectedPoint = {
      x: this.targetPoint.x + 2 * (projection.x - this.targetPoint.x),
      y: this.targetPoint.y + 2 * (projection.y - this.targetPoint.y),
    };

    const constructedPoint = createNamedDerivedPoint(
      reflectedPoint,
      context.objects,
      {
        pointId: this.targetPoint.id,
        lineId: line.id,
        type: "reflect-line-point",
      },
    );

    if (context.addObject(constructedPoint)) {
      context.selectObject(constructedPoint.id);
      context.setHoveredObject(constructedPoint.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitObject(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    if (!this.targetPoint) {
      return null;
    }

    return createElement(
      "g",
      null,
      renderPreviewPoint({
        point: this.targetPoint,
        r: 4,
        viewport: context.viewport,
      })
    );
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

  private reset(): void {
    this.targetPoint = null;
  }
}

export const reflectLineTool = new ReflectLineTool();
