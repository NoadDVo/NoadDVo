import {
  incenterPoint,
  projectPointToLine,
  validateGeometryObjects,
  type GeometryObjectRecord,
  type PointObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  createConstructionCircle,
  createThreePointConstructionCircle,
  getHitPoint,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { renderPointSequencePreview } from "./ToolPreviewPrimitives";

type ConstructionCompleteHandler = (
  points: readonly PointObject[],
  context: ToolContext,
) => void;

type PointSequenceConstructionToolOptions = {
  readonly id:
    | "perpendicular-bisector"
    | "angle-bisector"
    | "median"
    | "altitude"
    | "circumcircle"
    | "incircle";
  readonly name: string;
  readonly pointCount: number;
  readonly shortcut: string;
  readonly description: string;
  readonly onComplete: ConstructionCompleteHandler;
};

function hiddenName(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}`;
}

function withObject(
  objects: GeometryObjectRecord,
  point: PointObject,
): GeometryObjectRecord {
  return {
    ...objects,
    [point.id]: point,
  };
}

class PointSequenceConstructionTool extends BaseTool {
  private points: PointObject[] = [];

  constructor(private readonly options: PointSequenceConstructionToolOptions) {
    super({
      cursor: "crosshair",
      id: options.id,
      name: options.name,
      shortcut: options.shortcut,
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const point = getHitPoint(event, context);

    if (!point || this.points.some((selected) => selected.id === point.id)) {
      return;
    }

    this.points = [...this.points, point];
    context.setSelectedObjects(this.points.map((selected) => selected.id));
    this.transitionState(
      this.points.length >= this.options.pointCount ? "completed" : "waitingInput",
      this.points.length >= this.options.pointCount ? "complete" : "await-input",
    );

    if (this.points.length < this.options.pointCount) {
      return;
    }

    this.options.onComplete(this.points, context);
    this.reset();
    this.transitionState("waitingInput", "await-input");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    context.setHoveredObject(getHitPoint(event, context)?.id ?? null);
  }

  renderPreview(context: ToolContext) {
    return renderPointSequencePreview({
      pointerWorld: context.pointerWorld,
      points: this.points,
      viewport: context.viewport,
    });
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

export function addConstructionObjects(
  context: ToolContext,
  description: string,
  createObjects: (objects: GeometryObjectRecord) => {
    readonly selectableId: string;
    readonly objects: readonly Parameters<ToolContext["addObject"]>[0][];
  } | null,
): void {
  const result = createObjects(context.objects);

  if (!result) {
    return;
  }

  const nextObjects = {
    ...context.objects,
    ...Object.fromEntries(result.objects.map((object) => [object.id, object])),
  };
  const validation = validateGeometryObjects(nextObjects);

  if (!validation.valid) {
    return;
  }

  context.beginHistoryTransaction("construction", description);

  for (const object of result.objects) {
    if (!context.addObject(object)) {
      context.cancelHistoryTransaction();

      return;
    }
  }

  context.selectObject(result.selectableId);
  context.setHoveredObject(result.selectableId);
  context.commitHistoryTransaction();
}




export const circumcircleTool = new PointSequenceConstructionTool({
  description: "Create circumcircle",
  id: "circumcircle",
  name: "Circumcircle",
  pointCount: 3,
  shortcut: "U",
  onComplete: ([pointA, pointB, pointC], context) => {
    if (!pointA || !pointB || !pointC) {
      return;
    }

    addConstructionObjects(context, "Create circumcircle", () => {
      const circle = createThreePointConstructionCircle(
        pointA,
        pointB,
        pointC,
        "Circumcircle",
      );

      return {
        objects: [circle],
        selectableId: circle.id,
      };
    });
  },
});

export const incircleTool = new PointSequenceConstructionTool({
  description: "Create incircle",
  id: "incircle",
  name: "Incircle",
  pointCount: 3,
  shortcut: "Q",
  onComplete: ([pointA, pointB, pointC], context) => {
    if (!pointA || !pointB || !pointC) {
      return;
    }

    addConstructionObjects(context, "Create incircle", (objects) => {
      const center = incenterPoint(pointA, pointB, pointC);

      if (!center) {
        return null;
      }

      const centerPoint = createNamedDerivedPoint(
        center,
        objects,
        {
          pointAId: pointA.id,
          pointBId: pointB.id,
          pointCId: pointC.id,
          type: "incenter",
        },
        { namePrefix: hiddenName("I"), visible: false },
      );
      const nextObjects = withObject(objects, centerPoint);
      const radiusPoint = createNamedDerivedPoint(
        projectPointToLine(center, pointA, pointB) ?? center,
        nextObjects,
        {
          centerPointId: centerPoint.id,
          sidePointAId: pointA.id,
          sidePointBId: pointB.id,
          type: "inradius-point",
        },
        { namePrefix: hiddenName("IR"), visible: false },
      );
      const circle = createConstructionCircle(centerPoint, radiusPoint, "Incircle");

      return {
        objects: [centerPoint, radiusPoint, circle],
        selectableId: circle.id,
      };
    });
  },
});
