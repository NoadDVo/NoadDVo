"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadProjectDocument = loadProjectDocument;
const export_1 = require("../export");
const tikz_1 = require("../tikz");
const ProjectVersion_1 = require("./ProjectVersion");
const ProjectMetadata_1 = require("./ProjectMetadata");
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getProjectTheme(value) {
    return value === "light" || value === "dark" || value === "system" ? value : "dark-arctic";
}
function getProjectMetadata(project) {
    const fallback = (0, ProjectMetadata_1.createProjectMetadata)();
    if (!isRecord(project)) {
        return fallback;
    }
    return {
        author: typeof project.author === "string" ? project.author : fallback.author,
        createdAt: typeof project.createdAt === "string" ? project.createdAt : fallback.createdAt,
        description: typeof project.description === "string" ? project.description : "",
        id: typeof project.id === "string" ? project.id : fallback.id,
        name: typeof project.name === "string" ? project.name : fallback.name,
        updatedAt: typeof project.updatedAt === "string" ? project.updatedAt : fallback.updatedAt,
        ...(typeof project.thumbnail === "string"
            ? { thumbnail: project.thumbnail }
            : {}),
    };
}
function isProjectDocument(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (value.version === ProjectVersion_1.PROJECT_VERSION &&
        isRecord(value.metadata) &&
        value.metadata.format === ProjectVersion_1.PROJECT_FORMAT &&
        isRecord(value.project) &&
        Array.isArray(value.objects) &&
        Array.isArray(value.selection));
}
function loadProjectDocument(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        return { error: "Invalid JSON project file.", valid: false };
    }
    const importResult = (0, export_1.importProjectJson)(text);
    if (!importResult.valid) {
        return { error: importResult.error, valid: false };
    }
    if (isProjectDocument(parsed)) {
        return {
            document: {
                ...parsed,
                objects: Object.values(importResult.objects),
                project: {
                    ...getProjectMetadata(parsed.project),
                    app: "NoadDVo Geometry Studio",
                    exportedAt: typeof parsed.project.exportedAt === "string"
                        ? parsed.project.exportedAt
                        : new Date().toISOString(),
                },
                selection: importResult.project.selection,
                theme: getProjectTheme(parsed.theme),
                tikzOptions: isRecord(parsed.tikzOptions)
                    ? {
                        ...(0, tikz_1.getTikzOptions)("academic"),
                        ...parsed.tikzOptions,
                    }
                    : (0, tikz_1.getTikzOptions)("academic"),
            },
            valid: true,
        };
    }
    return {
        document: {
            metadata: {
                format: ProjectVersion_1.PROJECT_FORMAT,
                schemaVersion: ProjectVersion_1.PROJECT_VERSION,
            },
            objects: Object.values(importResult.objects),
            project: {
                ...getProjectMetadata(importResult.project.project),
                app: "NoadDVo Geometry Studio",
                exportedAt: importResult.project.project.exportedAt,
            },
            selection: importResult.project.selection,
            settings: importResult.project.settings,
            theme: "dark-arctic",
            tikzOptions: (0, tikz_1.getTikzOptions)("academic"),
            version: ProjectVersion_1.PROJECT_VERSION,
            viewport: importResult.project.viewport,
        },
        valid: true,
    };
}
