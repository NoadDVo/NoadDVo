import { createElement, type ReactNode } from "react";

import {
  DEFAULT_GEOMETRY_STYLE,
  EPSILON,
  pointsAlmostEqual,
  polygonArea,
  type Point2D,
  type PointObject,
  type PolygonObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { createNamedFreePoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let polygonIdCounter = 0;

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
  return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}

function createPolygonName(vertices: readonly PointObject[]): string {
  const names = vertices.map((vertex) => vertex.name).filter(Boolean);

  return names.length === vertices.length ? `Polygon ${names.join("")}` : "Polygon";
}

function createPolygonId(vertices: readonly PointObject[]): string {
  polygonIdCounter += 1;

  return `polygon-${vertices.map((vertex) => vertex.id).join("-")}-${Date.now().toString(36)}-${polygonIdCounter}`;
}

function createPolygon(vertices: readonly PointObject[]): PolygonObject {
  const now = Date.now();
  const pointIds = vertices.map((vertex) => vertex.id);

  return {
    closed: true,
    createdAt: now,
    dependencies: pointIds,
    dependents: [],
    id: createPolygonId(vertices),
    locked: false,
    name: createPolygonName(vertices),
    pointIds,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      fillOpacity: 0,
      stroke: "#0b0f14",
      strokeOpacity: 1,
      strokeWidth: 2,
    },
    type: "polygon",
    updatedAt: now,
    visible: true,
  };
}

function hasDuplicateConsecutiveVertices(vertices: readonly PointObject[]): boolean {
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];

    if (current && next && current.id === next.id) {
      return true;
    }
  }

  return false;
}

export class PolygonTool extends BaseTool {
  private vertices = [] as PointObject[];
  private previewPoint = null as Point2D | null;

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
      existingPoint.id === firstVertex.id &&
      this.vertices.length >= 3
    ) {
      this.finish(context);

      return;
    }

    const candidateWorldPoint = existingPoint ?? event.snappedWorldPoint;
    const lastVertex = this.vertices.at(-1);

    if (lastVertex && pointsAlmostEqual(lastVertex, candidateWorldPoint)) {
      return;
    }

    const point = existingPoint ?? createNamedFreePoint(candidateWorldPoint, context.objects);

    if (!existingPoint && !context.addObject(point)) {
      return;
    }

    this.vertices = [...this.vertices, point];
    this.previewPoint = point;
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

    this.previewPoint = resolveSnapPoint(event, context);
  }

  keyDown(event: KeyboardEvent, context: ToolContext): void {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    this.finish(context);
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

  renderPreview(context: ToolContext): ReactNode {
    if (this.vertices.length === 0) {
      return null;
    }

    const previewPoints = [
      ...this.vertices,
      ...(this.previewPoint ? [this.previewPoint] : []),
    ].map((point) => worldToScreen(point, context.viewport));

    const path = previewPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const first = previewPoints[0];
    const last = previewPoints.at(-1);

    return createElement(
      "g",
      null,
      previewPoints.length >= 3
        ? createElement("path", {
            d: `${path} Z`,
            fill: "#7ddcff",
            fillOpacity: 0.08,
            stroke: "none",
          })
        : null,
      createElement("path", {
        d: path,
        fill: "none",
        stroke: "#7ddcff",
        strokeDasharray: "7 6",
        strokeLinejoin: "round",
        strokeOpacity: 0.76,
        strokeWidth: 2,
      }),
      first && last && this.vertices.length >= 2
        ? createElement("line", {
            x1: last.x,
            x2: first.x,
            y1: last.y,
            y2: first.y,
            stroke: "#7ddcff",
            strokeDasharray: "3 7",
            strokeOpacity: 0.42,
            strokeWidth: 1.5,
          })
        : null,
    );
  }

  private finish(context: ToolContext): void {
    if (this.vertices.length < 3) {
      return;
    }

    if (
      hasDuplicateConsecutiveVertices(this.vertices) ||
      Math.abs(polygonArea(this.vertices)) <= EPSILON
    ) {
      return;
    }

    const polygon = createPolygon(this.vertices);

    if (context.addObject(polygon)) {
      context.selectObject(polygon.id);
      context.setHoveredObject(polygon.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  private reset(): void {
    this.vertices = [];
    this.previewPoint = null;
  }
}

export const polygonTool = new PolygonTool();
