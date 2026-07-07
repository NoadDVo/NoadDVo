"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSyncDiagnostic = createSyncDiagnostic;
exports.diagnosticsStatus = diagnosticsStatus;
exports.tikzWarningsToDiagnostics = tikzWarningsToDiagnostics;
exports.tikzErrorsToDiagnostics = tikzErrorsToDiagnostics;
exports.parseIssuesToDiagnostics = parseIssuesToDiagnostics;
exports.geometryErrorToDiagnostic = geometryErrorToDiagnostic;
function createSyncDiagnostic({ code, column, direction, line, message, objectId, severity, }) {
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
function diagnosticsStatus(diagnostics) {
    if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
        return "failed";
    }
    if (diagnostics.some((diagnostic) => diagnostic.severity === "warning")) {
        return "partial";
    }
    return "ready";
}
function tikzWarningsToDiagnostics(warnings, direction) {
    return warnings.map((warning) => createSyncDiagnostic({
        code: warning.code,
        direction,
        message: warning.message,
        objectId: warning.objectId,
        severity: "warning",
    }));
}
function tikzErrorsToDiagnostics(errors, direction) {
    return errors.map((error) => createSyncDiagnostic({
        code: error.code,
        direction,
        message: error.message,
        objectId: error.objectId,
        severity: "error",
    }));
}
function parseIssuesToDiagnostics(issues) {
    return issues.map((issue) => createSyncDiagnostic({
        code: issue.code,
        column: issue.column,
        direction: "tikz-to-geometry",
        line: issue.line,
        message: issue.message,
        severity: issue.severity,
    }));
}
function geometryErrorToDiagnostic(error, direction) {
    const severity = error.severity;
    return createSyncDiagnostic({
        code: error.code,
        direction,
        message: error.message,
        objectId: error.objectId,
        severity,
    });
}
