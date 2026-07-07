"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldFollowGeneratedTikz = shouldFollowGeneratedTikz;
exports.getTikzPanelDisplayedCode = getTikzPanelDisplayedCode;
exports.getTikzPanelStatusText = getTikzPanelStatusText;
function shouldFollowGeneratedTikz({ autoUpdate, editable, manualEditsPending, }) {
    return autoUpdate || !editable || !manualEditsPending;
}
function getTikzPanelDisplayedCode(state) {
    return shouldFollowGeneratedTikz(state) ? state.generatedCode : state.draftCode;
}
function getTikzPanelStatusText({ autoUpdate, liveSyncEnabled, liveSyncStatus, manualEditsPending, }) {
    if (manualEditsPending) {
        return liveSyncEnabled ? `Manual edits pending - Live ${liveSyncStatus}` : "Manual edits pending";
    }
    if (autoUpdate) {
        return "Geometry -> TikZ";
    }
    return liveSyncEnabled ? `Live ${liveSyncStatus}` : "Live off";
}
