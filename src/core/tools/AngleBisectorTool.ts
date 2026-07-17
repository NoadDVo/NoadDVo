import { BaseTool } from "./BaseTool";
import {
  createConstructionLine,
  getHitPoint,
  getHitLinearSource,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import type { PointObject, GeometryObjectRecord } from "../geometry/types";
import { renderPointSequencePreview, renderPreviewPolyline } from "./ToolPreviewPrimitives";
import { distance, midpoint, vectorFromPoints, normalize } from "../geometry/math";
import { EPSILON } from "../geometry/math";
import { addConstructionObjects } from "./AdvancedConstructionTools";
import { lineLineIntersection } from "../geometry/constructions/ConstructionAlgorithms";

function hiddenName(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}`;
}

export class AngleBisectorTool extends BaseTool {
  private points: PointObject[] = [];

  constructor() {
    super({
      cursor: "crosshair",
      id: "angle-bisector",
      name: "Angle Bisector",
      shortcut: "B",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (this.points.length < 3) {
      const point = getHitPoint(event, context);
      if (point && !this.points.find(p => p.id === point.id)) {
        this.points.push(point);
        context.setSelectedObjects(this.points.map(p => p.id));
        this.transitionState("waitingInput", "await-input");
      }
      return;
    }

    // 4th step: Segment or Line only
    const hitObject = getHitLinearSource(event, context);
    if (hitObject && (hitObject.type === "segment" || hitObject.type === "line" || hitObject.type === "ray")) {
      addConstructionObjects(context, this.name, (objects) => {
        const a = this.points[0];
        const b = this.points[1];
        const c = this.points[2];
        if (!a || !b || !c) return null;
        const constructionDef = {
          type: "angle-bisector-endpoint" as const,
          pointAId: a.id,
          pointBId: b.id,
          pointCId: c.id,
          limitObjectId: hitObject.id,
        };

        const initialCoord = this.calculateDependentPoint(a, b, c, hitObject, objects) ?? { x: 0, y: 0 };
        const dependentPoint = createNamedDerivedPoint(
          initialCoord, 
          objects,
          constructionDef,
          { visible: true }
        );
        
        const now = Date.now();
        const line: any = {
          createdAt: now,
          dependencies: [b.id, dependentPoint.id],
          dependents: [],
          endPointId: dependentPoint.id,
          id: `segment-${Date.now().toString(36)}`,
          locked: false,
          startPointId: b.id,
          style: {
            stroke: "#0b0f14",
            strokeWidth: 2,
            strokeOpacity: 1,
            fill: "transparent",
            fillOpacity: 0,
            dash: "solid",
            pointSize: 5,
            labelVisible: true,
            labelPosition: "above-right",
            labelSize: 12,
          },
          type: "segment",
          updatedAt: now,
          visible: true,
          lineKind: "angle-bisector-4step",
          specialLineKind: "angle-bisector",
        };

        return {
          objects: [dependentPoint, line],
          selectableId: line.id,
        };
      });

      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.points.length < 3) {
      context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
    } else {
      // Step 4: only segment/line targets
      const hitObject = getHitLinearSource(event, context);
      if (hitObject && (hitObject.type === "segment" || hitObject.type === "line" || hitObject.type === "ray")) {
        context.setHoveredObject(hitObject.id);
      } else {
        context.setHoveredObject(null);
      }
    }
  }

  renderPreview(context: ToolContext) {
    if (this.points.length === 0) {
      return null;
    }

    const elements: React.ReactNode[] = [];
    
    // Draw dots for the selected points
    elements.push(renderPointSequencePreview({
      points: this.points,
      pointerWorld: context.pointerWorld,
      viewport: context.viewport,
    }));

    if (this.points.length === 3) {
      const hoveredId = context.hoveredObjectId;
      if (hoveredId) {
        const limitObj = context.objects[hoveredId];
        if (limitObj?.type === "segment" || limitObj?.type === "line" || limitObj?.type === "ray") {
          const pA = this.points[0];
          const pB = this.points[1];
          const pC = this.points[2];
          if (pA && pB && pC) {
            const dependentCoord = this.calculateDependentPoint(pA, pB, pC, limitObj, context.objects);
            if (dependentCoord) {
              elements.push(
                renderPreviewPolyline({
                  points: [pB, dependentCoord],
                  viewport: context.viewport,
                })
              );
            }
          }
        }
      }
    }

    return elements;
  }

  private calculateDependentPoint(a: PointObject, b: PointObject, c: PointObject, limitObj: any, objects: GeometryObjectRecord) {
    const u = normalize(vectorFromPoints(b, a));
    const v = normalize(vectorFromPoints(b, c));
    let w = normalize({ x: u.x + v.x, y: u.y + v.y });
    if (Math.abs(w.x) < EPSILON && Math.abs(w.y) < EPSILON) {
      w = { x: -u.y, y: u.x };
    }

    // Only segment/line supported now
    const resolveEndpoints = (obj: any): [any, any] | null => {
      if (obj.type === "segment") {
        const e1 = objects[obj.startPointId];
        const e2 = objects[obj.endPointId];
        return e1?.type === "point" && e2?.type === "point" ? [e1, e2] : null;
      } else if (obj.type === "line" || obj.type === "ray") {
        const e1 = objects[obj.pointAId];
        const e2 = objects[obj.pointBId || obj.throughPointId];
        return e1?.type === "point" && e2?.type === "point" ? [e1, e2] : null;
      }
      return null;
    };

    const endpoints = resolveEndpoints(limitObj);
    if (endpoints) {
      const [e1, e2] = endpoints;
      const intersection = lineLineIntersection(b, { x: b.x + w.x, y: b.y + w.y }, e1, e2);
      if (intersection) return intersection.point;
      // Fallback: use midpoint distance
      const mid = midpoint(e1, e2);
      const dist = distance(b, mid);
      return { x: b.x + w.x * dist, y: b.y + w.y * dist };
    }
    return null;
  }

  reset(): void {
    this.points = [];
    this.transitionState("idle", "await-input");
  }
}

export const angleBisectorTool = new AngleBisectorTool();
