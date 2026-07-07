import { recomputeConstructedPoint, type LineObject, type PointObject } from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  createConstructionLine,
  getHitLine,
  getHitPoint,
  hasLineWithEndpoints,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPreviewPolyline } from "./ToolPreviewPrimitives";

export class PerpendicularLineTool extends BaseTool {
  private anchorPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "perpendicular",
      name: "Perpendicular Line",
      shortcut: "N",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.anchorPoint) {
      const point = getHitPoint(event, context);

      if (!point) {
        return;
      }

      this.anchorPoint = point;
      context.selectObject(point.id);

      return;
    }

    const sourceLine = getHitLine(event, context);

    if (!sourceLine) {
      return;
    }

    this.createLine(this.anchorPoint, sourceLine, context);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const hovered = this.anchorPoint
      ? getHitLine(event, context)
      : getHitPoint(event, context);

    context.setHoveredObject(hovered?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    if (!this.anchorPoint) {
      return null;
    }

    return renderPreviewPolyline({
      points: [this.anchorPoint, context.pointerWorld],
      viewport: context.viewport,
    });
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

  private createLine(
    anchorPoint: PointObject,
    sourceLine: LineObject,
    context: ToolContext,
  ): void {
    const construction = {
      lineId: sourceLine.id,
      pointId: anchorPoint.id,
      type: "perpendicular-line-point" as const,
    };
    const directionPoint = recomputeConstructedPoint(construction, context.objects);

    if (!directionPoint) {
      return;
    }

    const helperPoint = createNamedDerivedPoint(
      directionPoint,
      context.objects,
      construction,
      {
        namePrefix: `H${Date.now().toString(36)}`,
        visible: false,
      },
    );

    if (hasLineWithEndpoints(anchorPoint.id, helperPoint.id, context.objects)) {
      return;
    }

    context.beginHistoryTransaction("construction", "Create perpendicular line");
    if (!context.addObject(helperPoint)) {
      context.cancelHistoryTransaction();

      return;
    }

    const line = createConstructionLine(anchorPoint, helperPoint, "Perpendicular Line");

    if (context.addObject(line)) {
      context.selectObject(line.id);
      context.setHoveredObject(line.id);
      context.commitHistoryTransaction();
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    context.commitHistoryTransaction();
  }

  private reset(): void {
    this.anchorPoint = null;
  }
}

export const perpendicularLineTool = new PerpendicularLineTool();
