import { importProjectJson } from "../export";
import { getTikzOptions } from "../tikz";
import {
  PROJECT_FORMAT,
  PROJECT_VERSION,
} from "./ProjectVersion";
import {
  createProjectMetadata,
  type NoadDVoProjectDocument,
  type ProjectMetadata,
  type ProjectTheme,
} from "./ProjectMetadata";

export type LoadedProject = {
  readonly document: NoadDVoProjectDocument;
  readonly valid: true;
};

export type ProjectLoadFailure = {
  readonly error: string;
  readonly valid: false;
};

export type ProjectLoadResult = LoadedProject | ProjectLoadFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getProjectTheme(value: unknown): ProjectTheme {
  return value === "light" || value === "high-contrast" ? value : "dark-arctic";
}

function getProjectMetadata(project: unknown): ProjectMetadata {
  const fallback = createProjectMetadata();

  if (!isRecord(project)) {
    return fallback;
  }

  return {
    author: typeof project.author === "string" ? project.author : fallback.author,
    createdAt:
      typeof project.createdAt === "string" ? project.createdAt : fallback.createdAt,
    description:
      typeof project.description === "string" ? project.description : "",
    id: typeof project.id === "string" ? project.id : fallback.id,
    name: typeof project.name === "string" ? project.name : fallback.name,
    updatedAt:
      typeof project.updatedAt === "string" ? project.updatedAt : fallback.updatedAt,
    ...(typeof project.thumbnail === "string"
      ? { thumbnail: project.thumbnail }
      : {}),
  };
}

function isProjectDocument(value: unknown): value is NoadDVoProjectDocument {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === PROJECT_VERSION &&
    isRecord(value.metadata) &&
    value.metadata.format === PROJECT_FORMAT &&
    isRecord(value.project) &&
    Array.isArray(value.objects) &&
    Array.isArray(value.selection)
  );
}

export function loadProjectDocument(text: string): ProjectLoadResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Invalid JSON project file.", valid: false };
  }

  const importResult = importProjectJson(text);

  if (!importResult.valid) {
    return { error: importResult.error, valid: false };
  }

  if (isProjectDocument(parsed)) {
    return {
      document: {
        ...parsed,
        objects: Object.values(importResult.objects),
        project: {
          ...getProjectMetadata(parsed.project),
          app: "NoadDVo Geometry Studio",
          exportedAt:
            typeof parsed.project.exportedAt === "string"
              ? parsed.project.exportedAt
              : new Date().toISOString(),
        },
        selection: importResult.project.selection,
        theme: getProjectTheme(parsed.theme),
        tikzOptions: isRecord(parsed.tikzOptions)
          ? {
              ...getTikzOptions("academic"),
              ...parsed.tikzOptions,
            }
          : getTikzOptions("academic"),
      },
      valid: true,
    };
  }

  return {
    document: {
      metadata: {
        format: PROJECT_FORMAT,
        schemaVersion: PROJECT_VERSION,
      },
      objects: Object.values(importResult.objects),
      project: {
        ...getProjectMetadata(importResult.project.project),
        app: "NoadDVo Geometry Studio",
        exportedAt: importResult.project.project.exportedAt,
      },
      selection: importResult.project.selection,
      settings: importResult.project.settings,
      theme: "dark-arctic",
      tikzOptions: getTikzOptions("academic"),
      version: PROJECT_VERSION,
      viewport: importResult.project.viewport,
    },
    valid: true,
  };
}

