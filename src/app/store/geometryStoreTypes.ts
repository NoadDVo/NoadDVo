import type {
  GeometryError,
  GeometryObject,
  GeometryObjectRecord,
  GeometryToolId,
} from "../../core/geometry";
import type { HistoryActionKind } from "../../core/history";

export type SetObjectsInput = GeometryObjectRecord | readonly GeometryObject[];

export type ExampleSceneId =
  | "triangle"
  | "circle"
  | "olympiad"
  | "coordinate";

export type GeometryObjectUpdater =
  | GeometryObject
  | ((currentObject: GeometryObject) => GeometryObject);

export type GeometryState = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly hoveredObjectId: string | null;
  readonly activeTool: GeometryToolId;
  readonly lastError: GeometryError | null;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly historyVersion: number;
  readonly addObject: (object: GeometryObject) => boolean;
  readonly updateObject: (
    objectId: string,
    updater: GeometryObjectUpdater,
  ) => boolean;
  readonly deleteObject: (objectId: string) => void;
  readonly selectObject: (objectId: string, additive?: boolean) => void;
  readonly setSelectedObjects: (objectIds: readonly string[]) => void;
  readonly setHoveredObject: (objectId: string | null) => void;
  readonly clearSelection: () => void;
  readonly setActiveTool: (toolId: GeometryToolId) => void;
  readonly setObjects: (
    objects: SetObjectsInput,
    description?: string,
    selectedObjectIds?: readonly string[],
  ) => boolean;
  readonly clearProject: () => void;
  readonly loadExample: (exampleId: ExampleSceneId) => boolean;
  readonly beginHistoryTransaction: (
    kind: HistoryActionKind,
    description: string,
  ) => void;
  readonly commitHistoryTransaction: () => void;
  readonly cancelHistoryTransaction: () => void;
  readonly undo: () => void;
  readonly redo: () => void;
};

