import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  EPSILON,
  pointsAlmostEqual,
  polygonArea,
  type Point2D,
  type PointObject,
  type CompoundRegionObject,
  type BoundarySegment,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import { ToolHistorySession } from "./ToolHistorySession";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let polygonIdCounter = 0;

type PolygonVertex = {
  readonly point: PointObject;
  controlOut?: Point2D;
  controlIn?: Point2D;
};

function getPointFromHit(
  event: ToolPointerEvent,
  context: ToolContext,
): PointObject | null {
  const hit = hitTest(
    event.screenPoint,
    event.worldPoint,
    context.objects,
    context.viewport,
  );

  return hit?.object.type === "point" ? hit.object : null;
}

function resolveSnapPoint(event: ToolPointerEvent, context: ToolContext): Point2D {
  const point = getPointFromHit(event, context);
  context.setHoveredObject(point?.id ?? null);
  return point ?? event.snappedWorldPoint;
}

function createPolygonName(vertices: readonly PolygonVertex[]): string {
  const names = vertices.map((vertex) => vertex.point.name).filter(Boolean);

  return names.length === vertices.length ? `Polygon ${names.join("")}` : "Polygon";
}

function createPolygonId(vertices: readonly PolygonVertex[]): string {
  polygonIdCounter += 1;

  return `polygon-${vertices.map((vertex) => vertex.point.id).join("-")}-${Date.now().toString(36)}-${polygonIdCounter}`;
}

function createPolygon(vertices: readonly PolygonVertex[], context: ToolContext): CompoundRegionObject {
  const now = Date.now();
  const pointIds = vertices.map((vertex) => vertex.point.id);
  
  const segments: BoundarySegment[] = [];
  
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index]!;
    const next = vertices[(index + 1) % vertices.length]!;

    if (current.controlOut || next.controlIn) {
      const cp1 = current.controlOut ?? current.point;
      const cp2 = next.controlIn ?? next.point;
      
      const baseCp1 = createNamedFreePoint(cp1, context.objects);
      const cp1Obj = {
        ...baseCp1,
        style: {
          ...baseCp1.style,
          strokeOpacity: 0.5,
          fillOpacity: 0.5,
          pointSize: 4,
          pointStyle: "hollow" as const,
        },
      };

      const baseCp2 = createNamedFreePoint(cp2, context.objects);
      const cp2Obj = {
        ...baseCp2,
        style: {
          ...baseCp2.style,
          strokeOpacity: 0.5,
          fillOpacity: 0.5,
          pointSize: 4,
          pointStyle: "hollow" as const,
        },
      };
      
      context.addObject(cp1Obj);
      context.addObject(cp2Obj);
      
      segments.push({
        type: "curve",
        startPointId: current.point.id,
        endPointId: next.point.id,
        curveType: "cubic-bezier",
        controlPoints: [cp1Obj.id, cp2Obj.id],
      });
      pointIds.push(cp1Obj.id, cp2Obj.id);
    } else {
      segments.push({
        type: "line",
        startPointId: current.point.id,
        endPointId: next.point.id,
      });
    }
  }

  return {
    closed: true,
    createdAt: now,
    dependencies: pointIds,
    dependents: [],
    id: createPolygonId(vertices),
    locked: false,
    name: createPolygonName(vertices),
    segments,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      fillOpacity: 0,
      stroke: "#ffffff",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
    type: "compound-region",
    updatedAt: now,
    visible: true,
  };
}

function hasDuplicateConsecutiveVertices(vertices: readonly PolygonVertex[]): boolean {
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];

    if (current && next && current.point.id === next.point.id) {
      return true;
    }
  }

  return false;
}

export class PolygonTool extends BaseTool {
  private vertices: PolygonVertex[] = [];
  private previewPoint: Point2D | null = null;
  private isDragging = false;
  private dragStartPoint: Point2D | null = null;
  private draggingControlOut: Point2D | null = null;
  
  private readonly history = new ToolHistorySession("create", "Create polygon");

  constructor() {
    super({
      cursor: "crosshair",
      id: "polygon",
      name: "Polygon",
      shortcut: "G",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const existingPoint = getPointFromHit(event, context);
    const firstVertex = this.vertices[0];

    if (
      existingPoint &&
      firstVertex &&
      existingPoint.id === firstVertex.point.id &&
      this.vertices.length >= 3
    ) {
      this.finish(context);

      return;
    }

    const candidateWorldPoint = existingPoint ?? event.snappedWorldPoint;
    const lastVertex = this.vertices.at(-1);

    if (lastVertex && pointsAlmostEqual(lastVertex.point, candidateWorldPoint)) {
      return;
    }

    const point = existingPoint ?? createNamedFreePoint(candidateWorldPoint, context.objects);

    if (!existingPoint) {
      this.history.ensure(context);
    }

    if (!existingPoint && !context.addObject(point)) {
      this.history.cancel(context);

      return;
    }

    this.vertices = [...this.vertices, { point }];
    this.previewPoint = point;
    this.isDragging = true;
    this.dragStartPoint = event.worldPoint;
    this.draggingControlOut = event.worldPoint;
    
    context.selectObject(point.id);
    context.setHoveredObject(point.id);
    this.transitionState("preview", "preview");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.vertices.length === 0) {
      const hit = hitTest(
        event.screenPoint,
        event.worldPoint,
        context.objects,
        context.viewport,
      );

      context.setHoveredObject(hit?.objectId ?? null);

      return;
    }

    if (this.isDragging) {
      this.draggingControlOut = event.snappedWorldPoint;
    } else {
      this.previewPoint = resolveSnapPoint(event, context);
    }
  }

  pointerUp(_event: ToolPointerEvent, _context: ToolContext): void {
    if (this.isDragging && this.dragStartPoint && this.draggingControlOut) {
      const distance = Math.hypot(
        this.draggingControlOut.x - this.dragStartPoint.x,
        this.draggingControlOut.y - this.dragStartPoint.y
      );
      
      if (distance > EPSILON * 10) {
        const lastVertex = this.vertices.at(-1);
        if (lastVertex) {
          lastVertex.controlOut = this.draggingControlOut;
          
          const dx = this.draggingControlOut.x - lastVertex.point.x;
          const dy = this.draggingControlOut.y - lastVertex.point.y;
          lastVertex.controlIn = {
            x: lastVertex.point.x - dx,
            y: lastVertex.point.y - dy,
          };
        }
      }
    }
    
    this.isDragging = false;
    this.draggingControlOut = null;
    this.dragStartPoint = null;
  }

  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    this.finish(context);
  }

  cancel(context: ToolContext): void {
    this.history.commit(context);
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.transitionState("waitingInput", "await-input");
  }

  deactivate(context: ToolContext): void {
    this.history.commit(context);
    this.reset();
    this.transitionState("cancelled", "cancel");
    this.resetState("reset");
  }

  renderPreview(context: ToolContext): ReactNode {
    if (this.vertices.length === 0) {
      return null;
    }

    const { viewport } = context;
    let d = "";
    const elements: ReactNode[] = [];
    
    for (let i = 0; i < this.vertices.length; i++) {
      const curr = this.vertices[i]!;
      const currScreen = worldToScreen(curr.point, viewport);
      
      let dynamicControlIn = curr.controlIn;
      
      if (this.isDragging && i === this.vertices.length - 1 && this.draggingControlOut) {
        const dx = this.draggingControlOut.x - curr.point.x;
        const dy = this.draggingControlOut.y - curr.point.y;
        dynamicControlIn = {
          x: curr.point.x - dx,
          y: curr.point.y - dy,
        };
      }
      
      if (i === 0) {
        d += `M ${currScreen.x} ${currScreen.y}`;
      } else {
        const prev = this.vertices[i - 1]!;
        if (prev.controlOut || dynamicControlIn) {
          const cp1 = prev.controlOut ?? prev.point;
          const cp2 = dynamicControlIn ?? curr.point;
          const cp1Screen = worldToScreen(cp1, viewport);
          const cp2Screen = worldToScreen(cp2, viewport);
          
          d += ` C ${cp1Screen.x} ${cp1Screen.y}, ${cp2Screen.x} ${cp2Screen.y}, ${currScreen.x} ${currScreen.y}`;
        } else {
          d += ` L ${currScreen.x} ${currScreen.y}`;
        }
      }
      
      if (curr.controlOut) {
        const outScreen = worldToScreen(curr.controlOut, viewport);
        elements.push(
          createElement("line", {
            key: `handle-out-${i}`,
            x1: currScreen.x,
            y1: currScreen.y,
            x2: outScreen.x,
            y2: outScreen.y,
            stroke: "#7ddcff",
            strokeWidth: 1,
          }),
          createElement("circle", {
            key: `handle-out-pt-${i}`,
            cx: outScreen.x,
            cy: outScreen.y,
            r: 3,
            fill: "#7ddcff",
          })
        );
      }
      
      if (curr.controlIn) {
        const inScreen = worldToScreen(curr.controlIn, viewport);
        elements.push(
          createElement("line", {
            key: `handle-in-${i}`,
            x1: currScreen.x,
            y1: currScreen.y,
            x2: inScreen.x,
            y2: inScreen.y,
            stroke: "#7ddcff",
            strokeWidth: 1,
          }),
          createElement("circle", {
            key: `handle-in-pt-${i}`,
            cx: inScreen.x,
            cy: inScreen.y,
            r: 3,
            fill: "#7ddcff",
          })
        );
      }
    }
    
    const lastVertex = this.vertices.at(-1)!;
    const lastScreen = worldToScreen(lastVertex.point, viewport);
    
    if (this.isDragging && this.draggingControlOut) {
      const outScreen = worldToScreen(this.draggingControlOut, viewport);
      elements.push(
        createElement("line", {
          key: "dragging-handle-out",
          x1: lastScreen.x,
          y1: lastScreen.y,
          x2: outScreen.x,
          y2: outScreen.y,
          stroke: "#7ddcff",
          strokeWidth: 1,
        }),
        createElement("circle", {
          key: "dragging-handle-out-pt",
          cx: outScreen.x,
          cy: outScreen.y,
          r: 3,
          fill: "#7ddcff",
        })
      );
      
      const dx = this.draggingControlOut.x - lastVertex.point.x;
      const dy = this.draggingControlOut.y - lastVertex.point.y;
      const inPt = { x: lastVertex.point.x - dx, y: lastVertex.point.y - dy };
      const inScreen = worldToScreen(inPt, viewport);
      
      elements.push(
        createElement("line", {
          key: "dragging-handle-in",
          x1: lastScreen.x,
          y1: lastScreen.y,
          x2: inScreen.x,
          y2: inScreen.y,
          stroke: "#7ddcff",
          strokeWidth: 1,
        }),
        createElement("circle", {
          key: "dragging-handle-in-pt",
          cx: inScreen.x,
          cy: inScreen.y,
          r: 3,
          fill: "#7ddcff",
        })
      );
    } else if (this.previewPoint) {
      const previewScreen = worldToScreen(this.previewPoint, viewport);
      if (lastVertex.controlOut) {
        const cp1Screen = worldToScreen(lastVertex.controlOut, viewport);
        const cp2Screen = previewScreen;
        d += ` C ${cp1Screen.x} ${cp1Screen.y}, ${cp2Screen.x} ${cp2Screen.y}, ${previewScreen.x} ${previewScreen.y}`;
      } else {
        d += ` L ${previewScreen.x} ${previewScreen.y}`;
      }
    }

    elements.unshift(
      createElement("path", {
        key: "preview-path",
        d,
        fill: "none",
        stroke: "#7ddcff",
        strokeDasharray: "7 6",
        strokeLinejoin: "round",
        strokeOpacity: 0.76,
        strokeWidth: 2,
      })
    );
    
    const firstVertex = this.vertices[0]!;
    if (this.vertices.length >= 3 || (this.vertices.length === 2 && !this.isDragging && this.previewPoint)) {
      elements.unshift(
        createElement("path", {
          key: "preview-fill",
          d: d + (this.previewPoint ? ` L ${worldToScreen(firstVertex.point, viewport).x} ${worldToScreen(firstVertex.point, viewport).y}` : "") + " Z",
          fill: "#7ddcff",
          fillOpacity: 0.08,
          stroke: "none",
        })
      );
    }

    if (this.previewPoint && firstVertex && this.vertices.length >= 2) {
      const firstScreen = worldToScreen(firstVertex.point, viewport);
      const previewScreen = worldToScreen(this.previewPoint, viewport);
      
      let closingPath = "";
      // If we hover over first vertex, make a smooth curve if it has controlIn
      if (pointsAlmostEqual(this.previewPoint, firstVertex.point)) {
        if (lastVertex.controlOut || firstVertex.controlIn) {
          const cp1Screen = worldToScreen(lastVertex.controlOut ?? lastVertex.point, viewport);
          const cp2Screen = worldToScreen(firstVertex.controlIn ?? firstVertex.point, viewport);
          closingPath = `M ${previewScreen.x} ${previewScreen.y} C ${cp1Screen.x} ${cp1Screen.y}, ${cp2Screen.x} ${cp2Screen.y}, ${firstScreen.x} ${firstScreen.y}`;
        }
      }
      
      if (!closingPath) {
        closingPath = `M ${previewScreen.x} ${previewScreen.y} L ${firstScreen.x} ${firstScreen.y}`;
      }
      
      elements.push(
        createElement("path", {
          key: "preview-closing-line",
          d: closingPath,
          stroke: "#7ddcff",
          strokeDasharray: "3 7",
          strokeOpacity: 0.42,
          strokeWidth: 1.5,
          fill: "none",
        })
      );
    }

    return createElement("g", null, ...elements);
  }

  private finish(context: ToolContext): void {
    if (this.vertices.length < 3) {
      return;
    }

    if (
      hasDuplicateConsecutiveVertices(this.vertices) ||
      Math.abs(polygonArea(this.vertices.map(v => v.point))) <= EPSILON
    ) {
      this.history.commit(context);

      return;
    }

    const polygon = createPolygon(this.vertices, context);

    if (context.addObject(polygon)) {
      context.selectObject(polygon.id);
      context.setHoveredObject(polygon.id);
      this.history.commit(context);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    } else {
      this.history.commit(context);
    }
  }

  private reset(): void {
    this.vertices = [];
    this.previewPoint = null;
    this.isDragging = false;
    this.draggingControlOut = null;
    this.dragStartPoint = null;
  }
}

export const polygonTool = new PolygonTool();
