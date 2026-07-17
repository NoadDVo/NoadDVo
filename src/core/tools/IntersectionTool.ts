import {
  getIntersectionPoints,
  type GeometryObject,
  type Point2D,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  getHitIntersectionSource,
  type IntersectionSource,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

function supportsIntersection(
  first: GeometryObject,
  second: GeometryObject,
): boolean {
  const linearTypes = ["line", "segment", "ray"];
  const conicTypes = ["circle", "arc", "ellipse", "elliptical-arc"];
  
  if (linearTypes.includes(first.type) && linearTypes.includes(second.type)) {
    return true;
  }
  
  if (linearTypes.includes(first.type) && conicTypes.includes(second.type)) {
    return true;
  }
  
  if (conicTypes.includes(first.type) && linearTypes.includes(second.type)) {
    return true;
  }
  
  if (conicTypes.includes(first.type) && conicTypes.includes(second.type)) {
    return true;
  }

  return false;
}

function createIntersectionPoint(
  point: Point2D,
  sourceA: IntersectionSource,
  sourceB: IntersectionSource,
  index: number,
  context: ToolContext,
) {
  return createNamedDerivedPoint(point, context.objects, {
    index,
    sourceAId: sourceA.id,
    sourceBId: sourceB.id,
    type: "intersection",
  });
}

export class IntersectionTool extends BaseTool {
  private firstSource = null as IntersectionSource | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "intersection",
      name: "Intersection",
      shortcut: "I",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const source = getHitIntersectionSource(event, context);

    if (!source) {
      context.setHoveredObject(null);

      return;
    }

    if (!this.firstSource) {
      this.firstSource = source;
      context.selectObject(source.id);

      return;
    }

    if (this.firstSource.id === source.id || !supportsIntersection(this.firstSource, source)) {
      return;
    }

    const intersections = getIntersectionPoints(this.firstSource, source, context.objects);

    if (intersections.length === 0) {
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    const createdIds: string[] = [];
    let nextObjects = context.objects;

    context.beginHistoryTransaction("construction", "Create intersection");
    intersections.forEach((point, index) => {
      const constructedPoint = createIntersectionPoint(
        point,
        this.firstSource as IntersectionSource,
        source,
        index,
        { ...context, objects: nextObjects },
      );

      if (context.addObject(constructedPoint)) {
        createdIds.push(constructedPoint.id);
        nextObjects = {
          ...nextObjects,
          [constructedPoint.id]: constructedPoint,
        };
      }
    });

    if (createdIds.length > 0) {
      context.setSelectedObjects(createdIds);
      context.setHoveredObject(createdIds[0] ?? null);
      context.commitHistoryTransaction();
    } else {
      context.cancelHistoryTransaction();
    }

    this.transitionState("completed", "complete");
    this.reset();
    this.transitionState("waitingInput", "await-input");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitIntersectionSource(event, context)?.id ?? null);
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
    this.firstSource = null;
  }
}

export const intersectionTool = new IntersectionTool();
