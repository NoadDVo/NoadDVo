"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTool = exports.MoveTool = void 0;
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
class MoveTool extends BaseTool_1.BaseTool {
    dragStart = null;
    hasDragged = false;
    movingImages = [];
    movingPoints = [];
    constructor() {
        super({
            cursor: "grab",
            id: "move",
            name: "Move",
            shortcut: "M",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
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
            .filter((object) => object?.type === "point")
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
    pointerMove(event, context) {
        if (!this.dragStart || (this.movingPoints.length === 0 && this.movingImages.length === 0)) {
            const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
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
    pointerUp(_event, context) {
        this.stopDrag(context);
    }
    cancel(context) {
        this.stopDrag(context);
    }
    canMovePoint(point) {
        return point.visible && !point.locked && point.pointKind === "free";
    }
    canMoveImage(image) {
        return image.visible && !image.locked;
    }
    startImageDrag(image, event, context) {
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
    stopDrag(context) {
        if (this.dragStart) {
            if (this.hasDragged) {
                context.commitHistoryTransaction();
            }
            else {
                context.cancelHistoryTransaction();
            }
        }
        this.dragStart = null;
        this.hasDragged = false;
        this.movingImages = [];
        this.movingPoints = [];
    }
}
exports.MoveTool = MoveTool;
exports.moveTool = new MoveTool();
