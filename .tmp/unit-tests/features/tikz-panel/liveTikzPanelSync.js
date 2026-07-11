"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLiveTikzPanelSync = runLiveTikzPanelSync;
const sync_1 = require("../../core/sync");
function runLiveTikzPanelSync({ commitObjects, currentObjects, lastStamp, source, }) {
    const liveResult = (0, sync_1.createLiveTikzToGeometry)({
        currentObjects,
        origin: "tikz-editor",
        source,
    });
    if (!liveResult.autoApplicable) {
        return {
            preview: liveResult.preview,
            stamp: liveResult.stamp,
            status: "blocked",
        };
    }
    if (liveResult.preview.applyResult.changedObjectIds.length === 0) {
        return {
            preview: liveResult.preview,
            stamp: liveResult.stamp,
            status: "unchanged",
        };
    }
    if ((0, sync_1.isSameSyncCycle)(lastStamp, liveResult.stamp)) {
        return {
            preview: liveResult.preview,
            stamp: liveResult.stamp,
            status: "loop",
        };
    }
    const committed = commitObjects(liveResult.preview.applyResult.objectRecord, liveResult.preview.applyResult.changedObjectIds);
    return {
        preview: liveResult.preview,
        stamp: liveResult.stamp,
        status: committed ? "applied" : "commit-failed",
    };
}
