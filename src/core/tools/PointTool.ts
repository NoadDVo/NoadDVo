import {
  DEFAULT_GEOMETRY_STYLE,
  type ConstructionDefinition,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let pointIdCounter = 0;

function getNextPointName(objects: GeometryObjectRecord): string {
  const usedNames = new Set(
    Object.values(objects)
      .filter((object) => object.type === "point" && object.name)
      .map((object) => object.name),
  );

  for (let index = 0; index < Number.MAX_SAFE_INTEGER; index += 1) {
    const letter = String.fromCharCode(65 + (index % 26));
    const suffix = Math.floor(index / 26);
    const name = suffix === 0 ? letter : `${letter}${suffix}`;

    if (!usedNames.has(name)) {
      return name;
    }
  }

  return `P${Object.keys(objects).length + 1}`;
}

function createPointId(name: string): string {
  pointIdCounter += 1;

  return `point-${name.toLowerCase()}-${Date.now().toString(36)}-${pointIdCounter}`;
}

export function createNamedFreePoint(
  point: Point2D,
  objects: GeometryObjectRecord,
): PointObject {
  const name = getNextPointName(objects);
  const now = Date.now();

  return {
    createdAt: now,
    dependencies: [],
    dependents: [],
    id: createPointId(name),
    locked: false,
    name,
    pointKind: "free",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#0b0f14",
      pointSize: 5,
      stroke: "#0b0f14",
      strokeWidth: 2,
    },
    type: "point",
    updatedAt: now,
    visible: true,
    x: point.x,
    y: point.y,
  };
}

export function createNamedDerivedPoint(
  point: Point2D,
  objects: GeometryObjectRecord,
  construction: ConstructionDefinition,
  options: {
    readonly visible?: boolean;
    readonly namePrefix?: string;
  } = {},
): PointObject {
  const name = options.namePrefix ?? getNextPointName(objects);
  const now = Date.now();

  pointIdCounter += 1;

  return {
    construction,
    createdAt: now,
    dependencies: Object.values(construction).filter(
      (value): value is string => typeof value === "string" && value !== construction.type,
    ),
    dependents: [],
    id: `point-${name.toLowerCase()}-${Date.now().toString(36)}-${pointIdCounter}`,
    locked: false,
    name,
    pointKind: "derived",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#f8fafc",
      pointSize: 5,
      stroke: "#747b84",
      strokeWidth: 2,
    },
    type: "point",
    updatedAt: now,
    visible: options.visible ?? true,
    x: point.x,
    y: point.y,
  };
}

export class PointTool extends BaseTool {
  constructor() {
    super({
      cursor: "crosshair",
      id: "point",
      name: "Point",
      shortcut: "P",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);

    if (context.addObject(point)) {
      context.selectObject(point.id);
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
    }
  }

  cancel(context: ToolContext): void {
    super.cancel(context);
  }
}

export const pointTool = new PointTool();
