import { createElement } from "react";

import { pointsAlmostEqual } from "../geometry/math";
import type { PointObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export class RotatePointTool extends BaseTool {
  private targetPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "rotate-point",
      name: "Rotate around Point",
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
      this.transitionState("waitingInput", "await-input");
      return;
    }

    const centerPoint = point;
    if (this.targetPoint.id === centerPoint.id || pointsAlmostEqual(this.targetPoint, centerPoint)) {
      return;
    }

    const angleStr = window.prompt("Enter angle in degrees:", "45");
    if (angleStr === null) {
      this.cancel(context);
      return;
    }

    const angleDegrees = parseFloat(angleStr) || 0;
    const rad = (angleDegrees * Math.PI) / 180;
    const dx = this.targetPoint.x - centerPoint.x;
    const dy = this.targetPoint.y - centerPoint.y;

    const rotatedPoint = {
      x: centerPoint.x + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: centerPoint.y + dx * Math.sin(rad) + dy * Math.cos(rad),
    };

    const constructedPoint = createNamedDerivedPoint(
      rotatedPoint,
      context.objects,
      {
        pointId: this.targetPoint.id,
        centerPointId: centerPoint.id,
        angle: angleDegrees,
        type: "rotate-point",
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

export const rotatePointTool = new RotatePointTool();
