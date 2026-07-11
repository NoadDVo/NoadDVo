"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneHistorySnapshot = cloneHistorySnapshot;
exports.snapshotsEqual = snapshotsEqual;
function cloneHistorySnapshot(snapshot) {
    return {
        objects: { ...snapshot.objects },
        selectedObjectIds: [...snapshot.selectedObjectIds],
    };
}
function snapshotsEqual(first, second) {
    const firstKeys = Object.keys(first.objects);
    const secondKeys = Object.keys(second.objects);
    if (firstKeys.length !== secondKeys.length) {
        return false;
    }
    if (first.selectedObjectIds.length !== second.selectedObjectIds.length) {
        return false;
    }
    for (const key of firstKeys) {
        if (first.objects[key] !== second.objects[key]) {
            return false;
        }
    }
    return first.selectedObjectIds.every((objectId, index) => objectId === second.selectedObjectIds[index]);
}
