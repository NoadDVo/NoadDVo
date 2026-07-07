"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTikzToGeometryPlan = createTikzToGeometryPlan;
exports.syncTikzToGeometry = syncTikzToGeometry;
const geometry_1 = require("../geometry");
const tikz_1 = require("../tikz");
const SyncDiagnostics_1 = require("./SyncDiagnostics");
const SyncContext_1 = require("./SyncContext");
function objectsToRecord(objects) {
    return Object.fromEntries(objects.map((object) => [object.id, object]));
}
function createTikzToGeometryPlan() {
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
function syncTikzToGeometry({ source, sourceId, tikzOptions, }) {
    const context = (0, SyncContext_1.createSyncContext)({
        direction: "tikz-to-geometry",
        sourceId,
        tikzOptions,
    });
    const parseResult = (0, tikz_1.parseTikz)(source);
    const objectRecord = (0, geometry_1.normalizeDependencyMetadata)(objectsToRecord(parseResult.objects));
    const objects = Object.values(objectRecord).sort((first, second) => first.createdAt - second.createdAt || first.id.localeCompare(second.id));
    const validation = (0, geometry_1.validateGeometryObjects)(objectRecord);
    const diagnostics = [
        ...(0, SyncDiagnostics_1.parseIssuesToDiagnostics)(parseResult.issues),
        ...(!validation.valid
            ? [(0, SyncDiagnostics_1.geometryErrorToDiagnostic)(validation.error, "tikz-to-geometry")]
            : []),
    ];
    return {
        context,
        diagnostics,
        direction: "tikz-to-geometry",
        intermediate: (0, SyncContext_1.buildSyncIntermediateScene)(objects, "tikz"),
        objectRecord,
        objects,
        parseResult,
        plan: createTikzToGeometryPlan(),
        status: (0, SyncDiagnostics_1.diagnosticsStatus)(diagnostics),
        validation,
    };
}
