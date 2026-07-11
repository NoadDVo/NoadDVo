import {
  DEFAULT_GEOMETRY_STYLE,
  type DistanceObject,
  type PointObject,
  type SegmentObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let distanceIdCounter = 0;

function createDistanceId(): string {
  distanceIdCounter += 1;
  return `distance-${Date.now().toString(36)}-${distanceIdCounter}`;
}

export class DistanceTool extends BaseTool {
  private firstPoint: PointObject | null = null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "distance",
      name: "Distance",
      shortcut: "D",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );

    const target = hit?.object;

    if (!target) {
      context.setHoveredObject(null);
      this.reset();
      this.transitionState("waitingInput", "await-input");
      return;
    }

    if (target.type === "segment") {
      // Create distance from segment
      this.createDistanceSegment(target, context);
      return;
    }

    if (target.type === "point") {
      if (!this.firstPoint) {
        this.firstPoint = target;
        context.selectObject(target.id);
        return;
      }

      if (this.firstPoint.id === target.id) {
        return;
      }

      // Create distance from two points
      this.createDistanceTwoPoints(this.firstPoint, target, context);
      return;
    }

    this.transitionState("cancelled", "cancel");
    this.reset();
  }

  private createDistanceSegment(segment: SegmentObject, context: ToolContext) {
    const now = Date.now();
    const distance: DistanceObject = {
      createdAt: now,
      dependencies: [segment.id],
      dependents: [],
      distanceKind: "segment",
      id: createDistanceId(),
      labelPosition: "above",
      locked: false,
      ...(segment.name ? { name: `d_${segment.name}` } : {}),
      precision: 2,
      segmentId: segment.id,
      style: {
        ...DEFAULT_GEOMETRY_STYLE,
        labelSize: 13,
        stroke: "#0b0f14",
        strokeOpacity: 1,
      },
      type: "distance",
      updatedAt: now,
      visible: true,
    };

    if (context.addObject(distance)) {
      context.selectObject(distance.id);
      context.setHoveredObject(distance.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  private createDistanceTwoPoints(pointA: PointObject, pointB: PointObject, context: ToolContext) {
    const now = Date.now();
    const distance: DistanceObject = {
      createdAt: now,
      dependencies: [pointA.id, pointB.id],
      dependents: [],
      distanceKind: "two-points",
      id: createDistanceId(),
      labelPosition: "above",
      locked: false,
      pointAId: pointA.id,
      pointBId: pointB.id,
      precision: 2,
      style: {
        ...DEFAULT_GEOMETRY_STYLE,
        labelSize: 13,
        stroke: "#0b0f14",
        strokeOpacity: 1,
      },
      type: "distance",
      updatedAt: now,
      visible: true,
    };

    if (context.addObject(distance)) {
      context.selectObject(distance.id);
      context.setHoveredObject(distance.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );
    context.setHoveredObject(hit?.object.id ?? null);
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
    this.firstPoint = null;
  }
}

export const distanceTool = new DistanceTool();
