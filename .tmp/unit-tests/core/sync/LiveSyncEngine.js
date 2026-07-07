"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVE_TIKZ_SYNC_DEBOUNCE_MS = void 0;
exports.createSyncHash = createSyncHash;
exports.createLiveSyncStamp = createLiveSyncStamp;
exports.isSameSyncCycle = isSameSyncCycle;
exports.shouldAutoApplyPreview = shouldAutoApplyPreview;
exports.createLiveGeometryToTikz = createLiveGeometryToTikz;
exports.createLiveTikzToGeometry = createLiveTikzToGeometry;
const tikz_1 = require("../tikz");
const TikzApplyPreview_1 = require("./TikzApplyPreview");
exports.LIVE_TIKZ_SYNC_DEBOUNCE_MS = 400;
function createSyncHash(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = Math.imul(31, hash) + value.charCodeAt(index);
        hash |= 0;
    }
    return hash.toString(36);
}
function createLiveSyncStamp({ direction, origin, value, }) {
    return {
        direction,
        hash: createSyncHash(value),
        origin,
        timestamp: Date.now(),
    };
}
function isSameSyncCycle(previous, next) {
    return Boolean(previous &&
        previous.direction === next.direction &&
        previous.hash === next.hash &&
        previous.origin === next.origin);
}
function shouldAutoApplyPreview(preview) {
    return (preview.canApply &&
        preview.applyResult.status === "ready" &&
        preview.groups.conflicts.length === 0 &&
        preview.groups.warnings.length === 0 &&
        preview.groups.deletes.length === 0 &&
        !preview.requiresDestructiveConfirmation &&
        !preview.requiresPartialConfirmation);
}
function createLiveGeometryToTikz({ mode, objects, origin, }) {
    const tikz = (0, tikz_1.generateTikz)(objects, mode);
    return {
        stamp: createLiveSyncStamp({
            direction: "geometry-to-tikz",
            origin,
            value: tikz.code,
        }),
        tikz,
    };
}
function createLiveTikzToGeometry({ currentObjects, origin, source, }) {
    const preview = (0, TikzApplyPreview_1.createTikzApplyPreview)({
        currentObjects,
        source,
    });
    return {
        autoApplicable: shouldAutoApplyPreview(preview),
        preview,
        stamp: createLiveSyncStamp({
            direction: "tikz-to-geometry",
            origin,
            value: source,
        }),
    };
}
