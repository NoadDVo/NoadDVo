import { createElement } from "react";

import { BaseTool } from "./BaseTool";
import { getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { PointObject } from "../geometry/types";
import { pointsAlmostEqual } from "../geometry/math";

export class DilatePointTool extends BaseTool {
  private targetPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "dilate-point",
      name: "Dilate from Point",
      shortcut: "",
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

    if (!this.targetPoint) {
      this.targetPoint = point;
      context.selectObject(point.id);
      this.transitionState("waitingInput", "await-center-point");
      return;
    }

    const centerPoint = point;
    if (this.targetPoint.id === centerPoint.id || pointsAlmostEqual(this.targetPoint, centerPoint)) {
      return;
    }

    const factorStr = window.prompt("Enter dilation factor (e.g. 2, 0.5, -1):", "2");
    if (factorStr === null) {
      this.cancel(context);
      return;
    }

    const factor = parseFloat(factorStr) || 1;

    const dilatedPoint = {
      x: centerPoint.x + factor * (this.targetPoint.x - centerPoint.x),
      y: centerPoint.y + factor * (this.targetPoint.y - centerPoint.y),
    };

    const constructedPoint = createNamedDerivedPoint(
      dilatedPoint,
      context.objects,
      {
        pointId: this.targetPoint.id,
        centerPointId: centerPoint.id,
        factor: factor,
        type: "dilate-point",
      },
    );

    if (context.addObject(constructedPoint)) {
      context.selectObject(constructedPoint.id);
      context.setHoveredObject(constructedPoint.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-target-point");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
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
    this.transitionState("waitingInput", "await-target-point");
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

export const dilatePointTool = new DilatePointTool();
