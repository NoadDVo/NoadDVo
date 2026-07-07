import { createElement } from "react";

import { midpoint, pointsAlmostEqual, type PointObject } from "../geometry";
import { BaseTool } from "./BaseTool";
import { getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPreviewPoint, renderPreviewPolyline } from "./ToolPreviewPrimitives";

export class MidpointTool extends BaseTool {
  private firstPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "midpoint",
      name: "Midpoint",
      shortcut: "M",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const point = getHitPoint(event, context);

    if (!point) {
      context.setHoveredObject(null);

      return;
    }

    if (!this.firstPoint) {
      this.firstPoint = point;
      context.selectObject(point.id);
      this.transitionState("waitingInput", "await-input");

      return;
    }

    if (this.firstPoint.id === point.id || pointsAlmostEqual(this.firstPoint, point)) {
      return;
    }

    const constructedPoint = createNamedDerivedPoint(
      midpoint(this.firstPoint, point),
      context.objects,
      {
        pointAId: this.firstPoint.id,
        pointBId: point.id,
        type: "midpoint",
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
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    if (!this.firstPoint) {
      return null;
    }

    return createElement(
      "g",
      null,
      renderPreviewPolyline({
        points: [this.firstPoint, context.pointerWorld],
        viewport: context.viewport,
      }),
      renderPreviewPoint({
        point: midpoint(this.firstPoint, context.pointerWorld),
        r: 4,
        viewport: context.viewport,
      }),
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
    this.firstPoint = null;
  }
}

export const midpointTool = new MidpointTool();
