import type { GeometryObject, GeometryObjectRecord, GeometryObjectType } from "../geometry";
import type { TikzOptions } from "../tikz";
import { applyTikzToGeometry, type TikzApplyObjectChange, type TikzApplyResult } from "./TikzApplySync";
import type { SyncDiagnostic, SyncDiagnosticSeverity } from "./SyncTypes";

export type SyncPreviewOperationType =
  | "create"
  | "update"
  | "delete"
  | "preserve"
  | "unsupported"
  | "warning"
  | "conflict";

export type SyncPreviewOperation = {
  readonly afterValue?: string | undefined;
  readonly beforeValue?: string | undefined;
  readonly candidateId?: string | undefined;
  readonly diagnostics: readonly SyncDiagnostic[];
  readonly objectId?: string | undefined;
  readonly objectName?: string | undefined;
  readonly objectType?: GeometryObjectType | undefined;
  readonly operation: SyncPreviewOperationType;
  readonly reason: string;
  readonly requiresConfirmation: boolean;
  readonly severity: SyncDiagnosticSeverity;
};

export type SyncPreviewGroups = {
  readonly conflicts: readonly SyncPreviewOperation[];
  readonly creates: readonly SyncPreviewOperation[];
  readonly deletes: readonly SyncPreviewOperation[];
  readonly preserved: readonly SyncPreviewOperation[];
  readonly updates: readonly SyncPreviewOperation[];
  readonly warnings: readonly SyncPreviewOperation[];
};

export type TikzApplyPreview = {
  readonly applyResult: TikzApplyResult;
  readonly canApply: boolean;
  readonly diagnostics: readonly SyncDiagnostic[];
  readonly groups: SyncPreviewGroups;
  readonly operations: readonly SyncPreviewOperation[];
  readonly requiresDestructiveConfirmation: boolean;
  readonly requiresPartialConfirmation: boolean;
};

function objectName(object: GeometryObject | undefined): string | undefined {
  return object && "name" in object ? object.name : undefined;
}

function pointLabel(objects: GeometryObjectRecord, pointId: string): string {
  const point = objects[pointId];

  return point?.type === "point" ? point.name ?? point.id : pointId;
}

function summarizeObject(
  object: GeometryObject | undefined,
  objects: GeometryObjectRecord,
): string | undefined {
  if (!object) {
    return undefined;
  }

  switch (object.type) {
    case "point":
      return `${object.name ?? object.id} = (${object.x}, ${object.y})`;
    case "segment":
      return `${pointLabel(objects, object.startPointId)} -- ${pointLabel(objects, object.endPointId)}`;
    case "line":
      return `line ${pointLabel(objects, object.pointAId)} ${pointLabel(objects, object.pointBId)}`;
    case "ray":
      return `ray ${pointLabel(objects, object.startPointId)} -> ${pointLabel(objects, object.throughPointId)}`;
    case "vector":
      return `vector ${pointLabel(objects, object.startPointId)} -> ${pointLabel(objects, object.endPointId)}`;
    case "circle":
      if (object.circleKind === "center-radius") {
        return `circle center ${pointLabel(objects, object.centerPointId)}, r=${object.radius}`;
      }
      if (object.circleKind === "center-point") {
        return `circle center ${pointLabel(objects, object.centerPointId)}, through ${pointLabel(objects, object.radiusPointId)}`;
      }
      return `circle through ${[
        pointLabel(objects, object.pointAId),
        pointLabel(objects, object.pointBId),
        pointLabel(objects, object.pointCId),
      ].join(", ")}`;
    case "polygon":
      return `polygon ${object.pointIds.map((pointId) => pointLabel(objects, pointId)).join(" -- ")}`;
    case "region":
      return `region ${object.boundaryPointIds.map((pointId) => pointLabel(objects, pointId)).join(" -- ")}`;
    case "angle":
      return `angle ${pointLabel(objects, object.pointAId)}-${pointLabel(objects, object.vertexPointId)}-${pointLabel(objects, object.pointCId)}`;
    case "arc":
      return `arc ${pointLabel(objects, object.centerPointId)}:${pointLabel(objects, object.startPointId)}-${pointLabel(objects, object.endPointId)}`;
    case "text":
      return `text "${object.content}" at (${object.x}, ${object.y})`;
    case "measurement":
      return `${object.measurementType} of ${object.targetObjectId}`;
  }
}

function diagnosticForOperation(
  diagnostics: readonly SyncDiagnostic[],
  operation: TikzApplyObjectChange,
): readonly SyncDiagnostic[] {
  return diagnostics.filter(
    (diagnostic) =>
      diagnostic.objectId === operation.objectId ||
      (!diagnostic.objectId && operation.reason.includes(diagnostic.code)),
  );
}

function diagnosticPreviewType(diagnostic: SyncDiagnostic): SyncPreviewOperationType {
  if (diagnostic.severity === "error") {
    return "conflict";
  }

  if (
    diagnostic.code === "TIKZ_APPLY_AMBIGUOUS_POINT_NAME" ||
    diagnostic.code === "TIKZ_APPLY_AMBIGUOUS_OBJECT_MAPPING" ||
    diagnostic.code === "TIKZ_APPLY_POINT_DEPENDENCY_REPLACED"
  ) {
    return "conflict";
  }

  return "warning";
}

function operationPreviewType(
  operation: TikzApplyObjectChange,
  diagnostics: readonly SyncDiagnostic[],
): SyncPreviewOperationType {
  if (
    operation.operation === "preserve" &&
    operation.reason.includes("not supported")
  ) {
    return "unsupported";
  }

  if (diagnostics.some((diagnostic) => diagnosticPreviewType(diagnostic) === "conflict")) {
    return "conflict";
  }

  return operation.operation;
}

function severityFor(
  operation: SyncPreviewOperationType,
  diagnostics: readonly SyncDiagnostic[],
): SyncDiagnosticSeverity {
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return "error";
  }

  if (operation === "conflict" || operation === "delete" || operation === "unsupported" || diagnostics.length > 0) {
    return "warning";
  }

  return "info";
}

function previewForChange(
  change: TikzApplyObjectChange,
  currentObjects: GeometryObjectRecord,
  nextObjects: GeometryObjectRecord,
  diagnostics: readonly SyncDiagnostic[],
): SyncPreviewOperation {
  const before = currentObjects[change.objectId];
  const after = nextObjects[change.objectId];
  const relatedDiagnostics = diagnosticForOperation(diagnostics, change);
  const operation = operationPreviewType(change, relatedDiagnostics);

  return {
    afterValue: summarizeObject(after, nextObjects),
    beforeValue: summarizeObject(before, currentObjects),
    candidateId: change.candidateId,
    diagnostics: relatedDiagnostics,
    objectId: change.objectId,
    objectName: objectName(after) ?? objectName(before),
    objectType: change.type,
    operation,
    reason: change.reason,
    requiresConfirmation: operation === "delete" || operation === "conflict",
    severity: severityFor(operation, relatedDiagnostics),
  };
}

function previewForDiagnostic(diagnostic: SyncDiagnostic): SyncPreviewOperation {
  const operation = diagnosticPreviewType(diagnostic);

  return {
    diagnostics: [diagnostic],
    objectId: diagnostic.objectId,
    operation,
    reason: diagnostic.message,
    requiresConfirmation: operation === "conflict",
    severity: diagnostic.severity,
  };
}

function groupOperations(operations: readonly SyncPreviewOperation[]): SyncPreviewGroups {
  return {
    conflicts: operations.filter((operation) => operation.operation === "conflict"),
    creates: operations.filter((operation) => operation.operation === "create"),
    deletes: operations.filter((operation) => operation.operation === "delete"),
    preserved: operations.filter((operation) => operation.operation === "preserve" || operation.operation === "unsupported"),
    updates: operations.filter((operation) => operation.operation === "update"),
    warnings: operations.filter((operation) => operation.operation === "warning"),
  };
}

export function createTikzApplyPreview({
  currentObjects,
  source,
  sourceId,
  tikzOptions,
}: {
  readonly currentObjects: GeometryObjectRecord;
  readonly source: string;
  readonly sourceId?: string | undefined;
  readonly tikzOptions?: TikzOptions | undefined;
}): TikzApplyPreview {
  const applyResult = applyTikzToGeometry({
    currentObjects,
    source,
    sourceId,
    tikzOptions,
  });
  const operations = [
    ...applyResult.operations.map((operation) =>
      previewForChange(
        operation,
        currentObjects,
        applyResult.objectRecord,
        applyResult.diagnostics,
      ),
    ),
    ...applyResult.diagnostics
      .filter((diagnostic) => !diagnostic.objectId)
      .map(previewForDiagnostic),
  ];
  const groups = groupOperations(operations);
  const requiresPartialConfirmation = applyResult.status === "partial";
  const requiresDestructiveConfirmation = groups.deletes.length > 0;
  const canApply = applyResult.status !== "failed" &&
    !applyResult.diagnostics.some((diagnostic) => diagnostic.severity === "error");

  return {
    applyResult,
    canApply,
    diagnostics: applyResult.diagnostics,
    groups,
    operations,
    requiresDestructiveConfirmation,
    requiresPartialConfirmation,
  };
}
