"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHistoryTests = runHistoryTests;
const history_1 = require("../../core/history");
const assert_1 = require("../assert");
const emptySnapshot = {
    objects: {},
    selectedObjectIds: [],
};
const selectedSnapshot = {
    objects: {},
    selectedObjectIds: ["a"],
};
function runHistoryTests() {
    const history = new history_1.HistoryManager();
    history.beginTransaction("create", "Create object", emptySnapshot);
    history.record("create", "Ignored inside transaction", emptySnapshot, selectedSnapshot);
    history.commitTransaction(selectedSnapshot);
    (0, assert_1.assert)(history.canUndo, "committed transaction creates one undo entry");
    (0, assert_1.assertEqual)(history.undoCount, 1, "transaction records one history action");
    (0, assert_1.assertEqual)(history.redoCount, 0, "redo stack starts empty");
    (0, assert_1.assertEqual)(history.undo()?.description, "Create object", "undo returns transaction action");
    (0, assert_1.assert)(history.canRedo, "undo creates redo availability");
}
