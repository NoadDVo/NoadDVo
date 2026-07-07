"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copySelectionToGeometryClipboard = copySelectionToGeometryClipboard;
exports.pasteGeometryClipboard = pasteGeometryClipboard;
exports.duplicateSelection = duplicateSelection;
exports.cutSelectionToGeometryClipboard = cutSelectionToGeometryClipboard;
exports.hasGeometryClipboard = hasGeometryClipboard;
exports.getGeometryClipboardSnapshot = getGeometryClipboardSnapshot;
const geometryStore_1 = require("../../app/store/geometryStore");
let clipboardPayload = null;
let clipboardCounter = 0;
function createClipboardId(object) {
    clipboardCounter += 1;
    return `${object.type}-paste-${Date.now().toString(36)}-${clipboardCounter}`;
}
function collectDependencyClosure(objects, selectedObjectIds) {
    const collected = new Set();
    const visit = (objectId) => {
        if (collected.has(objectId)) {
            return;
        }
        const object = objects[objectId];
        if (!object) {
            return;
        }
        collected.add(objectId);
        object.dependencies.forEach(visit);
    };
    selectedObjectIds.forEach(visit);
    return Array.from(collected);
}
function cloneObject(value) {
    return JSON.parse(JSON.stringify(value));
}
function remapValue(value, idMap) {
    if (typeof value === "string") {
        return idMap.get(value) ?? value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => remapValue(item, idMap));
    }
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, remapValue(entry, idMap)]));
    }
    return value;
}
function offsetPointIfNeeded(object, offset) {
    if (object.type !== "point") {
        return object;
    }
    const point = object;
    return {
        ...point,
        x: point.x + offset.x,
        y: point.y + offset.y,
    };
}
function instantiateClipboardObjects(payload, offset = { x: 0.5, y: 0.5 }) {
    const idMap = new Map(payload.objects.map((object) => [object.id, createClipboardId(object)]));
    const now = Date.now();
    const objects = payload.objects.map((object) => {
        const remapped = remapValue(cloneObject(object), idMap);
        const nextObject = offsetPointIfNeeded(remapped, offset);
        return {
            ...nextObject,
            createdAt: now,
            dependents: [],
            locked: false,
            name: nextObject.name ? `${nextObject.name}'` : nextObject.name,
            updatedAt: now,
            visible: true,
        };
    });
    return {
        objects,
        rootObjectIds: payload.rootObjectIds
            .map((objectId) => idMap.get(objectId))
            .filter((objectId) => Boolean(objectId)),
    };
}
function copySelectionToGeometryClipboard() {
    const geometry = geometryStore_1.useGeometryStore.getState();
    const selectedIds = geometry.selectedObjectIds.filter((objectId) => {
        const object = geometry.objects[objectId];
        return object && object.visible;
    });
    if (selectedIds.length === 0) {
        return false;
    }
    const objectIds = collectDependencyClosure(geometry.objects, selectedIds);
    const objects = objectIds
        .map((objectId) => geometry.objects[objectId])
        .filter((object) => Boolean(object));
    clipboardPayload = {
        copiedAt: Date.now(),
        objects,
        rootObjectIds: selectedIds,
    };
    return true;
}
function pasteGeometryClipboard() {
    if (!clipboardPayload) {
        return false;
    }
    const geometry = geometryStore_1.useGeometryStore.getState();
    const instantiated = instantiateClipboardObjects(clipboardPayload);
    if (instantiated.objects.length === 0) {
        return false;
    }
    return geometry.setObjects({
        ...geometry.objects,
        ...Object.fromEntries(instantiated.objects.map((object) => [object.id, object])),
    }, "Paste geometry", instantiated.rootObjectIds);
}
function duplicateSelection() {
    if (!copySelectionToGeometryClipboard()) {
        return false;
    }
    return pasteGeometryClipboard();
}
function cutSelectionToGeometryClipboard() {
    const geometry = geometryStore_1.useGeometryStore.getState();
    const selectedIds = [...geometry.selectedObjectIds];
    if (!copySelectionToGeometryClipboard()) {
        return false;
    }
    geometry.beginHistoryTransaction("delete", "Cut geometry");
    selectedIds.forEach((objectId) => {
        const object = geometryStore_1.useGeometryStore.getState().objects[objectId];
        if (object && !object.locked) {
            geometryStore_1.useGeometryStore.getState().deleteObject(objectId);
        }
    });
    geometry.commitHistoryTransaction();
    return true;
}
function hasGeometryClipboard() {
    return Boolean(clipboardPayload);
}
function getGeometryClipboardSnapshot() {
    return clipboardPayload;
}
