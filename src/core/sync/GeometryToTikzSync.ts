import type { GeometryObjectRecord } from "../geometry";
import { generateTikz, type TikzOptions } from "../tikz";
import {
  diagnosticsStatus,
  tikzErrorsToDiagnostics,
  tikzWarningsToDiagnostics,
} from "./SyncDiagnostics";
import {
  buildSyncIntermediateScene,
  createSyncContext,
} from "./SyncContext";
import type { GeometryToTikzSyncResult, SyncPlan } from "./SyncTypes";

export function createGeometryToTikzPlan(
  objects: GeometryObjectRecord,
): SyncPlan {
  return {
    direction: "geometry-to-tikz",
    operations: [
      {
        description: "Generate deterministic TikZ from current Geometry Objects.",
        objectIds: Object.keys(objects).sort(),
        type: "generate-tikz",
      },
    ],
  };
}

export function syncGeometryToTikz({
  objects,
  sourceId,
  tikzOptions,
}: {
  readonly objects: GeometryObjectRecord;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
}): GeometryToTikzSyncResult {
  const context = createSyncContext({
    direction: "geometry-to-tikz",
    sourceId,
    tikzOptions,
  });
  const tikz = generateTikz(objects, context.tikzOptions);
  const diagnostics = [
    ...tikzWarningsToDiagnostics(tikz.warnings, "geometry-to-tikz"),
    ...tikzErrorsToDiagnostics(tikz.errors, "geometry-to-tikz"),
  ];

  return {
    context,
    diagnostics,
    direction: "geometry-to-tikz",
    intermediate: buildSyncIntermediateScene(objects, "geometry"),
    plan: createGeometryToTikzPlan(objects),
    status: diagnosticsStatus(diagnostics),
    tikz,
  };
}
