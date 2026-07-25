import { createElement } from "react";

import { DEFAULT_GEOMETRY_STYLE } from "../geometry";
import type { PolynomialObject, PointObject } from "../geometry/types";
import { BaseTool } from "./BaseTool";
import { createConstructionId, getHitPoint } from "./ConstructionToolUtils";
import { createNamedFreePoint } from "./PointTool";
import { renderPreviewPoint } from "./ToolPreviewPrimitives";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { evaluateLagrange } from "../geometry";
import { worldToScreen } from "../geometry/viewport";

export class PolynomialTool extends BaseTool {
  private points: PointObject[] = [];

  constructor() {
    super({
      cursor: "crosshair",
      id: "polynomial",
      name: "Polynomial",
      shortcut: "",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    let point = getHitPoint(event, context);
    if (!point) {
      point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
      context.addObject(point);
    }
    
    // Prevent adding the exact same point twice consecutively
    if (this.points.length > 0 && this.points[this.points.length - 1]!.id === point.id) {
       // if it's a double click on the same point, we finish it
       this.finish(context);
       return;
    }

    this.points.push(point);
    context.selectObject(point.id);
    this.transitionState("waitingInput", "await-input");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }
  
  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key === "Enter" || event.key === "Escape") {
       this.finish(context);
    }
  }

  private finish(context: ToolContext) {
    if (this.points.length >= 2) {
      const now = Date.now();
      const constructedPolynomial: PolynomialObject = {
        createdAt: now,
        dependencies: this.points.map(p => p.id),
        dependents: [],
        pointIds: this.points.map(p => p.id),
        id: createConstructionId("polynomial"),
        locked: false,
        style: {
          ...DEFAULT_GEOMETRY_STYLE,
          fill: "transparent",
        },
        type: "polynomial",
        updatedAt: now,
        visible: true,
      };

      if (context.addObject(constructedPolynomial)) {
        context.selectObject(constructedPolynomial.id);
        context.setHoveredObject(constructedPolynomial.id);
      }
    }
    
    this.reset();
    this.transitionState("completed", "complete");
    this.transitionState("waitingInput", "await-input");
  }

  renderPreview(context: ToolContext) {
    if (this.points.length === 0) {
      return null;
    }
    
    const elements = [];
    
    for (let i = 0; i < this.points.length; i++) {
        elements.push(
          renderPreviewPoint({
            point: this.points[i]!,
            r: 4,
            viewport: context.viewport,
          })
        );
    }
    
    if (this.points.length >= 2) {
      const { viewport } = context;
      const numSamples = 100;
      let minX = Infinity;
      let maxX = -Infinity;
      for (const p of this.points) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
      }
      
      if (minX === Infinity || minX === maxX) {
        return createElement(
          "g",
          { key: "polynomial-preview" },
          elements
        );
      }
      
      const step = (maxX - minX) / numSamples;
      const pathPoints: string[] = [];
      
      for (let i = 0; i <= numSamples; i++) {
        const x = minX + i * step;
        const y = evaluateLagrange(x, this.points);
        if (!Number.isNaN(y) && isFinite(y)) {
          const screenP = worldToScreen({ x, y }, viewport);
          if (pathPoints.length === 0) {
            pathPoints.push(`M ${screenP.x} ${screenP.y}`);
          } else {
            pathPoints.push(`L ${screenP.x} ${screenP.y}`);
          }
        }
      }
      
      if (pathPoints.length > 0) {
        elements.push(
          createElement("path", {
            key: "preview-path",
            d: pathPoints.join(" "),
            fill: "none",
            stroke: "#94a3b8",
            strokeWidth: 2,
            strokeDasharray: "4,4",
            pointerEvents: "none",
          })
        );
      }
    }

    return createElement("g", null, ...elements);
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
    this.points = [];
  }
}

export const polynomialTool = new PolynomialTool();
