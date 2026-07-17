import { BaseTool } from "./BaseTool";
import {
  createConstructionLine,
  getHitPoint,
  getHitLinearSource,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import type { PointObject, SegmentObject, GeometryObjectRecord, GeometryToolId } from "../geometry/types";
import { renderPointSequencePreview, renderPreviewPolyline } from "./ToolPreviewPrimitives";
import { distance, dot, midpoint, vectorFromPoints } from "../geometry/math";
import { EPSILON } from "../geometry/math";
import { addConstructionObjects } from "./AdvancedConstructionTools";

type SpecialLineKind = "altitude" | "median" | "angle-bisector";

type SpecialLineToolOptions = {
  readonly id: GeometryToolId;
  readonly name: string;
  readonly shortcut?: string;
  readonly description: string;
  readonly kind: SpecialLineKind;
};

function hiddenName(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}`;
}

export class SpecialLineTool extends BaseTool {
  private vertex: PointObject | null = null;

  constructor(private readonly options: SpecialLineToolOptions) {
    super({
      cursor: "crosshair",
      id: options.id,
      name: options.name,
      ...(options.shortcut ? { shortcut: options.shortcut } : {}),
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    if (!this.vertex) {
      const point = getHitPoint(event, context);
      if (point) {
        this.vertex = point;
        context.setSelectedObjects([point.id]);
        this.transitionState("waitingInput", "await-input");
      }
      return;
    }

    const hitObject = getHitLinearSource(event, context);
    if (hitObject?.type === "segment") {
      const segment = hitObject as SegmentObject;
      const vertex = this.vertex;
      
      addConstructionObjects(context, this.options.name, (objects) => {
        let constructionDef: any;
        let prefix: string;
        
        if (this.options.kind === "altitude") {
          constructionDef = {
            type: "special-line-projection",
            vertexId: vertex.id,
            segmentId: segment.id,
          };
          prefix = "ALT";
        } else if (this.options.kind === "median") {
          constructionDef = {
            type: "special-line-midpoint",
            segmentId: segment.id,
          };
          prefix = "MED";
        } else {
          constructionDef = {
            type: "special-line-bisector",
            vertexId: vertex.id,
            segmentId: segment.id,
          };
          prefix = "BIS";
        }

        const dependentPoint = createNamedDerivedPoint(
          { x: 0, y: 0 }, 
          objects,
          constructionDef,
          { visible: true }
        );
        
        const now = Date.now();
        const lineId = `segment-${Date.now().toString(36)}`;
        const line: SegmentObject = {
          createdAt: now,
          dependencies: [vertex.id, dependentPoint.id],
          dependents: [],
          endPointId: dependentPoint.id,
          id: lineId,
          locked: false,
          startPointId: vertex.id,
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
          specialLineKind: this.options.kind,
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
    if (!this.vertex) {
      context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
    } else {
      const hitObject = getHitLinearSource(event, context);
      if (hitObject?.type === "segment") {
        context.setHoveredObject(hitObject.id);
      } else {
        context.setHoveredObject(null);
      }
    }
  }

  renderPreview(context: ToolContext) {
    if (!this.vertex) {
      return null;
    }

    const elements: React.ReactNode[] = [];
    
    // Draw dot for the selected vertex
    elements.push(renderPointSequencePreview({
      points: [this.vertex],
      pointerWorld: context.pointerWorld,
      viewport: context.viewport,
    }));

    const hoveredId = context.hoveredObjectId;
    if (hoveredId) {
      const segment = context.objects[hoveredId];
      if (segment?.type === "segment") {
        const dependentCoord = this.calculateDependentPoint(this.vertex, segment as SegmentObject, context.objects);
        if (dependentCoord) {
          // Render dashed line preview
          elements.push(
            renderPreviewPolyline({
              points: [this.vertex, dependentCoord],
              viewport: context.viewport,
            })
          );
        }
      }
    }

    return elements;
  }

  private calculateDependentPoint(vertex: PointObject, segment: SegmentObject, objects: GeometryObjectRecord) {
    const b = objects[segment.startPointId];
    const c = objects[segment.endPointId];
    if (b?.type !== "point" || c?.type !== "point") return null;

    if (this.options.kind === "altitude") {
      const u = vectorFromPoints(b, c);
      const v = vectorFromPoints(b, vertex);
      const uLenSq = u.x * u.x + u.y * u.y;
      if (uLenSq <= EPSILON) return null;
      const scalar = dot(v, u) / uLenSq;
      return {
        x: b.x + scalar * u.x,
        y: b.y + scalar * u.y,
      };
    }

    if (this.options.kind === "median") {
      return midpoint(b, c);
    }

    if (this.options.kind === "angle-bisector") {
      const dAB = distance(vertex, b);
      const dAC = distance(vertex, c);
      const sum = dAB + dAC;
      if (sum <= EPSILON) return null;
      return {
        x: (dAC * b.x + dAB * c.x) / sum,
        y: (dAC * b.y + dAB * c.y) / sum,
      };
    }

    return null;
  }

  reset(): void {
    this.vertex = null;
    this.transitionState("idle", "await-input");
  }
}

export const altitudeTool = new SpecialLineTool({
  id: "altitude",
  name: "Altitude",
  shortcut: "H",
  description: "Create altitude",
  kind: "altitude",
});

export const medianTool = new SpecialLineTool({
  id: "median",
  name: "Median",
  shortcut: "D",
  description: "Create median",
  kind: "median",
});


