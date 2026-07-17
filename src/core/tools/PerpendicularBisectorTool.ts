import { BaseTool } from "./BaseTool";
import {
  getHitPoint,
  getHitLinearSource,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import type { PointObject, GeometryObjectRecord } from "../geometry/types";
import { renderPointSequencePreview, renderPreviewPolyline } from "./ToolPreviewPrimitives";
import { distance, midpoint, vectorFromPoints, normalize, dot, EPSILON } from "../geometry/math";
import { addConstructionObjects } from "./AdvancedConstructionTools";

export class PerpendicularBisectorTool extends BaseTool {
  private points: PointObject[] = [];

  constructor() {
    super({
      cursor: "crosshair",
      id: "perpendicular-bisector",
      name: "Perpendicular Bisector",
      shortcut: "P",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (this.points.length < 2) {
      const point = getHitPoint(event, context);
      if (point && !this.points.find(p => p.id === point.id)) {
        this.points.push(point);
        context.setSelectedObjects(this.points.map(p => p.id));
        this.transitionState("waitingInput", "await-input");
      }
      return;
    }

    // 3rd step: Segment or Line only
    const hitObject = getHitLinearSource(event, context);
    if (hitObject && (hitObject.type === "segment" || hitObject.type === "line" || hitObject.type === "ray")) {
      addConstructionObjects(context, this.name, (objects) => {
        const a = this.points[0];
        const b = this.points[1];
        if (!a || !b) return null;
        const constructionDef = {
          type: "perpendicular-bisector-endpoint" as const,
          pointAId: a.id,
          pointBId: b.id,
          limitObjectId: hitObject.id,
        };

        const m = midpoint(a, b);
        const midpointPoint = createNamedDerivedPoint(
          m,
          objects,
          {
            type: "midpoint",
            pointAId: a.id,
            pointBId: b.id,
          },
          { visible: false }
        );

        const nextObjects = { ...objects, [midpointPoint.id]: midpointPoint };

        const initialCoord = this.calculateDependentPoint(a, b, hitObject, objects) ?? { x: 0, y: 0 };
        const dependentPoint = createNamedDerivedPoint(
          initialCoord,
          nextObjects,
          constructionDef,
          { visible: false }
        );
        
        const now = Date.now();
        const line: any = {
          createdAt: now,
          dependencies: [midpointPoint.id, dependentPoint.id],
          dependents: [],
          endPointId: dependentPoint.id,
          id: `segment-${Date.now().toString(36)}`,
          locked: false,
          startPointId: midpointPoint.id,
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
          specialLineKind: "perpendicular-bisector-3step",
        };

        return {
          objects: [midpointPoint, dependentPoint, line],
          selectableId: line.id,
        };
      });

      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    if (this.points.length < 2) {
      const hitPoint = getHitPoint(event, context);
      context.setHoveredObject(hitPoint?.id ?? null);
    } else {
      // Step 3: only segment/line targets
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

    if (this.points.length === 2) {
      const hoveredId = context.hoveredObjectId;
      if (hoveredId) {
        const limitObj = context.objects[hoveredId];
        if (limitObj?.type === "segment" || limitObj?.type === "line" || limitObj?.type === "ray") {
          const pA = this.points[0];
          const pB = this.points[1];
          if (pA && pB) {
            const dependentCoord = this.calculateDependentPoint(pA, pB, limitObj, context.objects);
            if (dependentCoord) {
              const m = midpoint(pA, pB);
              elements.push(
                renderPreviewPolyline({
                  points: [m, dependentCoord],
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

  private calculateDependentPoint(a: PointObject, b: PointObject, limitObj: any, objects: GeometryObjectRecord) {
    const m = midpoint(a, b);
    const dir = vectorFromPoints(m, b);
    let perp = normalize({ x: -dir.y, y: dir.x });

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
      const toMidE = vectorFromPoints(m, midpoint(e1, e2));
      if (dot(perp, toMidE) < 0) {
        perp = { x: -perp.x, y: -perp.y };
      }
      
      const r = perp;
      const s = vectorFromPoints(e1, e2);
      const denominator = r.x * s.y - r.y * s.x;

      if (Math.abs(denominator) > EPSILON) {
        const cMinusA = vectorFromPoints(m, e1);
        const t = (cMinusA.x * s.y - cMinusA.y * s.x) / denominator;
        return { x: m.x + r.x * t, y: m.y + r.y * t };
      }

      // Parallel fallback
      const dist = distance(m, midpoint(e1, e2));
      return { x: m.x + perp.x * dist, y: m.y + perp.y * dist };
    }
    return null;
  }

  reset(): void {
    this.points = [];
    this.transitionState("idle", "await-input");
  }
}

export const perpendicularBisectorTool = new PerpendicularBisectorTool();
