import {
  DEFAULT_GEOMETRY_STYLE,
  getPolygonPoints,
  isPointInPolygon,
  polygonArea,
  type GeometryObjectRecord,
  type Point2D,
  type PolygonObject,
  type RegionObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let regionIdCounter = 0;

function sameBoundary(
  firstBoundary: readonly string[],
  secondBoundary: readonly string[],
): boolean {
  return (
    firstBoundary.length === secondBoundary.length &&
    firstBoundary.every((pointId, index) => secondBoundary[index] === pointId)
  );
}

function polygonContainsPoint(
  polygon: PolygonObject,
  point: Point2D,
  objects: GeometryObjectRecord,
): boolean {
  const points = getPolygonPoints(polygon, objects);

  return points ? isPointInPolygon(point, points) : false;
}

function polygonAreaMagnitude(
  polygon: PolygonObject,
  objects: GeometryObjectRecord,
): number {
  const points = getPolygonPoints(polygon, objects);

  return points ? Math.abs(polygonArea(points)) : Number.POSITIVE_INFINITY;
}

function createRegionId(polygon: PolygonObject): string {
  regionIdCounter += 1;

  return `region-${polygon.id}-${Date.now().toString(36)}-${regionIdCounter}`;
}

function createRegionName(polygon: PolygonObject): string {
  return polygon.name ? `Fill ${polygon.name}` : "Filled Region";
}

export function findFillablePolygon(
  point: Point2D,
  objects: GeometryObjectRecord,
): PolygonObject | null {
  const polygons = Object.values(objects)
    .filter(
      (object): object is PolygonObject =>
        object.type === "polygon" &&
        object.visible &&
        !object.locked &&
        object.closed === true &&
        polygonContainsPoint(object, point, objects),
    )
    .sort((first, second) => {
      const areaDelta =
        polygonAreaMagnitude(first, objects) - polygonAreaMagnitude(second, objects);

      return areaDelta === 0 ? first.id.localeCompare(second.id) : areaDelta;
    });

  return polygons[0] ?? null;
}

export function findExistingRegionForPolygon(
  polygon: PolygonObject,
  objects: GeometryObjectRecord,
): RegionObject | null {
  return (
    Object.values(objects).find(
      (object): object is RegionObject =>
        object.type === "region" &&
        sameBoundary(object.boundaryPointIds, polygon.pointIds),
    ) ?? null
  );
}

export function createRegionFromPolygon(polygon: PolygonObject): RegionObject {
  const now = Date.now();

  return {
    boundaryPointIds: polygon.pointIds,
    createdAt: now,
    dependencies: polygon.pointIds,
    dependents: [],
    id: createRegionId(polygon),
    locked: false,
    name: createRegionName(polygon),
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#7ddcff",
      fillOpacity: 0.22,
      stroke: polygon.style.stroke,
      strokeOpacity: 0,
      strokeWidth: 1,
    },
    type: "region",
    updatedAt: now,
    visible: true,
  };
}

export class FillTool extends BaseTool {
  constructor() {
    super({
      cursor: "cell",
      id: "fill",
      name: "Fill",
      shortcut: "F",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const polygon = findFillablePolygon(event.worldPoint, context.objects);

    if (!polygon) {
      context.setHoveredObject(null);
      return;
    }

    const existingRegion = findExistingRegionForPolygon(polygon, context.objects);

    if (existingRegion) {
      context.selectObject(existingRegion.id);
      context.setHoveredObject(existingRegion.id);
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
      return;
    }

    const region = createRegionFromPolygon(polygon);

    context.beginHistoryTransaction("create", "Create filled region");

    if (!context.addObject(region)) {
      context.cancelHistoryTransaction();
      return;
    }

    context.selectObject(region.id);
    context.setHoveredObject(region.id);
    context.commitHistoryTransaction();
    this.transitionState("completed", "complete");
    this.transitionState("waitingInput", "await-input");
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const polygon = findFillablePolygon(event.worldPoint, context.objects);
    const existingRegion = polygon
      ? findExistingRegionForPolygon(polygon, context.objects)
      : null;

    context.setHoveredObject(existingRegion?.id ?? polygon?.id ?? null);
  }
}

export const fillTool = new FillTool();
