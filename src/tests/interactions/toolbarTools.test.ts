import { DEFAULT_GEOMETRY_STYLE, type GeometryObjectRecord, type PointObject } from "../../core/geometry";
import { worldToScreen, type Viewport } from "../../core/geometry/viewport";
import { toolManager } from "../../core/tools/ToolManager";
import type { ToolContext, ToolPointerEvent } from "../../core/tools/ToolContext";
import { getVisibleToolbarItems } from "../../features/toolbar/LeftToolbar";
import { assert, assertEqual } from "../assert";

const viewport: Viewport = {
  height: 240,
  offsetX: 0,
  offsetY: 0,
  scale: 48,
  width: 320,
};

function point(id: string, name: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

function context(objects: GeometryObjectRecord): ToolContext {
  let selectedObjectIds: readonly string[] = [];

  return {
    activeTool: "select",
    addObject: () => true,
    beginHistoryTransaction: () => {},
    cancelHistoryTransaction: () => {},
    clearSelection: () => {
      selectedObjectIds = [];
    },
    commitHistoryTransaction: () => {},
    deleteObject: () => {},
    gridSize: 1,
    hoveredObjectId: null,
    objects,
    pointerWorld: { x: 0.75, y: 0.75 },
    selectObject: (objectId) => {
      selectedObjectIds = [objectId];
    },
    get selectedObjectIds() {
      return selectedObjectIds;
    },
    setActiveTool: () => {},
    setHoveredObject: () => {},
    setObjects: () => true,
    setSelectedObjects: (objectIds) => {
      selectedObjectIds = objectIds;
    },
    snapEnabled: false,
    snapPoint: (screenPoint) => screenPoint,
    updateObject: () => true,
    viewport,
  };
}

function pointerEvent(pointObject: PointObject): ToolPointerEvent {
  return {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    screenPoint: worldToScreen(pointObject, viewport),
    shiftKey: false,
    snappedWorldPoint: pointObject,
    worldPoint: pointObject,
  };
}

export function runToolbarToolsTests(): void {
  assertVisibleToolbarToolsResolveToRegisteredTools();
  assertVisibleToolbarLabelsMatchToolNames();
  assertStartedConstructionToolsRenderPreviews();
}

function assertVisibleToolbarToolsResolveToRegisteredTools(): void {
  const items = getVisibleToolbarItems();

  assert(items.length >= 20, "toolbar exposes the complete visible MVP tool set");

  for (const item of items) {
    assertEqual(
      toolManager.getTool(item.id).id,
      item.id,
      `visible toolbar tool "${item.label}" resolves to a registered tool`,
    );
  }
}

function assertVisibleToolbarLabelsMatchToolNames(): void {
  for (const item of getVisibleToolbarItems()) {
    assertEqual(
      item.label,
      toolManager.getTool(item.id).name,
      `toolbar label for ${item.id} matches the activated tool name`,
    );
  }
}

function assertStartedConstructionToolsRenderPreviews(): void {
  const objects = {
    a: point("a", "A", 0, 0),
    b: point("b", "B", 1, 0),
  };
  const previewToolIds = [
    "midpoint",
    "parallel",
    "perpendicular",
    "perpendicular-bisector",
    "angle-bisector",
    "median",
    "altitude",
    "circumcircle",
    "incircle",
  ] as const;

  for (const toolId of previewToolIds) {
    const tool = toolManager.getTool(toolId);
    const toolContext = context(objects);

    tool.deactivate(toolContext);
    tool.activate(toolContext);
    tool.pointerDown(pointerEvent(objects.a), toolContext);
    assert(tool.renderPreview(toolContext) !== null, `${tool.name} renders a construction preview after first input`);
    tool.deactivate(toolContext);
  }
}
