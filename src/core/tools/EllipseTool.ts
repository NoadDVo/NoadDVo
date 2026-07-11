import { createElement } from "react";

import { DEFAULT_GEOMETRY_STYLE } from "../geometry";
import { getEllipseGeometry } from "../geometry/conicGeometry";
import type { EllipseObject, PointObject } from "../geometry/types";
import { worldToScreen } from "../geometry/viewport";
import { BaseTool } from "./BaseTool";
import { createConstructionId, getHitPoint } from "./ConstructionToolUtils";
import { createNamedFreePoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export class EllipseTool extends BaseTool {
  private focusA = null as PointObject | null;
  private focusB = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "ellipse",
      name: "Ellipse",
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
    const constructedEllipse: EllipseObject = {
      createdAt: now,
      dependencies: [this.focusA.id, this.focusB.id, point.id],
      dependents: [],
      focusAId: this.focusA.id,
      focusBId: this.focusB.id,
      id: createConstructionId("ellipse"),
      locked: false,
      pointOnEllipseId: point.id,
      style: {
        ...DEFAULT_GEOMETRY_STYLE,
        fill: "transparent",
        stroke: "#2563eb",
        strokeWidth: 2,
      },
      type: "ellipse",
      updatedAt: now,
      visible: true,
    };

    if (context.addObject(constructedEllipse)) {
      context.selectObject(constructedEllipse.id);
      context.setHoveredObject(constructedEllipse.id);
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

    if (!this.focusB) {
      return createElement(
        "g",
        null,
        renderPreviewPoint({
          point: this.focusA,
          r: 4,
          viewport: context.viewport,
        })
      );
    }

    // Preview the ellipse
    const now = Date.now();
    const mockPoint = createNamedFreePoint(context.snapPoint(context.pointerWorld), context.objects);
    const mockEllipse: EllipseObject = {
      createdAt: now,
      dependencies: [],
      dependents: [],
      focusAId: this.focusA.id,
      focusBId: this.focusB.id,
      id: "preview-ellipse",
      locked: false,
      pointOnEllipseId: mockPoint.id,
      style: DEFAULT_GEOMETRY_STYLE,
      type: "ellipse",
      updatedAt: now,
      visible: true,
    };

    const tempObjects = {
      ...context.objects,
      [mockPoint.id]: mockPoint,
      [mockEllipse.id]: mockEllipse,
    };

    const geometry = getEllipseGeometry(mockEllipse, tempObjects);
    if (!geometry) {
      return createElement(
        "g",
        null,
        renderPreviewPoint({ point: this.focusA, r: 4, viewport: context.viewport }),
        renderPreviewPoint({ point: this.focusB, r: 4, viewport: context.viewport })
      );
    }

    const center = worldToScreen(geometry.center, context.viewport);
    const rx = geometry.rx * context.viewport.scale;
    const ry = geometry.ry * context.viewport.scale;
    const transform = `rotate(${geometry.angleDegrees}, ${center.x}, ${center.y})`;

    return createElement(
      "g",
      null,
      createElement("ellipse", {
        cx: center.x,
        cy: center.y,
        fill: "none",
        rx: rx,
        ry: ry,
        stroke: "#7ddcff",
        strokeDasharray: "4 4",
        strokeWidth: 2,
        transform: transform,
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
    this.focusA = null;
    this.focusB = null;
  }
}

export const ellipseTool = new EllipseTool();
