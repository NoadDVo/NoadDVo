import { createElement } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  isRightAngle,
  pointsAlmostEqual,
  type AngleObject,
  type GeometryObjectRecord,
  type PointObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import { createConstructionId, getHitPoint } from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { useGeometryStore } from "../../app/store/geometryStore";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getNextAngleLabel(objects: GeometryObjectRecord): string {
  const angleLabels = ["α", "β", "γ", "θ"] as const;
  const usedLabels = new Set(
    Object.values(objects)
      .filter((o) => o.type === "angle")
      .map((o) => o.label ?? o.name)
      .filter((l): l is string => Boolean(l)),
  );
  for (const label of angleLabels) {
    if (!usedLabels.has(label)) return label;
  }
  return `θ${usedLabels.size - angleLabels.length + 1}`;
}

function createAngleMark(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  objects: GeometryObjectRecord,
): AngleObject {
  const now = Date.now();
  const label = getNextAngleLabel(objects);
  return {
    createdAt: now,
    dependencies: [pointA.id, vertex.id, pointC.id],
    dependents: [],
    id: createConstructionId("angle"),
    label,
    locked: false,
    name: label,
    pointAId: pointA.id,
    pointCId: pointC.id,
    radius: 0.65,
    showLabel: true,
    showRightAngleMarker: isRightAngle(pointA, vertex, pointC),
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      labelVisible: true,
      stroke: "#0b0f14",
      strokeOpacity: 0.92,
      strokeWidth: 2,
    },
    type: "angle",
    updatedAt: now,
    vertexPointId: vertex.id,
    visible: true,
  };
}

// ─── Tool ────────────────────────────────────────────────────────────────────

export class ConstructAngleWithGivenSizeTool extends BaseTool {
  private vertex: PointObject | null = null;
  private anchorPoint: PointObject | null = null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "angle-given-size",
      name: "Construct Angle With Given Size",
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

    // Step 1: chọn đỉnh V
    if (!this.vertex) {
      this.vertex = point;
      context.selectObject(point.id);
      return;
    }

    // Step 2: chọn điểm mốc A (không trùng V)
    if (!this.anchorPoint) {
      if (
        point.id === this.vertex.id ||
        pointsAlmostEqual(point, this.vertex)
      ) {
        return;
      }
      this.anchorPoint = point;
      context.selectObject(point.id, true);

      // Nhập góc theta
      const thetaStr = window.prompt(
        "Nhập số đo góc θ (độ):",
        "60",
      );
      if (thetaStr === null) {
        this.cancel(context);
        return;
      }
      const theta = parseFloat(thetaStr);
      if (isNaN(theta) || theta <= 0 || theta >= 360) {
        window.alert("Góc không hợp lệ. Vui lòng nhập số từ 0 đến 360.");
        this.cancel(context);
        return;
      }

      // Nhập chiều quay
      const dirStr = window.prompt(
        "Chiều quay:\n  1 = Chiều âm (-)\n  2 = Chiều dương (+)\nNhập 1 hoặc 2:",
        "2",
      );
      if (dirStr === null) {
        this.cancel(context);
        return;
      }
      const direction: "ccw" | "cw" = dirStr.trim() === "1" ? "cw" : "ccw";

      this.buildAngle(theta, direction);
      return;
    }
  }

  private buildAngle(
    theta: number,
    direction: "ccw" | "cw",
  ): void {
    const vertex = this.vertex!;
    const anchor = this.anchorPoint!;

    // Vector VA: từ V đến A
    const dx = anchor.x - vertex.x;
    const dy = anchor.y - vertex.y;
    const r = Math.sqrt(dx * dx + dy * dy);
    if (r < 1e-9) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    // IMPORTANT: Canvas SVG dùng Y-down, toạ độ nội tại dùng Y-up.
    // CCW trên màn hình = alpha - thetaRad trong toạ độ math (Y-up).
    const alpha = Math.atan2(dy, dx);
    const thetaRad = (theta * Math.PI) / 180;
    const newAngle = direction === "ccw" ? alpha - thetaRad : alpha + thetaRad;

    const bPrime = {
      x: vertex.x + r * Math.cos(newAngle),
      y: vertex.y + r * Math.sin(newAngle),
    };

    // Lấy fresh state từ store sau khi window.prompt đã block (tránh stale context)
    const freshState = useGeometryStore.getState();
    const freshObjects = freshState.objects;
    const freshAddObject = freshState.addObject;
    const freshSelectObject = freshState.selectObject;
    const freshSetHovered = freshState.setHoveredObject;

    // Tạo điểm B' với fresh objects để lấy tên đúng
    const pointB = createNamedDerivedPoint(bPrime, freshObjects, {
      type: "angle-given-size-point",
      vertexPointId: vertex.id,
      anchorPointId: anchor.id,
      angleDeg: theta,
      direction,
    });

    if (!freshAddObject(pointB)) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    // Lấy fresh state lần 2 (đã có pointB)
    const freshObjects2 = useGeometryStore.getState().objects;

    // Tạo AngleMark: B' → V → A để arc hiển thị góc theta đúng chiều
    const angleMark = createAngleMark(pointB, vertex, anchor, freshObjects2);
    useGeometryStore.getState().addObject(angleMark);

    freshSelectObject(pointB.id);
    freshSetHovered(pointB.id);
    this.transitionState("completed", "complete");
    this.reset();
    this.transitionState("waitingInput", "await-input");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    const points = [this.vertex, this.anchorPoint].filter(Boolean) as PointObject[];
    if (points.length === 0) return null;

    return createElement(
      "g",
      null,
      ...points.map((p) =>
        renderPreviewPoint({ point: p, r: 4, viewport: context.viewport }),
      ),
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
    this.vertex = null;
    this.anchorPoint = null;
  }
}

export const constructAngleWithGivenSizeTool =
  new ConstructAngleWithGivenSizeTool();
