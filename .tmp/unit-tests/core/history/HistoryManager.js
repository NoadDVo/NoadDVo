"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyManager = exports.HistoryManager = void 0;
const HistoryAction_1 = require("./HistoryAction");
const HistoryStack_1 = require("./HistoryStack");
let historyActionCounter = 0;
function createHistoryActionId() {
    historyActionCounter += 1;
    return `history-${Date.now().toString(36)}-${historyActionCounter}`;
}
class HistoryManager {
    stack = new HistoryStack_1.HistoryStack();
    transaction = null;
    get canUndo() {
        return this.stack.canUndo;
    }
    get canRedo() {
        return this.stack.canRedo;
    }
    get undoCount() {
        return this.stack.undoCount;
    }
    get redoCount() {
        return this.stack.redoCount;
    }
    clear() {
        this.stack.clear();
        this.transaction = null;
    }
    record(kind, description, before, after) {
        if (this.transaction) {
            return;
        }
        this.pushAction(kind, description, before, after);
    }
    beginTransaction(kind, description, before) {
        if (this.transaction) {
            return;
        }
        this.transaction = {
            before: (0, HistoryAction_1.cloneHistorySnapshot)(before),
            description,
            kind,
        };
    }
    commitTransaction(after) {
        if (!this.transaction) {
            return;
        }
        const transaction = this.transaction;
        this.transaction = null;
        this.pushAction(transaction.kind, transaction.description, transaction.before, after);
    }
    cancelTransaction() {
        this.transaction = null;
    }
    undo() {
        return this.stack.undo();
    }
    redo() {
        return this.stack.redo();
    }
    pushAction(kind, description, before, after) {
        const normalizedBefore = (0, HistoryAction_1.cloneHistorySnapshot)(before);
        const normalizedAfter = (0, HistoryAction_1.cloneHistorySnapshot)(after);
        if ((0, HistoryAction_1.snapshotsEqual)(normalizedBefore, normalizedAfter)) {
            return;
        }
        this.stack.push({
            after: normalizedAfter,
            before: normalizedBefore,
            description,
            id: createHistoryActionId(),
            kind,
            timestamp: Date.now(),
        });
    }
}
exports.HistoryManager = HistoryManager;
exports.historyManager = new HistoryManager();
