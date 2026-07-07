import type { ImageObject, Point2D, PointObject } from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

type MovingPoint = {
  readonly id: string;
  readonly start: Point2D;
};

type MovingImage = {
  readonly id: string;
  readonly start: Point2D;
};

export class MoveTool extends BaseTool {
  private dragStart = null as Point2D | null;
  private hasDragged = false;
  private movingImages = [] as readonly MovingImage[];
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

    if (!hit || (hit.object.type !== "point" && hit.object.type !== "image")) {
      return;
    }

    if (hit.object.type === "image") {
      this.startImageDrag(hit.object, event, context);
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

    context.beginHistoryTransaction("move", "Move point");
    this.dragStart = event.snappedWorldPoint;
    this.movingPoints = movingPoints;
    this.hasDragged = false;
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.dragStart || (this.movingPoints.length === 0 && this.movingImages.length === 0)) {
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

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    this.hasDragged = true;

    for (const movingImage of this.movingImages) {
      context.updateObject(movingImage.id, (currentObject) => {
        if (currentObject.type !== "image" || !this.canMoveImage(currentObject)) {
          return currentObject;
        }

        return {
          ...currentObject,
          updatedAt: Date.now(),
          x: movingImage.start.x + delta.x,
          y: movingImage.start.y + delta.y,
        };
      });
    }

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

  pointerUp(_event: ToolPointerEvent, context: ToolContext): void {
    this.stopDrag(context);
  }

  cancel(context: ToolContext): void {
    this.stopDrag(context);
  }

  private canMovePoint(point: PointObject): boolean {
    return point.visible && !point.locked && point.pointKind === "free";
  }

  private canMoveImage(image: ImageObject): boolean {
    return image.visible && !image.locked;
  }

  private startImageDrag(
    image: ImageObject,
    event: ToolPointerEvent,
    context: ToolContext,
  ): void {
    if (!this.canMoveImage(image)) {
      return;
    }

    if (!context.selectedObjectIds.includes(image.id)) {
      context.selectObject(image.id);
    }

    context.beginHistoryTransaction("move", "Move image");
    this.dragStart = event.snappedWorldPoint;
    this.movingImages = [
      {
        id: image.id,
        start: { x: image.x, y: image.y },
      },
    ];
    this.movingPoints = [];
    this.hasDragged = false;
  }

  private stopDrag(context: ToolContext): void {
    if (this.dragStart) {
      if (this.hasDragged) {
        context.commitHistoryTransaction();
      } else {
        context.cancelHistoryTransaction();
      }
    }

    this.dragStart = null;
    this.hasDragged = false;
    this.movingImages = [];
    this.movingPoints = [];
  }
}

export const moveTool = new MoveTool();
