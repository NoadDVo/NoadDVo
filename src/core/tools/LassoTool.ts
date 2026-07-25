import { createElement, type ReactNode } from "react";
import type { GeometryObject, Point2D } from "../geometry/types";
import { isPointInPolygon, getPolygonPoints, getCircleGeometry, getArcGeometry } from "../geometry";
import { getEllipseGeometry } from "../geometry/conicGeometry";
import { getEllipticalArcGeometry, getPointObject } from "../geometry/derivedGeometry";
import { worldToScreen } from "../geometry/viewport";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

function getElementKeyPoints(element: GeometryObject, context: ToolContext): Point2D[] {
  const pts: Point2D[] = [];
  const objects = context.objects;

  switch (element.type) {
    case "point":
      pts.push({ x: element.x, y: element.y });
      break;
    case "segment":
    case "vector": {
      const p1 = getPointObject(objects, element.startPointId);
      const p2 = getPointObject(objects, element.endPointId);
      if (p1 && p2) {
        pts.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
      }
      break;
    }
    case "line": {
      const p1 = getPointObject(objects, element.pointAId);
      const p2 = getPointObject(objects, element.pointBId);
      if (p1 && p2) {
        pts.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
      }
      break;
    }
    case "ray": {
      const p1 = getPointObject(objects, element.startPointId);
      const p2 = getPointObject(objects, element.throughPointId);
      if (p1 && p2) {
        pts.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
      }
      break;
    }
    case "circle": {
      const geom = getCircleGeometry(element, objects);
      if (geom) pts.push(geom.center);
      break;
    }
    case "arc": {
      const geom = getArcGeometry(element, objects);
      if (geom) pts.push(geom.center);
      break;
    }
    case "elliptical-arc": {
      const geom = getEllipticalArcGeometry(element, objects);
      if (geom) pts.push(geom.center);
      break;
    }
    case "polygon": {
      const polyPts = getPolygonPoints(element, objects);
      if (polyPts && polyPts.length > 0) {
        let cx = 0, cy = 0;
        for (const p of polyPts) {
          cx += p.x;
          cy += p.y;
          pts.push({ x: p.x, y: p.y });
        }
        pts.push({ x: cx / polyPts.length, y: cy / polyPts.length });
      }
      break;
    }
    case "angle": {
      const p2 = getPointObject(objects, element.vertexPointId);
      if (p2) pts.push({ x: p2.x, y: p2.y });
      break;
    }
    case "text":
    case "image":
    case "slider":
      pts.push({ x: element.x, y: element.y });
      break;
    case "ellipse":
    case "hyperbola": {
      const geom = getEllipseGeometry(element as any, objects);
      if (geom) pts.push(geom.center);
      break;
    }
    case "polynomial": {
      const polyPts = getPolygonPoints({ ...element, closed: false } as any, objects);
      if (polyPts && polyPts.length > 0) {
        pts.push(polyPts[Math.floor(polyPts.length / 2)]!);
      }
      break;
    }
    case "region": {
      const r = element as any;
      let cx = 0, cy = 0;
      let count = 0;
      
      const pointIds = (r.boundaryPointIds && r.boundaryPointIds.length > 0) 
        ? r.boundaryPointIds 
        : (r.dependencies || []);
        
      for (const id of pointIds) {
        const depObj = objects[id];
        if (depObj) {
          const depPts = getElementKeyPoints(depObj, context);
          for (const pt of depPts) {
            cx += pt.x;
            cy += pt.y;
            count++;
            pts.push({ x: pt.x, y: pt.y });
          }
        }
      }
      
      if (count > 0) {
        pts.push({ x: cx / count, y: cy / count });
      }
      break;
    }
    case "area": {
      const polygon = objects[(element as any).polygonId];
      if (polygon && polygon.type === "polygon") {
        const polyPts = getPolygonPoints(polygon, objects);
        if (polyPts && polyPts.length > 0) {
          let cx = 0, cy = 0;
          for (const p of polyPts) {
            cx += p.x;
            cy += p.y;
          }
          pts.push({ x: cx / polyPts.length, y: cy / polyPts.length });
        }
      }
      break;
    }
    case "distance": {
      const d = element as any;
      if (d.distanceKind === "two-points" && d.pointAId && d.pointBId) {
        const p1 = getPointObject(objects, d.pointAId);
        const p2 = getPointObject(objects, d.pointBId);
        if (p1 && p2) {
          pts.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
        }
      } else if (d.distanceKind === "segment" && d.segmentId) {
        const seg = objects[d.segmentId] as any;
        if (seg && seg.type === "segment") {
          const p1 = getPointObject(objects, seg.startPointId);
          const p2 = getPointObject(objects, seg.endPointId);
          if (p1 && p2) {
            pts.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 });
          }
        }
      }
      break;
    }
  }

  return pts;
}

export class LassoTool extends BaseTool {
  private points: Point2D[] = [];
  private isDrawing = false;

  constructor() {
    super({
      cursor: "crosshair",
      id: "lasso",
      name: "Lasso",
      shortcut: "L",
    });
  }

  pointerDown(event: ToolPointerEvent, _context: ToolContext): void {
    if (event.button !== 0) return;
    
    this.isDrawing = true;
    this.points = [event.worldPoint];
    this.transitionState("preview", "preview");
  }

  pointerMove(event: ToolPointerEvent, _context: ToolContext): void {
    if (!this.isDrawing) return;

    this.points.push(event.worldPoint);
  }

  pointerUp(_event: ToolPointerEvent, context: ToolContext): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    
    if (this.points.length > 2) {
      this.points.push(this.points[0]!);
      
      const exactPoints = this.points;
      
      if (exactPoints.length > 2) {
        const selectedIds: string[] = [];
        
        for (const object of Object.values(context.objects)) {
          if (!object.visible) continue;
          
          const keyPts = getElementKeyPoints(object, context);
          
          for (const pt of keyPts) {
            if (isPointInPolygon(pt, exactPoints)) {
              selectedIds.push(object.id);
              break;
            }
          }
        }
        
        if (selectedIds.length > 0) {
          context.setSelectedObjects(selectedIds);
        }
      }
    }
    
    this.points = [];
    this.transitionState("completed", "complete");
    this.transitionState("waitingInput", "await-input");
  }

  renderPreview(context: ToolContext): ReactNode {
    if (this.points.length < 2) return null;
    
    const screenPts = this.points.map((p) => worldToScreen(p, context.viewport));
    const d = `M ${screenPts.map((p) => `${p.x},${p.y}`).join(" L ")}`;
    
    return createElement("path", {
      key: "lasso-preview",
      d,
      fill: "transparent",
      stroke: "#3b82f6",
      strokeWidth: 1.5,
      strokeDasharray: "5,5",
      pointerEvents: "none",
    });
  }

  cancel(_context: ToolContext): void {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.points = [];
      this.transitionState("cancelled", "cancel");
      this.transitionState("waitingInput", "await-input");
    }
  }

  deactivate(context: ToolContext): void {
    this.cancel(context);
    this.resetState("reset");
  }
}

export const lassoTool = new LassoTool();
