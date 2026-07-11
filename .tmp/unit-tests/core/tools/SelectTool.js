"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectTool = exports.SelectTool = void 0;
const react_1 = require("react");
const viewport_1 = require("../geometry/viewport");
const SelectionEngine_1 = require("../selection/SelectionEngine");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
class SelectTool extends BaseTool_1.BaseTool {
    dragStartWorld = null;
    dragCurrentWorld = null;
    constructor() {
        super({
            cursor: "default",
            id: "select",
            name: "Select",
            shortcut: "V",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        if (event.shiftKey) {
            this.dragStartWorld = event.worldPoint;
            this.dragCurrentWorld = event.worldPoint;
            return;
        }
        const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
        if (!hit) {
            context.clearSelection();
            context.setHoveredObject(null);
            return;
        }
        context.selectObject(hit.objectId, event.ctrlKey || event.metaKey);
        context.setHoveredObject(hit.objectId);
    }
    pointerMove(event, context) {
        if (this.dragStartWorld) {
            this.dragCurrentWorld = event.worldPoint;
            return;
        }
        const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
        context.setHoveredObject(hit?.objectId ?? null);
    }
    pointerUp(_event, context) {
        if (!this.dragStartWorld || !this.dragCurrentWorld) {
            return;
        }
        context.setSelectedObjects((0, SelectionEngine_1.getObjectIdsInSelectionBox)(this.dragStartWorld, this.dragCurrentWorld, context.objects));
        this.dragStartWorld = null;
        this.dragCurrentWorld = null;
    }
    cancel(context) {
        this.dragStartWorld = null;
        this.dragCurrentWorld = null;
        context.clearSelection();
    }
    renderPreview(context) {
        if (!this.dragStartWorld || !this.dragCurrentWorld) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(this.dragStartWorld, context.viewport);
        const end = (0, viewport_1.worldToScreen)(this.dragCurrentWorld, context.viewport);
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        return (0, react_1.createElement)("rect", {
            fill: "rgb(125 220 255 / 0.08)",
            height,
            stroke: "#7ddcff",
            strokeDasharray: "6 6",
            strokeOpacity: 0.78,
            strokeWidth: 1.5,
            width,
            x,
            y,
        });
    }
}
exports.SelectTool = SelectTool;
exports.selectTool = new SelectTool();
