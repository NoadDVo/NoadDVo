import type { GeometryError } from "../geometry";
import type {
  TikzError,
  TikzParseIssue,
  TikzWarning,
} from "../tikz";
import type {
  SyncDiagnostic,
  SyncDiagnosticSeverity,
  SyncDirection,
  SyncStatus,
} from "./SyncTypes";

export function createSyncDiagnostic({
  code,
  column,
  direction,
  line,
  message,
  objectId,
  severity,
}: SyncDiagnostic): SyncDiagnostic {
  return {
    code,
    message,
    severity,
    ...(column !== undefined ? { column } : {}),
    ...(direction ? { direction } : {}),
    ...(line !== undefined ? { line } : {}),
    ...(objectId ? { objectId } : {}),
  };
}

export function diagnosticsStatus(
  diagnostics: readonly SyncDiagnostic[],
): SyncStatus {
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return "failed";
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === "warning")) {
    return "partial";
  }

  return "ready";
}

export function tikzWarningsToDiagnostics(
  warnings: readonly TikzWarning[],
  direction: SyncDirection,
): readonly SyncDiagnostic[] {
  return warnings.map((warning) =>
    createSyncDiagnostic({
      code: warning.code,
      direction,
      message: warning.message,
      objectId: warning.objectId,
      severity: "warning",
    }),
  );
}

export function tikzErrorsToDiagnostics(
  errors: readonly TikzError[],
  direction: SyncDirection,
): readonly SyncDiagnostic[] {
  return errors.map((error) =>
    createSyncDiagnostic({
      code: error.code,
      direction,
      message: error.message,
      objectId: error.objectId,
      severity: "error",
    }),
  );
}

export function parseIssuesToDiagnostics(
  issues: readonly TikzParseIssue[],
): readonly SyncDiagnostic[] {
  return issues.map((issue) =>
    createSyncDiagnostic({
      code: issue.code,
      column: issue.column,
      direction: "tikz-to-geometry",
      line: issue.line,
      message: issue.message,
      severity: issue.severity,
    }),
  );
}

export function geometryErrorToDiagnostic(
  error: GeometryError,
  direction: SyncDirection,
): SyncDiagnostic {
  const severity: SyncDiagnosticSeverity = error.severity;

  return createSyncDiagnostic({
    code: error.code,
    direction,
    message: error.message,
    objectId: error.objectId,
    severity,
  });
}
