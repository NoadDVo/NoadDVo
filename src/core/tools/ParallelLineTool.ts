import { recomputeConstructedPoint, type LineObject, type PointObject } from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  createConstructionLine,
  getHitLinearSource,
  getHitPoint,
  hasLineWithEndpoints,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPreviewPolyline } from "./ToolPreviewPrimitives";

export class ParallelLineTool extends BaseTool {
  private anchorPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "parallel",
      name: "Parallel Line",
      shortcut: "K",
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

    const sourceLine = getHitLinearSource(event, context);

    if (!sourceLine) {
      return;
    }

    this.createLine(this.anchorPoint, sourceLine as any, context);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const hovered = this.anchorPoint
      ? getHitLinearSource(event, context)
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
      type: "parallel-line-point" as const,
    };
    const directionPoint = recomputeConstructedPoint(construction, context.objects);

    if (!directionPoint) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
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
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    context.beginHistoryTransaction("construction", "Create parallel line");
    if (!context.addObject(helperPoint)) {
      context.cancelHistoryTransaction();

      return;
    }

    const line = createConstructionLine(anchorPoint, helperPoint, "Parallel Line", {
      lineKind: "parallel",
      sourceLineId: sourceLine.id,
      anchorPointId: anchorPoint.id,
    });

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
    this.reset();
    this.transitionState("waitingInput", "await-input");
  }

  private reset(): void {
    this.anchorPoint = null;
  }
}

export const parallelLineTool = new ParallelLineTool();
