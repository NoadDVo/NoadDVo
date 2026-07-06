import {
  angleBisectorDirectionPoint,
  incenterPoint,
  midpoint,
  projectPointToLine,
  recomputeConstructedPoint,
  validateGeometryObjects,
  type GeometryObjectRecord,
  type PointObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import {
  createConstructionCircle,
  createConstructionLine,
  createThreePointConstructionCircle,
  getHitPoint,
  hasLineWithEndpoints,
} from "./ConstructionToolUtils";
import { createNamedDerivedPoint } from "./PointTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

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

function addConstructionObjects(
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

export const perpendicularBisectorTool = new PointSequenceConstructionTool({
  description: "Create perpendicular bisector",
  id: "perpendicular-bisector",
  name: "Perpendicular Bisector",
  pointCount: 2,
  shortcut: "B",
  onComplete: ([pointA, pointB], context) => {
    if (!pointA || !pointB) {
      return;
    }

    addConstructionObjects(context, "Create perpendicular bisector", (objects) => {
      const middle = midpoint(pointA, pointB);
      const direction = recomputeConstructedPoint(
        {
          pointAId: pointA.id,
          pointBId: pointB.id,
          type: "perpendicular-bisector-point",
        },
        objects,
      );

      if (!direction) {
        return null;
      }

      const midpointPoint = createNamedDerivedPoint(
        middle,
        objects,
        {
          pointAId: pointA.id,
          pointBId: pointB.id,
          type: "midpoint",
        },
        { namePrefix: hiddenName("M"), visible: false },
      );
      const nextObjects = withObject(objects, midpointPoint);
      const directionPoint = createNamedDerivedPoint(
        direction,
        nextObjects,
        {
          pointAId: pointA.id,
          pointBId: pointB.id,
          type: "perpendicular-bisector-point",
        },
        { namePrefix: hiddenName("PB"), visible: false },
      );
      const line = createConstructionLine(
        midpointPoint,
        directionPoint,
        "Perpendicular Bisector",
      );

      return {
        objects: [midpointPoint, directionPoint, line],
        selectableId: line.id,
      };
    });
  },
});

export const angleBisectorTool = new PointSequenceConstructionTool({
  description: "Create angle bisector",
  id: "angle-bisector",
  name: "Angle Bisector",
  pointCount: 3,
  shortcut: "J",
  onComplete: ([pointA, vertex, pointC], context) => {
    if (!pointA || !vertex || !pointC) {
      return;
    }

    addConstructionObjects(context, "Create angle bisector", (objects) => {
      const direction = angleBisectorDirectionPoint(pointA, vertex, pointC);

      if (!direction) {
        return null;
      }

      const directionPoint = createNamedDerivedPoint(
        direction,
        objects,
        {
          pointAId: pointA.id,
          pointCId: pointC.id,
          type: "angle-bisector-point",
          vertexPointId: vertex.id,
        },
        { namePrefix: hiddenName("AB"), visible: false },
      );

      if (hasLineWithEndpoints(vertex.id, directionPoint.id, objects)) {
        return null;
      }

      const line = createConstructionLine(vertex, directionPoint, "Angle Bisector");

      return {
        objects: [directionPoint, line],
        selectableId: line.id,
      };
    });
  },
});

export const medianTool = new PointSequenceConstructionTool({
  description: "Create median",
  id: "median",
  name: "Median",
  pointCount: 3,
  shortcut: "D",
  onComplete: ([vertex, sideA, sideB], context) => {
    if (!vertex || !sideA || !sideB) {
      return;
    }

    addConstructionObjects(context, "Create median", (objects) => {
      const middle = midpoint(sideA, sideB);
      const midpointPoint = createNamedDerivedPoint(
        middle,
        objects,
        {
          pointAId: sideA.id,
          pointBId: sideB.id,
          type: "midpoint",
        },
        { namePrefix: hiddenName("MED"), visible: false },
      );
      const line = createConstructionLine(vertex, midpointPoint, "Median");

      return {
        objects: [midpointPoint, line],
        selectableId: line.id,
      };
    });
  },
});

export const altitudeTool = new PointSequenceConstructionTool({
  description: "Create altitude",
  id: "altitude",
  name: "Altitude",
  pointCount: 3,
  shortcut: "H",
  onComplete: ([vertex, sideA, sideB], context) => {
    if (!vertex || !sideA || !sideB) {
      return;
    }

    addConstructionObjects(context, "Create altitude", (objects) => {
      const foot = projectPointToLine(vertex, sideA, sideB);

      if (!foot) {
        return null;
      }

      const footPoint = createNamedDerivedPoint(
        foot,
        objects,
        {
          linePointAId: sideA.id,
          linePointBId: sideB.id,
          pointId: vertex.id,
          type: "projection-point",
        },
        { namePrefix: hiddenName("ALT"), visible: false },
      );
      const line = createConstructionLine(vertex, footPoint, "Altitude");

      return {
        objects: [footPoint, line],
        selectableId: line.id,
      };
    });
  },
});

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
