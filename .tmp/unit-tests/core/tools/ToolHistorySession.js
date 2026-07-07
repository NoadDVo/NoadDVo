"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolHistorySession = void 0;
class ToolHistorySession {
    kind;
    description;
    open = false;
    constructor(kind, description) {
        this.kind = kind;
        this.description = description;
    }
    ensure(context) {
        if (this.open) {
            return;
        }
        context.beginHistoryTransaction(this.kind, this.description);
        this.open = true;
    }
    commit(context) {
        if (!this.open) {
            return;
        }
        context.commitHistoryTransaction();
        this.open = false;
    }
    cancel(context) {
        if (!this.open) {
            return;
        }
        context.cancelHistoryTransaction();
        this.open = false;
    }
}
exports.ToolHistorySession = ToolHistorySession;
