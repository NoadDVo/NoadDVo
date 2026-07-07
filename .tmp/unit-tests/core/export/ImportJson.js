"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProjectJson = importProjectJson;
const geometry_1 = require("../geometry");
const ExportJson_1 = require("./ExportJson");
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function isViewport(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (isFiniteNumber(value.scale) &&
        isFiniteNumber(value.offsetX) &&
        isFiniteNumber(value.offsetY) &&
        isFiniteNumber(value.width) &&
        isFiniteNumber(value.height));
}
function isProjectSettings(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (isFiniteNumber(value.gridSize) &&
        typeof value.snapEnabled === "boolean" &&
        typeof value.showAxes === "boolean" &&
        typeof value.showGrid === "boolean");
}
function isGeometryObject(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.id === "string" &&
        typeof value.type === "string" &&
        typeof value.visible === "boolean" &&
        typeof value.locked === "boolean" &&
        isRecord(value.style) &&
        Array.isArray(value.dependencies) &&
        Array.isArray(value.dependents));
}
function isProjectFile(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (value.version === ExportJson_1.NOADDVO_PROJECT_VERSION &&
        isRecord(value.project) &&
        isViewport(value.viewport) &&
        isProjectSettings(value.settings) &&
        Array.isArray(value.objects) &&
        value.objects.every(isGeometryObject) &&
        Array.isArray(value.selection) &&
        value.selection.every((item) => typeof item === "string"));
}
function importProjectJson(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch {
        return { error: "Invalid JSON project file.", valid: false };
    }
    if (!isProjectFile(parsed)) {
        return { error: "Unsupported or invalid .ndv project format.", valid: false };
    }
    const objects = Object.fromEntries(parsed.objects.map((object) => [object.id, object]));
    const validation = (0, geometry_1.validateGeometryObjects)(objects);
    if (!validation.valid) {
        return { error: validation.error.message, valid: false };
    }
    return {
        objects,
        project: {
            ...parsed,
            selection: parsed.selection.filter((objectId) => Boolean(objects[objectId])),
        },
        valid: true,
    };
}
