import type { GeometryObject, GeometryObjectRecord, GeometryToolId, Point2D, ScreenPoint } from "../geometry";
import { snapToGrid } from "../geometry/snap";
import { screenToWorld, type Viewport } from "../geometry/viewport";
import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";

export type ToolModifierKeys = {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
};

export type ToolPointerEvent = ToolModifierKeys & {
  readonly button: number;
  readonly buttons: number;
  readonly pointerId: number;
  readonly screenPoint: ScreenPoint;
  readonly snappedWorldPoint: Point2D;
  readonly worldPoint: Point2D;
};

export type ToolContext = {
  readonly activeTool: GeometryToolId;
  readonly gridSize: number;
  readonly hoveredObjectId: string | null;
  readonly objects: GeometryObjectRecord;
  readonly pointerWorld: Point2D;
  readonly selectedObjectIds: readonly string[];
  readonly snapEnabled: boolean;
  readonly viewport: Viewport;
  readonly addObject: (object: GeometryObject) => boolean;
  readonly clearSelection: () => void;
  readonly deleteObject: (objectId: string) => void;
  readonly selectObject: (objectId: string, additive?: boolean) => void;
  readonly setHoveredObject: (objectId: string | null) => void;
  readonly setActiveTool: (toolId: GeometryToolId) => void;
  readonly setSelectedObjects: (objectIds: readonly string[]) => void;
  readonly setObjects: (objects: GeometryObjectRecord | readonly GeometryObject[]) => boolean;
  readonly updateObject: (
    objectId: string,
    updater: GeometryObject | ((currentObject: GeometryObject) => GeometryObject),
  ) => boolean;
  readonly snapPoint: (point: Point2D) => Point2D;
};

export type ToolPointerInput = ToolModifierKeys & {
  readonly button: number;
  readonly buttons: number;
  readonly pointerId: number;
  readonly screenPoint: ScreenPoint;
};

export function createToolContext(): ToolContext {
  const geometryState = useGeometryStore.getState();
  const viewportState = useViewportStore.getState();

  return {
    activeTool: geometryState.activeTool,
    addObject: geometryState.addObject,
    clearSelection: geometryState.clearSelection,
    deleteObject: geometryState.deleteObject,
    gridSize: viewportState.gridSize,
    hoveredObjectId: geometryState.hoveredObjectId,
    objects: geometryState.objects,
    pointerWorld: viewportState.pointerWorld,
    selectObject: geometryState.selectObject,
    selectedObjectIds: geometryState.selectedObjectIds,
    setHoveredObject: geometryState.setHoveredObject,
    setActiveTool: geometryState.setActiveTool,
    setSelectedObjects: geometryState.setSelectedObjects,
    setObjects: geometryState.setObjects,
    snapEnabled: viewportState.snapEnabled,
    snapPoint: (point) =>
      viewportState.snapEnabled ? snapToGrid(point, viewportState.gridSize) : point,
    updateObject: geometryState.updateObject,
    viewport: viewportState.viewport,
  };
}

export function createToolPointerEvent(
  input: ToolPointerInput,
  context: ToolContext,
): ToolPointerEvent {
  const worldPoint = screenToWorld(input.screenPoint, context.viewport);

  return {
    altKey: input.altKey,
    button: input.button,
    buttons: input.buttons,
    ctrlKey: input.ctrlKey,
    metaKey: input.metaKey,
    pointerId: input.pointerId,
    screenPoint: input.screenPoint,
    shiftKey: input.shiftKey,
    snappedWorldPoint: context.snapPoint(worldPoint),
    worldPoint,
  };
}
