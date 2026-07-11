"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectDocument = createProjectDocument;
exports.serializeProjectDocument = serializeProjectDocument;
const tikz_1 = require("../tikz");
const ProjectVersion_1 = require("./ProjectVersion");
function sortObjects({ objects }) {
    return Object.values(objects).sort((a, b) => {
        const timeDelta = a.createdAt - b.createdAt;
        return timeDelta === 0 ? a.id.localeCompare(b.id) : timeDelta;
    });
}
function createProjectDocument(metadata, snapshot) {
    const tikzOptions = snapshot.tikzOptions ?? (0, tikz_1.getTikzOptions)("academic");
    return {
        metadata: {
            format: ProjectVersion_1.PROJECT_FORMAT,
            schemaVersion: ProjectVersion_1.PROJECT_VERSION,
        },
        objects: sortObjects(snapshot),
        project: {
            ...metadata,
            app: "NoadDVo Geometry Studio",
            exportedAt: new Date().toISOString(),
        },
        selection: snapshot.selectedObjectIds,
        settings: snapshot.settings,
        theme: snapshot.theme,
        tikzOptions,
        version: ProjectVersion_1.PROJECT_VERSION,
        viewport: snapshot.viewport,
    };
}
function serializeProjectDocument(document) {
    return `${JSON.stringify(document, null, 2)}\n`;
}
