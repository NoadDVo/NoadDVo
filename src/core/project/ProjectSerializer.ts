import {
  getTikzOptions,
  type TikzOptions,
} from "../tikz";
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
} from "./ProjectVersion";
import type {
  NoadDVoProjectDocument,
  ProjectMetadata,
  ProjectRuntimeSnapshot,
} from "./ProjectMetadata";

function sortObjects({ objects }: ProjectRuntimeSnapshot) {
  return Object.values(objects).sort((a, b) => {
    const timeDelta = a.createdAt - b.createdAt;

    return timeDelta === 0 ? a.id.localeCompare(b.id) : timeDelta;
  });
}

export function createProjectDocument(
  metadata: ProjectMetadata,
  snapshot: ProjectRuntimeSnapshot,
): NoadDVoProjectDocument {
  const tikzOptions: TikzOptions =
    snapshot.tikzOptions ?? getTikzOptions("academic");

  return {
    metadata: {
      format: PROJECT_FORMAT,
      schemaVersion: PROJECT_VERSION,
    },
    objects: sortObjects(snapshot),
    project: {
      ...metadata,
      app: "NoadDVo Geometry Studio",
      exportedAt: new Date().toISOString(),
    },
    selection: snapshot.selectedObjectIds,
    settings: snapshot.settings,
    theme: snapshot.theme,
    tikzOptions,
    version: PROJECT_VERSION,
    viewport: snapshot.viewport,
  };
}

export function serializeProjectDocument(
  document: NoadDVoProjectDocument,
): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}

