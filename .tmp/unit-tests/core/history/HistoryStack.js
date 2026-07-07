"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryStack = void 0;
class HistoryStack {
    undoEntries = [];
    redoEntries = [];
    clear() {
        this.undoEntries.length = 0;
        this.redoEntries.length = 0;
    }
    get canUndo() {
        return this.undoEntries.length > 0;
    }
    get canRedo() {
        return this.redoEntries.length > 0;
    }
    get undoCount() {
        return this.undoEntries.length;
    }
    get redoCount() {
        return this.redoEntries.length;
    }
    push(action) {
        this.undoEntries.push(action);
        this.redoEntries.length = 0;
    }
    undo() {
        const action = this.undoEntries.pop();
        if (!action) {
            return null;
        }
        this.redoEntries.push(action);
        return action;
    }
    redo() {
        const action = this.redoEntries.pop();
        if (!action) {
            return null;
        }
        this.undoEntries.push(action);
        return action;
    }
}
exports.HistoryStack = HistoryStack;
