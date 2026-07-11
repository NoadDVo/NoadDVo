import { createElement } from "react";

import { DEFAULT_GEOMETRY_STYLE } from "../geometry";
import type { HyperbolaObject, PointObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { createConstructionId, getHitPoint } from "./ConstructionToolUtils";
import { createNamedFreePoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export class HyperbolaTool extends BaseTool {
  private focusA = null as PointObject | null;
  private focusB = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "hyperbola",
      name: "Hyperbola",
      shortcut: "",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    let point = getHitPoint(event, context);
    if (!point) {
      point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
      context.addObject(point);
    }

    if (!this.focusA) {
      this.focusA = point;
      context.selectObject(point.id);
      this.transitionState("waitingInput", "await-input");
      return;
    }

    if (!this.focusB) {
      if (point.id === this.focusA.id) return;
      this.focusB = point;
      context.selectObject(point.id);
      this.transitionState("waitingInput", "await-input");
      return;
    }

    const now = Date.now();
    const constructedHyperbola: HyperbolaObject = {
      createdAt: now,
      dependencies: [this.focusA.id, this.focusB.id, point.id],
      dependents: [],
      focusAId: this.focusA.id,
      focusBId: this.focusB.id,
      id: createConstructionId("hyperbola"),
      locked: false,
      pointOnHyperbolaId: point.id,
      style: {
        ...DEFAULT_GEOMETRY_STYLE,
        fill: "transparent",
        stroke: "#dc2626",
        strokeWidth: 2,
      },
      type: "hyperbola",
      updatedAt: now,
      visible: true,
    };

    if (context.addObject(constructedHyperbola)) {
      context.selectObject(constructedHyperbola.id);
      context.setHoveredObject(constructedHyperbola.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    if (!this.focusA) {
      return null;
    }

    const previews = [
      renderPreviewPoint({ point: this.focusA, r: 4, viewport: context.viewport }),
    ];
    if (this.focusB) {
      previews.push(renderPreviewPoint({ point: this.focusB, r: 4, viewport: context.viewport }));
    }

    return createElement("g", null, ...previews);
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
    this.focusA = null;
    this.focusB = null;
  }
}

export const hyperbolaTool = new HyperbolaTool();
