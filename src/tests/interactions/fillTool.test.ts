import {
  DEFAULT_GEOMETRY_STYLE,
  validateGeometryObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type PolygonObject,
} from "../../core/geometry";
import {
  createRegionFromPolygon,
  FillTool,
  findExistingRegionForPolygon,
  findFillablePolygon,
} from "../../core/tools/FillTool";
import type { ToolContext, ToolPointerEvent } from "../../core/tools/ToolContext";
import { assert, assertEqual } from "../assert";

function point(id: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name: id.toUpperCase(),
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

function polygon(id: string, pointIds: readonly string[]): PolygonObject {
  return {
    closed: true,
    createdAt: 2,
    dependencies: pointIds,
    dependents: [],
    id,
    locked: false,
    name: "Triangle",
    pointIds,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 2,
    visible: true,
  };
}

function fixtureObjects(): GeometryObjectRecord {
  const a = point("a", 0, 0);
  const b = point("b", 4, 0);
  const c = point("c", 0, 3);
  const triangle = polygon("triangle", ["a", "b", "c"]);

  return {
    a,
    b,
    c,
    triangle,
  };
}

function pointerAt(x: number, y: number): ToolPointerEvent {
  return {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    screenPoint: { x, y },
    shiftKey: false,
    snappedWorldPoint: { x, y },
    worldPoint: { x, y },
  };
}

function createTestContext(objects: GeometryObjectRecord): ToolContext & {
  readonly added: GeometryObject[];
  readonly committed: () => boolean;
  readonly selected: () => readonly string[];
} {
  const added: GeometryObject[] = [];
  let currentObjects = { ...objects };
  let committed = false;
  let selected: readonly string[] = [];

  return {
    activeTool: "fill",
    addObject: (object) => {
      added.push(object);
      currentObjects = { ...currentObjects, [object.id]: object };
      return true;
    },
    added,
    beginHistoryTransaction: () => {},
    cancelHistoryTransaction: () => {},
    clearSelection: () => {
      selected = [];
    },
    commitHistoryTransaction: () => {
      committed = true;
    },
    committed: () => committed,
    deleteObject: () => {},
    gridSize: 1,
    hoveredObjectId: null,
    objects: currentObjects,
    pointerWorld: { x: 0, y: 0 },
    selected: () => selected,
    selectedObjectIds: [],
    selectObject: (objectId) => {
      selected = [objectId];
    },
    setActiveTool: () => {},
    setHoveredObject: () => {},
    setObjects: () => true,
    setSelectedObjects: (objectIds) => {
      selected = objectIds;
    },
    snapEnabled: false,
    snapPoint: (pointValue) => pointValue,
    updateObject: () => true,
    viewport: {
      height: 100,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      width: 100,
    },
  };
}

export function runFillToolTests(): void {
  const objects = fixtureObjects();
  const triangle = objects.triangle;

  if (!triangle || triangle.type !== "polygon") {
    throw new Error("fill tool test fixture requires a polygon");
  }

  const selectedPolygon = findFillablePolygon({ x: 0.5, y: 0.5 }, objects);
  const outsidePolygon = findFillablePolygon({ x: 5, y: 5 }, objects);
  const region = createRegionFromPolygon(triangle);
  const objectsWithRegion = { ...objects, [region.id]: region };
  const context = createTestContext(objects);
  const tool = new FillTool();

  assertEqual(selectedPolygon?.id, "triangle", "fill tool finds a polygon containing the click");
  assertEqual(outsidePolygon, null, "fill tool ignores clicks outside closed polygons");
  assert(validateGeometryObject(region, objectsWithRegion).valid, "fill tool creates valid region geometry");
  assertEqual(region.boundaryPointIds.length, 3, "region stores polygon boundary point dependencies");
  assertEqual(region.style.fill, "#7ddcff", "region receives default fill color");
  assertEqual(region.style.strokeOpacity, 0, "region does not duplicate polygon outline by default");
  assertEqual(
    findExistingRegionForPolygon(triangle, objectsWithRegion)?.id,
    region.id,
    "fill tool can find an existing region for the same polygon",
  );

  tool.activate(context);
  tool.pointerDown(pointerAt(0.5, 0.5), context);

  assertEqual(context.added.length, 1, "fill tool pointer interaction adds one region");
  assertEqual(context.added[0]?.type, "region", "fill tool pointer interaction creates a region");
  assert(context.committed(), "fill tool commits the creation transaction");
  assertEqual(context.selected()[0], context.added[0]?.id, "fill tool selects the new region");
}
