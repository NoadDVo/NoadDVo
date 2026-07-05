import type { GeometryObject, GeometryObjectRecord } from "../geometry";
import type { Viewport } from "../geometry/viewport";
import type { TikzOptions } from "../tikz";
import type { ExportProjectSettings } from "../export";
import type { PROJECT_VERSION } from "./ProjectVersion";

export type ProjectMetadata = {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly description: string;
  readonly thumbnail?: string;
};

export type ProjectTheme = "dark-arctic" | "light" | "high-contrast";

export type NoadDVoProjectDocument = {
  readonly version: typeof PROJECT_VERSION;
  readonly project: ProjectMetadata & {
    readonly app: "NoadDVo Geometry Studio";
    readonly exportedAt: string;
  };
  readonly viewport: Viewport;
  readonly settings: ExportProjectSettings;
  readonly tikzOptions: TikzOptions;
  readonly theme: ProjectTheme;
  readonly objects: readonly GeometryObject[];
  readonly selection: readonly string[];
  readonly metadata: {
    readonly format: "noaddvo.geometry.project";
    readonly schemaVersion: typeof PROJECT_VERSION;
  };
};

export type ProjectRuntimeSnapshot = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly settings: ExportProjectSettings;
  readonly theme: ProjectTheme;
  readonly tikzOptions: TikzOptions;
  readonly viewport: Viewport;
};

let metadataCounter = 0;

function createProjectId(): string {
  metadataCounter += 1;

  return `project-${Date.now().toString(36)}-${metadataCounter}`;
}

export function createProjectMetadata(
  name = "Untitled Geometry",
  author = "NoadDVo",
): ProjectMetadata {
  const now = new Date().toISOString();

  return {
    author,
    createdAt: now,
    description: "",
    id: createProjectId(),
    name,
    updatedAt: now,
  };
}

export function touchProjectMetadata(metadata: ProjectMetadata): ProjectMetadata {
  return {
    ...metadata,
    updatedAt: new Date().toISOString(),
  };
}

