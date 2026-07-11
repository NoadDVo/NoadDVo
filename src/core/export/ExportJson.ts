import type { GeometryObject, GeometryObjectRecord } from "../geometry";
import type { Viewport } from "../geometry/viewport";

export const NOADDVO_PROJECT_VERSION = 1;

export type ExportProjectSettings = {
  readonly gridSize: number;
  readonly snapEnabled: boolean;
  readonly showAxes: boolean;
  readonly showGrid: boolean;
};

export type NoadDVoProjectFile = {
  readonly version: typeof NOADDVO_PROJECT_VERSION;
  readonly project: {
    readonly name: string;
    readonly app: "NoadDVo Geometry Studio";
    readonly exportedAt: string;
  };
  readonly viewport: Viewport;
  readonly settings: ExportProjectSettings;
  readonly objects: readonly GeometryObject[];
  readonly selection: readonly string[];
  readonly metadata: {
    readonly format: "noaddvo.geometry.project";
    readonly schemaVersion: typeof NOADDVO_PROJECT_VERSION;
  };
};

export type ProjectExportSnapshot = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly settings: ExportProjectSettings;
  readonly viewport: Viewport;
  readonly projectName?: string;
};

function sortObjects(objects: GeometryObjectRecord): readonly GeometryObject[] {
  return Object.values(objects).sort((a, b) => {
    const timeDelta = a.createdAt - b.createdAt;

    return timeDelta === 0 ? a.id.localeCompare(b.id) : timeDelta;
  });
}

export function createProjectFile({
  objects,
  projectName = "Untitled Geometry",
  selectedObjectIds,
  settings,
  viewport,
}: ProjectExportSnapshot): NoadDVoProjectFile {
  return {
    metadata: {
      format: "noaddvo.geometry.project",
      schemaVersion: NOADDVO_PROJECT_VERSION,
    },
    objects: sortObjects(objects),
    project: {
      app: "NoadDVo Geometry Studio",
      exportedAt: new Date().toISOString(),
      name: projectName,
    },
    selection: selectedObjectIds,
    settings,
    version: NOADDVO_PROJECT_VERSION,
    viewport,
  };
}

export function exportProjectJson(snapshot: ProjectExportSnapshot): string {
  return `${JSON.stringify(createProjectFile(snapshot), null, 2)}\n`;
}
