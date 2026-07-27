import { createElement } from "react";

import { pointsAlmostEqual } from "../geometry/math";
import type { PointObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { useGeometryStore } from "../../app/store/geometryStore";

// ─── Tool ────────────────────────────────────────────────────────────────────

export class ConstructPointByDistanceTool extends BaseTool {
  private fromPoint: PointObject | null = null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "point-by-distance",
      name: "Point By Distance",
      shortcut: "",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) return;

    const point = getHitPoint(event, context);
    if (!point) {
      context.setHoveredObject(null);
      return;
    }

    // Step 1: chọn điểm gốc A
    if (!this.fromPoint) {
      this.fromPoint = point;
      context.selectObject(point.id);
      return;
    }

    // Step 2: chọn điểm đích B (không trùng A)
    const toPoint = point;
    if (
      toPoint.id === this.fromPoint.id ||
      pointsAlmostEqual(toPoint, this.fromPoint)
    ) {
      return;
    }

    // Nhập khoảng cách d
    const dStr = window.prompt(
      `Nhập khoảng cách d từ ${this.fromPoint.name ?? "A"} đến điểm mới (theo đơn vị đồ thị):`,
      "1",
    );
    if (dStr === null) {
      this.cancel(context);
      return;
    }
    const d = parseFloat(dStr);
    if (isNaN(d) || d <= 0) {
      window.alert("Khoảng cách không hợp lệ. Vui lòng nhập số dương.");
      this.cancel(context);
      return;
    }
    this.buildPoint(toPoint, d);
  }

  private buildPoint(
    toPoint: PointObject,
    d: number,
  ): void {
    const from = this.fromPoint!;

    // Vector AB
    const dx = toPoint.x - from.x;
    const dy = toPoint.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-9) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    // P = A + d * (B - A) / |AB|
    const newPoint = {
      x: from.x + (dx / len) * d,
      y: from.y + (dy / len) * d,
    };

    const freshState = useGeometryStore.getState();
    const constructedPoint = createNamedDerivedPoint(newPoint, freshState.objects, {
      type: "point-by-distance",
      fromPointId: from.id,
      toPointId: toPoint.id,
      distance: d,
    });

    if (freshState.addObject(constructedPoint)) {
      freshState.selectObject(constructedPoint.id);
      freshState.setHoveredObject(constructedPoint.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    if (!this.fromPoint) return null;

    return createElement(
      "g",
      null,
      renderPreviewPoint({
        point: this.fromPoint,
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
    this.fromPoint = null;
  }
}

export const constructPointByDistanceTool = new ConstructPointByDistanceTool();
