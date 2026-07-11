import {
  validateGeometryObjects,
  type GeometryObject,
  type GeometryObjectRecord,
} from "../geometry";
import type { Viewport } from "../geometry/viewport";
import {
  NOADDVO_PROJECT_VERSION,
  type ExportProjectSettings,
  type NoadDVoProjectFile,
} from "./ExportJson";

type ImportSuccess = {
  readonly valid: true;
  readonly project: NoadDVoProjectFile;
  readonly objects: GeometryObjectRecord;
};

type ImportFailure = {
  readonly valid: false;
  readonly error: string;
};

export type ProjectImportResult = ImportSuccess | ImportFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isViewport(value: unknown): value is Viewport {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.scale) &&
    isFiniteNumber(value.offsetX) &&
    isFiniteNumber(value.offsetY) &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height)
  );
}

function isProjectSettings(value: unknown): value is ExportProjectSettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.gridSize) &&
    typeof value.snapEnabled === "boolean" &&
    typeof value.showAxes === "boolean" &&
    typeof value.showGrid === "boolean"
  );
}

function isGeometryObject(value: unknown): value is GeometryObject {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.type === "string" &&
    typeof value.visible === "boolean" &&
    typeof value.locked === "boolean" &&
    isRecord(value.style) &&
    Array.isArray(value.dependencies) &&
    Array.isArray(value.dependents)
  );
}

function isProjectFile(value: unknown): value is NoadDVoProjectFile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.version === NOADDVO_PROJECT_VERSION &&
    isRecord(value.project) &&
    isViewport(value.viewport) &&
    isProjectSettings(value.settings) &&
    Array.isArray(value.objects) &&
    value.objects.every(isGeometryObject) &&
    Array.isArray(value.selection) &&
    value.selection.every((item) => typeof item === "string")
  );
}

export function importProjectJson(text: string): ProjectImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: "Invalid JSON project file.", valid: false };
  }

  if (!isProjectFile(parsed)) {
    return { error: "Unsupported or invalid .ndv project format.", valid: false };
  }

  const objects = Object.fromEntries(
    parsed.objects.map((object) => [object.id, object]),
  ) as GeometryObjectRecord;
  const validation = validateGeometryObjects(objects);

  if (!validation.valid) {
    return { error: validation.error.message, valid: false };
  }

  return {
    objects,
    project: {
      ...parsed,
      selection: parsed.selection.filter((objectId) => Boolean(objects[objectId])),
    },
    valid: true,
  };
}
