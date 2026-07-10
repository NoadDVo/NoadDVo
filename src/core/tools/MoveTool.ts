import type { ImageObject, Point2D, PointObject, SliderObject } from "../geometry";
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

type MovingSlider = {
  readonly id: string;
  readonly startValue: number;
  readonly start: Point2D;
  readonly isKnob: boolean;
};

export class MoveTool extends BaseTool {
  private dragStart = null as Point2D | null;
  private hasDragged = false;
  private movingImages = [] as readonly MovingImage[];
  private movingPoints = [] as readonly MovingPoint[];
  private movingSliders = [] as readonly MovingSlider[];

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

    if (!hit || (hit.object.type !== "point" && hit.object.type !== "image" && hit.object.type !== "slider")) {
      return;
    }

    if (hit.object.type === "slider") {
      this.startSliderDrag(hit.object, hit.type === "slider-knob", event, context);
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
    this.movingSliders = [];
    this.hasDragged = false;
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (!this.dragStart || (this.movingPoints.length === 0 && this.movingImages.length === 0 && this.movingSliders.length === 0)) {
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

    for (const movingSlider of this.movingSliders) {
      context.updateObject(movingSlider.id, (currentObject) => {
        if (currentObject.type !== "slider" || !this.canMoveSlider(currentObject)) {
          return currentObject;
        }

        if (movingSlider.isKnob) {
          // delta.x is in world units, we need it in pixels if widthPx is fixed, 
          // but slider width is in pixels. So we use the viewport scale to convert.
          const deltaXPx = delta.x * context.viewport.scale;
          const ratioDelta = deltaXPx / currentObject.widthPx;
          const valueDelta = ratioDelta * (currentObject.max - currentObject.min);
          let newValue = movingSlider.startValue + valueDelta;
          
          // clamp and step
          if (currentObject.step > 0) {
            newValue = Math.round(newValue / currentObject.step) * currentObject.step;
          }
          newValue = Math.max(currentObject.min, Math.min(currentObject.max, newValue));

          return {
            ...currentObject,
            updatedAt: Date.now(),
            value: newValue,
          };
        } else {
          return {
            ...currentObject,
            updatedAt: Date.now(),
            x: movingSlider.start.x + delta.x,
            y: movingSlider.start.y + delta.y,
          };
        }
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

  private canMoveSlider(slider: SliderObject): boolean {
    return slider.visible && !slider.locked;
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
    this.movingSliders = [];
    this.hasDragged = false;
  }

  private startSliderDrag(
    slider: SliderObject,
    isKnob: boolean,
    event: ToolPointerEvent,
    context: ToolContext,
  ): void {
    if (!this.canMoveSlider(slider)) {
      return;
    }

    if (!context.selectedObjectIds.includes(slider.id)) {
      context.selectObject(slider.id);
    }

    context.beginHistoryTransaction("move", isKnob ? "Change slider value" : "Move slider");
    // Do not use snappedWorldPoint for slider knob, it feels jumpy.
    this.dragStart = isKnob ? event.worldPoint : event.snappedWorldPoint;
    this.movingSliders = [
      {
        id: slider.id,
        startValue: slider.value,
        start: { x: slider.x, y: slider.y },
        isKnob,
      },
    ];
    this.movingImages = [];
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
    this.movingSliders = [];
  }
}

export const moveTool = new MoveTool();
