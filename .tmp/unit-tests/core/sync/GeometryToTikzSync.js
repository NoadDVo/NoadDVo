"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGeometryToTikzPlan = createGeometryToTikzPlan;
exports.syncGeometryToTikz = syncGeometryToTikz;
const tikz_1 = require("../tikz");
const SyncDiagnostics_1 = require("./SyncDiagnostics");
const SyncContext_1 = require("./SyncContext");
function createGeometryToTikzPlan(objects) {
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
function syncGeometryToTikz({ objects, sourceId, tikzOptions, }) {
    const context = (0, SyncContext_1.createSyncContext)({
        direction: "geometry-to-tikz",
        sourceId,
        tikzOptions,
    });
    const tikz = (0, tikz_1.generateTikz)(objects, context.tikzOptions);
    const diagnostics = [
        ...(0, SyncDiagnostics_1.tikzWarningsToDiagnostics)(tikz.warnings, "geometry-to-tikz"),
        ...(0, SyncDiagnostics_1.tikzErrorsToDiagnostics)(tikz.errors, "geometry-to-tikz"),
    ];
    return {
        context,
        diagnostics,
        direction: "geometry-to-tikz",
        intermediate: (0, SyncContext_1.buildSyncIntermediateScene)(objects, "geometry"),
        plan: createGeometryToTikzPlan(objects),
        status: (0, SyncDiagnostics_1.diagnosticsStatus)(diagnostics),
        tikz,
    };
}
