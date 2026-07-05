import type { Point2D, PointObject } from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type MovingPoint = {
  readonly id: string;
  readonly start: Point2D;
};

export class MoveTool extends BaseTool {
  private dragStart = null as Point2D | null;
  private movingPoints = [] as readonly MovingPoint[];

  constructor() {
    super({
      cursor: "grab",
      id: "move",
      name: "Move",
      shortcut: "M",
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

    if (!hit || hit.object.type !== "point") {
      return;
    }

    const point = hit.object;

    if (!this.canMovePoint(point)) {
      return;
    }

    const idsToMove = context.selectedObjectIds.includes(point.id)
      ? context.selectedObjectIds
      : [point.id];
    const movingPoints = idsToMove
      .map((objectId) => context.objects[objectId])
      .filter((object): object is PointObject => object?.type === "point")
      .filter((object) => this.canMovePoint(object))
      .map((object) => ({
        id: object.id,
        start: { x: object.x, y: object.y },
      }));

    if (movingPoints.length === 0) {
      return;
    }

    if (!context.selectedObjectIds.includes(point.id)) {
      context.selectObject(point.id);
    }
    this.dragStart = event.snappedWorldPoint;
    this.movingPoints = movingPoints;
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.dragStart || this.movingPoints.length === 0) {
      const hit = hitTest(
        event.screenPoint,
        event.worldPoint,
        context.objects,
        context.viewport,
      );

      context.setHoveredObject(hit?.objectId ?? null);

      return;
    }

    const delta = {
      x: event.snappedWorldPoint.x - this.dragStart.x,
      y: event.snappedWorldPoint.y - this.dragStart.y,
    };

    for (const movingPoint of this.movingPoints) {
      context.updateObject(movingPoint.id, (currentObject) => {
        if (currentObject.type !== "point" || !this.canMovePoint(currentObject)) {
          return currentObject;
        }

        return {
          ...currentObject,
          updatedAt: Date.now(),
          x: movingPoint.start.x + delta.x,
          y: movingPoint.start.y + delta.y,
        };
      });
    }
  }

  pointerUp(_event: ToolPointerEvent, _context: ToolContext): void {
    this.stopDrag();
  }

  cancel(_context: ToolContext): void {
    this.stopDrag();
  }

  private canMovePoint(point: PointObject): boolean {
    return point.visible && !point.locked && point.pointKind === "free";
  }

  private stopDrag(): void {
    this.dragStart = null;
    this.movingPoints = [];
  }
}

export const moveTool = new MoveTool();
