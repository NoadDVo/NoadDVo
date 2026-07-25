import { createElement, type ReactNode } from "react";
import type { Point2D, PointObject } from "../geometry/types";
import { getGeometryClipboardSnapshot, commitPaste } from "../clipboard/GeometryClipboard";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { geometryRendererRegistry } from "../renderer/RendererRegistry";
import { hitTest } from "../selection/HitTest";
import { getClosestPointOnObject } from "../selection/closestPoint";
import { worldToScreen } from "../geometry/viewport";

export class PasteTool extends BaseTool {
  private currentOffset: Point2D | null = null;
  private snapSourceId: string | null = null;
  private snapTargetId: string | null = null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "paste",
      name: "Paste",
    });
  }

  activate(context: ToolContext): void {
    super.activate(context);
    this.currentOffset = null;
    
    // Check if clipboard is empty, if so, just deactivate immediately
    if (!getGeometryClipboardSnapshot()) {
      context.setActiveTool("select");
    }
  }

  pointerDown(event: ToolPointerEvent, _context: ToolContext): void {
    if (event.button !== 0) return;
    
    if (this.currentOffset) {
      commitPaste(this.currentOffset, this.snapSourceId && this.snapTargetId ? {
        sourceId: this.snapSourceId,
        targetId: this.snapTargetId,
      } : undefined);
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const payload = getGeometryClipboardSnapshot();
    if (!payload || payload.objects.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    const pastedPoints: PointObject[] = [];
    
    for (const obj of payload.objects) {
      if ('x' in obj && typeof (obj as any).x === 'number') {
        minX = Math.min(minX, (obj as any).x);
        minY = Math.min(minY, (obj as any).y);
      }
      if (obj.type === "point") {
        pastedPoints.push(obj as PointObject);
      }
    }
    
    if (minX === Infinity) {
        minX = 0;
        minY = 0;
    }

    let offsetX = event.worldPoint.x - minX;
    let offsetY = event.worldPoint.y - minY;
    let snapTargetId = null;
    let snapSourceId = null;

    let bestDist = Infinity;
    let bestOffset = { x: offsetX, y: offsetY };
    
    for (const pastedPoint of pastedPoints) {
      const pointWorld = { x: pastedPoint.x + offsetX, y: pastedPoint.y + offsetY };
      const screenPasted = worldToScreen(pointWorld, context.viewport);
      const hit = hitTest(
        screenPasted,
        pointWorld,
        context.objects,
        context.viewport
      );
      
      if (hit) {
        if (hit.type === "point") {
          const target = context.objects[hit.objectId] as PointObject;
          const dist = Math.hypot(target.x - pointWorld.x, target.y - pointWorld.y);
          if (dist < bestDist) {
            bestDist = dist;
            bestOffset = {
              x: target.x - pastedPoint.x,
              y: target.y - pastedPoint.y
            };
            snapTargetId = hit.objectId;
            snapSourceId = pastedPoint.id;
          }
        } else {
          const closest = getClosestPointOnObject(hit.object, pointWorld, context.objects);
          if (closest) {
            const dist = Math.hypot(closest.x - pointWorld.x, closest.y - pointWorld.y);
            if (dist < bestDist) {
              bestDist = dist;
              bestOffset = {
                x: closest.x - pastedPoint.x,
                y: closest.y - pastedPoint.y
              };
              snapTargetId = hit.objectId;
              snapSourceId = pastedPoint.id;
            }
          }
        }
      }
    }

    if (snapTargetId && snapSourceId) {
      offsetX = bestOffset.x;
      offsetY = bestOffset.y;
      this.snapTargetId = snapTargetId;
      this.snapSourceId = snapSourceId;
    } else {
      offsetX = event.snappedWorldPoint.x - minX;
      offsetY = event.snappedWorldPoint.y - minY;
      this.snapTargetId = null;
      this.snapSourceId = null;
    }

    // We handle rendering the snap indicator ourselves in renderPreview
    // context.setHoveredObject(snapTargetId);

    this.currentOffset = {
      x: offsetX,
      y: offsetY,
    };
    
    this.transitionState("preview", "preview");
  }

  pointerUp(_event: ToolPointerEvent, _context: ToolContext): void {
    // Pasting happens on pointerDown
  }

  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key === "Escape") {
      this.cancel(context);
      context.setActiveTool("select");
    }
  }

  renderPreview(context: ToolContext): ReactNode {
    if (!this.currentOffset) return null;
    const payload = getGeometryClipboardSnapshot();
    if (!payload) return null;

    const ghostObjects: Record<string, any> = { ...context.objects };
    const elements: ReactNode[] = [];
    
    for (const obj of payload.objects) {
      const ghostObj = { ...obj };
      if ('x' in ghostObj) {
        (ghostObj as any).x += this.currentOffset.x;
        (ghostObj as any).y += this.currentOffset.y;
      }
      ghostObjects[ghostObj.id] = ghostObj;
    }

    for (const obj of payload.objects) {
      const ghostObj = ghostObjects[obj.id];
      if (!ghostObj) continue;
      
      elements.push(
        createElement('g', { key: ghostObj.id, style: { opacity: 0.5, pointerEvents: 'none' } },
          geometryRendererRegistry.renderObject(ghostObj, {
            appTheme: "theme1", 
            hoveredObjectId: null,
            objects: ghostObjects as any,
            selectedObjectIds: [],
            viewport: context.viewport,
          })
        )
      );
    }

    if (this.snapTargetId && this.snapSourceId) {
      const snapTarget = context.objects[this.snapTargetId];
      const ghostPoint = ghostObjects[this.snapSourceId] as Point2D;
      if (snapTarget && ghostPoint) {
        const screen = worldToScreen(ghostPoint, context.viewport);
        const isPoint = snapTarget.type === "point";
        
        elements.push(
          createElement("circle", {
            key: "snap-indicator",
            cx: screen.x,
            cy: screen.y,
            fill: isPoint ? "#EF4444" : "#10B981",
            r: 6,
            stroke: isPoint ? "#B91C1C" : "#059669",
            strokeWidth: 1.5,
          })
        );
      }
    }

    return createElement('g', { key: "paste-preview" }, ...elements);
  }

  cancel(_context: ToolContext): void {
    this.currentOffset = null;
    this.transitionState("cancelled", "cancel");
    this.transitionState("waitingInput", "await-input");
  }
}

export const pasteTool = new PasteTool();
