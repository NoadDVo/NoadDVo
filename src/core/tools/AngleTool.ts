import {
  DEFAULT_GEOMETRY_STYLE,
  isRightAngle,
  pointsAlmostEqual,
  type AngleObject,
  type GeometryObjectRecord,
  type PointObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import { createConstructionId, getHitPoint } from "./ConstructionToolUtils";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

const angleLabels = ["α", "β", "γ", "θ"] as const;

function getNextAngleLabel(objects: GeometryObjectRecord): string {
  const usedLabels = new Set(
    Object.values(objects)
      .filter((object) => object.type === "angle")
      .map((object) => object.label ?? object.name)
      .filter((label): label is string => Boolean(label)),
  );

  for (const label of angleLabels) {
    if (!usedLabels.has(label)) {
      return label;
    }
  }

  return `θ${usedLabels.size - angleLabels.length + 1}`;
}

function hasDuplicateAngle(
  pointAId: string,
  vertexPointId: string,
  pointCId: string,
  objects: GeometryObjectRecord,
): boolean {
  return Object.values(objects).some(
    (object) =>
      object.type === "angle" &&
      object.pointAId === pointAId &&
      object.vertexPointId === vertexPointId &&
      object.pointCId === pointCId,
  );
}

function createAngle(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  objects: GeometryObjectRecord,
): AngleObject {
  const now = Date.now();
  const label = getNextAngleLabel(objects);

  return {
    createdAt: now,
    dependencies: [pointA.id, vertex.id, pointC.id],
    dependents: [],
    id: createConstructionId("angle"),
    label,
    locked: false,
    name: label,
    pointAId: pointA.id,
    pointCId: pointC.id,
    radius: 0.65,
    showLabel: true,
    showRightAngleMarker: isRightAngle(pointA, vertex, pointC),
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "transparent",
      labelVisible: true,
      stroke: "#0b0f14",
      strokeOpacity: 0.92,
      strokeWidth: 2,
    },
    type: "angle",
    updatedAt: now,
    vertexPointId: vertex.id,
    visible: true,
  };
}

export class AngleTool extends BaseTool {
  private pointA = null as PointObject | null;
  private vertex = null as PointObject | null;

  constructor() {
    super({
      cursor: "crosshair",
      id: "angle",
      name: "Angle",
      shortcut: "A",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const point = getHitPoint(event, context);

    if (!point) {
      context.setHoveredObject(null);

      return;
    }

    if (!this.pointA) {
      this.pointA = point;
      context.selectObject(point.id);

      return;
    }

    if (!this.vertex) {
      if (this.pointA.id === point.id || pointsAlmostEqual(this.pointA, point)) {
        return;
      }

      this.vertex = point;
      context.selectObject(point.id);

      return;
    }

    if (
      point.id === this.pointA.id ||
      point.id === this.vertex.id ||
      pointsAlmostEqual(point, this.vertex) ||
      pointsAlmostEqual(point, this.pointA)
    ) {
      return;
    }

    if (hasDuplicateAngle(this.pointA.id, this.vertex.id, point.id, context.objects)) {
      this.reset();
      this.transitionState("waitingInput", "await-input");

      return;
    }

    const angle = createAngle(this.pointA, this.vertex, point, context.objects);

    if (context.addObject(angle)) {
      context.selectObject(angle.id);
      context.setHoveredObject(angle.id);
      this.transitionState("completed", "complete");
      this.reset();
      this.transitionState("waitingInput", "await-input");
    }
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
    this.pointA = null;
    this.vertex = null;
  }
}

export const angleTool = new AngleTool();
