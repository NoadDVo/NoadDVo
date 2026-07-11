import {
  normalizeDependencyMetadata,
  validateGeometryObjects,
  type GeometryObject,
  type GeometryObjectRecord,
} from "../geometry";
import { parseTikz, type TikzOptions } from "../tikz";
import {
  diagnosticsStatus,
  geometryErrorToDiagnostic,
  parseIssuesToDiagnostics,
} from "./SyncDiagnostics";
import {
  buildSyncIntermediateScene,
  createSyncContext,
} from "./SyncContext";
import type { SyncPlan, TikzToGeometrySyncResult } from "./SyncTypes";

function objectsToRecord(objects: readonly GeometryObject[]): GeometryObjectRecord {
  return Object.fromEntries(
    objects.map((object) => [object.id, object]),
  ) as GeometryObjectRecord;
}

export function createTikzToGeometryPlan(): SyncPlan {
  return {
    direction: "tikz-to-geometry",
    operations: [
      {
        description: "Tokenize and parse TikZ source into an AST.",
        type: "parse-tikz",
      },
      {
        description: "Recover supported Geometry Objects from the TikZ AST.",
        type: "candidate-replace-scene",
      },
      {
        description: "Validate recovered Geometry Objects without mutating application state.",
        type: "validate-geometry",
      },
    ],
  };
}

export function syncTikzToGeometry({
  source,
  sourceId,
  tikzOptions,
}: {
  readonly source: string;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
}): TikzToGeometrySyncResult {
  const context = createSyncContext({
    direction: "tikz-to-geometry",
    sourceId,
    tikzOptions,
  });
  const parseResult = parseTikz(source);
  const objectRecord = normalizeDependencyMetadata(objectsToRecord(parseResult.objects));
  const objects = Object.values(objectRecord).sort(
    (first, second) => first.createdAt - second.createdAt || first.id.localeCompare(second.id),
  );
  const validation = validateGeometryObjects(objectRecord);
  const diagnostics = [
    ...parseIssuesToDiagnostics(parseResult.issues),
    ...(!validation.valid
      ? [geometryErrorToDiagnostic(validation.error, "tikz-to-geometry")]
      : []),
  ];

  return {
    context,
    diagnostics,
    direction: "tikz-to-geometry",
    intermediate: buildSyncIntermediateScene(objects, "tikz"),
    objectRecord,
    objects,
    parseResult,
    plan: createTikzToGeometryPlan(),
    status: diagnosticsStatus(diagnostics),
    validation,
  };
}
