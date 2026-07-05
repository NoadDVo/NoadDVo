import type { ReactNode } from "react";
import { createElement } from "react";

import { worldToScreen } from "../geometry/viewport";
import { getObjectIdsInSelectionBox } from "../selection/SelectionEngine";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export class SelectTool extends BaseTool {
  private dragStartWorld = null as ToolPointerEvent["worldPoint"] | null;
  private dragCurrentWorld = null as ToolPointerEvent["worldPoint"] | null;

  constructor() {
    super({
      cursor: "default",
      id: "select",
      name: "Select",
      shortcut: "V",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (event.shiftKey) {
      this.dragStartWorld = event.worldPoint;
      this.dragCurrentWorld = event.worldPoint;

      return;
    }

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );

    if (!hit) {
      context.clearSelection();
      context.setHoveredObject(null);

      return;
    }

    context.selectObject(hit.objectId, event.ctrlKey || event.metaKey);
    context.setHoveredObject(hit.objectId);
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.dragStartWorld) {
      this.dragCurrentWorld = event.worldPoint;

      return;
    }

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );

    context.setHoveredObject(hit?.objectId ?? null);
  }

  pointerUp(_event: ToolPointerEvent, context: ToolContext): void {
    if (!this.dragStartWorld || !this.dragCurrentWorld) {
      return;
    }

    context.setSelectedObjects(
      getObjectIdsInSelectionBox(
        this.dragStartWorld,
        this.dragCurrentWorld,
        context.objects,
      ),
    );
    this.dragStartWorld = null;
    this.dragCurrentWorld = null;
  }

  cancel(context: ToolContext): void {
    this.dragStartWorld = null;
    this.dragCurrentWorld = null;
    context.clearSelection();
  }

  renderPreview(context: ToolContext): ReactNode {
    if (!this.dragStartWorld || !this.dragCurrentWorld) {
      return null;
    }

    const start = worldToScreen(this.dragStartWorld, context.viewport);
    const end = worldToScreen(this.dragCurrentWorld, context.viewport);
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    return createElement("rect", {
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

export const selectTool = new SelectTool();
