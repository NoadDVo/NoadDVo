"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeObjects = normalizeObjects;
exports.selectedIdsWithout = selectedIdsWithout;
exports.prepareObjectsForCommit = prepareObjectsForCommit;
exports.createHistorySnapshot = createHistorySnapshot;
exports.getHistoryFlags = getHistoryFlags;
exports.historyDescriptionForObject = historyDescriptionForObject;
const geometry_1 = require("../../core/geometry");
const history_1 = require("../../core/history");
function normalizeObjects(input) {
    if (Array.isArray(input)) {
        return Object.fromEntries(input.map((object) => [object.id, object]));
    }
    return input;
}
function selectedIdsWithout(selectedObjectIds, objectId) {
    return selectedObjectIds.filter((selectedObjectId) => selectedObjectId !== objectId);
}
function prepareObjectsForCommit(objects) {
    const normalizedObjects = (0, geometry_1.normalizeDependencyMetadata)(objects);
    const result = (0, geometry_1.validateGeometryObjects)(normalizedObjects);
    if (!result.valid) {
        return { error: result.error, valid: false };
    }
    return { objects: normalizedObjects, valid: true };
}
function createHistorySnapshot(state) {
    return {
        objects: state.objects,
        selectedObjectIds: state.selectedObjectIds,
    };
}
function getHistoryFlags() {
    return {
        canRedo: history_1.historyManager.canRedo,
        canUndo: history_1.historyManager.canUndo,
    };
}
function historyDescriptionForObject(kind, object) {
    if (kind === "create") {
        return `Create ${object.type}`;
    }
    if (kind === "delete") {
        return `Delete ${object.type}`;
    }
    return `Update ${object.type}`;
}
