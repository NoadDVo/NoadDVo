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

export class ParallelLineTool extends BaseTool {
  private anchorPoint = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "parallel",
      name: "Parallel",
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

    if (
      hasLineWithEndpoints(anchorPoint.id, helperPoint.id, context.objects) ||
      !context.addObject(helperPoint)
    ) {
      return;
    }

    const line = createConstructionLine(anchorPoint, helperPoint, "Parallel Line");

    if (context.addObject(line)) {
      context.selectObject(line.id);
      context.setHoveredObject(line.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  private reset(): void {
    this.anchorPoint = null;
  }
}

export const parallelLineTool = new ParallelLineTool();
