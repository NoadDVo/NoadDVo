import { 
  recomputeConstructedPoint, 
  type LineObject, 
  type PointObject,
  type SegmentObject,
  type RayObject
} from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  createConstructionId,
  getHitLinearSource,
  getHitPoint,
  hasLineWithEndpoints,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPreviewPolyline } from "./ToolPreviewPrimitives";

function isPointOnLinearObject(anchorPoint: PointObject, obj: LineObject | RayObject | SegmentObject): boolean {
  if (anchorPoint.construction?.type === "point-on-object" && anchorPoint.construction.objectId === obj.id) return true;
  if (obj.dependencies.includes(anchorPoint.id)) return true;
  return false;
}

export class PerpendicularLineTool extends BaseTool {
  private anchorPoint = null as PointObject | null;
  private parentLine = null as LineObject | RayObject | SegmentObject | null;

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

    if (!this.parentLine) {
      const sourceLine = getHitLinearSource(event, context);

      if (!sourceLine) {
        return;
      }

      // Check if anchorPoint lies on sourceLine
      if (isPointOnLinearObject(this.anchorPoint, sourceLine)) {
        this.parentLine = sourceLine as any;
        context.selectObject(sourceLine.id);
        return;
      }

      // If it doesn't lie on it, draw perpendicular from anchorPoint to sourceLine
      this.createLine(this.anchorPoint, undefined, sourceLine as any, context);
      return;
    }

    const targetLine = getHitLinearSource(event, context);
    if (!targetLine) {
      return;
    }

    this.createLine(this.anchorPoint, this.parentLine, targetLine as any, context);
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

    if (this.parentLine) {
      // Draw perpendicular constrained line preview (approximate for now)
      // Ideally we would compute the actual constrained point, but for now we just draw to pointer
      return renderPreviewPolyline({
        points: [this.anchorPoint, context.pointerWorld],
        viewport: context.viewport,
      });
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
    parentLine: LineObject | RayObject | SegmentObject | undefined,
    sourceLine: LineObject | RayObject | SegmentObject,
    context: ToolContext,
  ): void {
    let construction: any;
    if (parentLine) {
      construction = {
        type: "perpendicular-intersection-point" as const,
        pointId: anchorPoint.id,
        parentLineId: parentLine.id,
        targetLineId: sourceLine.id,
      };
    } else {
      construction = {
        lineId: sourceLine.id,
        pointId: anchorPoint.id,
        type: "line-projection-point" as const,
      };
    }

    const footPointPos = recomputeConstructedPoint(construction, context.objects);

    if (!footPointPos) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    const footPoint = createNamedDerivedPoint(
      footPointPos,
      context.objects,
      construction,
    );

    if (hasLineWithEndpoints(anchorPoint.id, footPoint.id, context.objects)) {
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    context.beginHistoryTransaction("construction", "Create perpendicular line");
    if (!context.addObject(footPoint)) {
      context.cancelHistoryTransaction();

      return;
    }

    const segmentId = createConstructionId("segment-construction");
    const segment: any = {
      createdAt: Date.now(),
      dependencies: [footPoint.id, anchorPoint.id],
      dependents: [],
      endPointId: anchorPoint.id,
      id: segmentId,
      locked: false,
      name: "Perpendicular Altitude",
      specialLineKind: "altitude",
      startPointId: footPoint.id,
      style: {
        dash: "solid",
        fill: "transparent",
        fillOpacity: 0.1,
        labelVisible: true,
        stroke: "#747b84",
        strokeOpacity: 0.72,
        strokeWidth: 1.4,
      },
      type: "segment",
      updatedAt: Date.now(),
      visible: true,
    };

    if (context.addObject(segment)) {
      context.selectObject(segment.id);
      context.setHoveredObject(segment.id);
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
    this.parentLine = null;
  }
}

export const perpendicularLineTool = new PerpendicularLineTool();
