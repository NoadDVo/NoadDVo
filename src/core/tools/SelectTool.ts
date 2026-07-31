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
  
  private lastClickTime: number = 0;
  private lastClickObjectId: string | null = null;
  private internalClickCount: number = 0;

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

    const now = Date.now();
    if (hit && hit.objectId === this.lastClickObjectId && now - this.lastClickTime < 500) {
      this.internalClickCount++;
    } else {
      this.internalClickCount = 1;
      this.lastClickObjectId = hit ? hit.objectId : null;
    }
    this.lastClickTime = now;

    if (!hit) {
      context.clearSelection();
      context.setHoveredObject(null);

      return;
    }

    context.selectObject(hit.objectId, event.ctrlKey || event.metaKey);
    context.setHoveredObject(hit.objectId);

    if (this.internalClickCount > 1) {
      const currentObject = context.objects[hit.objectId];
      if (currentObject) {
        if (currentObject.type === "point") {
          const styles: import("../geometry/types").PointStyleType[] = [
            "filled",
            "hollow",
            "cross",
            "plus",
            "square",
          ];
          const currentStyle = currentObject.style.pointStyle ?? "filled";
          const nextStyle = styles[(styles.indexOf(currentStyle) + 1) % styles.length];

          context.updateObject(hit.objectId, {
            ...currentObject,
            style: {
              ...currentObject.style,
              pointStyle: nextStyle,
            },
          } as import("../geometry").GeometryObject);
        } else {
          let nextDash = "solid" as "solid" | "dashed" | "dotted";
          if (currentObject.style.dash === "solid") nextDash = "dashed";
          else if (currentObject.style.dash === "dashed") nextDash = "dotted";

          context.updateObject(hit.objectId, {
            ...currentObject,
            style: {
              ...currentObject.style,
              dash: nextDash,
            },
          } as import("../geometry").GeometryObject);
        }
      }
    }
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
