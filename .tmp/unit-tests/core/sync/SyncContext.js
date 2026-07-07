"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSyncContext = createSyncContext;
exports.buildSyncIntermediateScene = buildSyncIntermediateScene;
const tikz_1 = require("../tikz");
function createSourceId(direction) {
    return `sync-${direction}-${Date.now().toString(36)}`;
}
function createSyncContext({ direction, sourceId = createSourceId(direction), tikzOptions = (0, tikz_1.getTikzOptions)("academic"), }) {
    return {
        createdAt: Date.now(),
        direction,
        sourceId,
        tikzOptions,
    };
}
function objectName(object) {
    return "name" in object ? object.name : undefined;
}
function objectSignature(object) {
    return [
        object.type,
        objectName(object) ?? "",
        object.dependencies.join(","),
    ].join(":");
}
function buildSyncIntermediateScene(objects, source) {
    const objectList = Array.isArray(objects) ? objects : Object.values(objects);
    const syncObjects = objectList
        .map((object) => ({
        dependencies: object.dependencies,
        objectId: object.id,
        objectType: object.type,
        signature: objectSignature(object),
        source,
        ...(object.type === "point" && object.name ? { tikzName: object.name } : {}),
    }))
        .sort((first, second) => first.objectId.localeCompare(second.objectId));
    return {
        objects: syncObjects,
        source,
    };
}
