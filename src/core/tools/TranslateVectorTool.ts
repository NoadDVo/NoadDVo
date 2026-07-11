import { createElement } from "react";

import type { PointObject, VectorObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { getHitObject, getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export class TranslateVectorTool extends BaseTool {
  private targetPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "translate-vector",
      name: "Translate by Vector",
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
    if (!hitObject || hitObject.type !== "vector") {
      return;
    }

    const vector = hitObject as VectorObject;
    const start = context.objects[vector.startPointId];
    const end = context.objects[vector.endPointId];

    if (!start || !end || start.type !== "point" || end.type !== "point") {
      return;
    }

    const translatedPoint = {
      x: this.targetPoint.x + (end.x - start.x),
      y: this.targetPoint.y + (end.y - start.y),
    };

    const constructedPoint = createNamedDerivedPoint(
      translatedPoint,
      context.objects,
      {
        pointId: this.targetPoint.id,
        vectorId: vector.id,
        type: "translate-vector-point",
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

export const translateVectorTool = new TranslateVectorTool();
