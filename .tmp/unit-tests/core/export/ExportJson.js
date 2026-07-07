"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOADDVO_PROJECT_VERSION = void 0;
exports.createProjectFile = createProjectFile;
exports.exportProjectJson = exportProjectJson;
exports.NOADDVO_PROJECT_VERSION = 1;
function sortObjects(objects) {
    return Object.values(objects).sort((a, b) => {
        const timeDelta = a.createdAt - b.createdAt;
        return timeDelta === 0 ? a.id.localeCompare(b.id) : timeDelta;
    });
}
function createProjectFile({ objects, projectName = "Untitled Geometry", selectedObjectIds, settings, viewport, }) {
    return {
        metadata: {
            format: "noaddvo.geometry.project",
            schemaVersion: exports.NOADDVO_PROJECT_VERSION,
        },
        objects: sortObjects(objects),
        project: {
            app: "NoadDVo Geometry Studio",
            exportedAt: new Date().toISOString(),
            name: projectName,
        },
        selection: selectedObjectIds,
        settings,
        version: exports.NOADDVO_PROJECT_VERSION,
        viewport,
    };
}
function exportProjectJson(snapshot) {
    return `${JSON.stringify(createProjectFile(snapshot), null, 2)}\n`;
}
