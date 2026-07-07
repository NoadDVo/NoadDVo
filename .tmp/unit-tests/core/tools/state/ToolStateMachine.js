"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolStateMachine = void 0;
const allowedTransitions = {
    cancelled: ["idle", "waitingInput"],
    completed: ["idle", "waitingInput"],
    idle: ["waitingInput", "cancelled"],
    preview: ["completed", "cancelled", "waitingInput"],
    waitingInput: ["preview", "completed", "cancelled", "waitingInput"],
};
class ToolStateMachine {
    toolId;
    previousState = null;
    state = "idle";
    updatedAt = Date.now();
    constructor(toolId) {
        this.toolId = toolId;
    }
    get current() {
        return this.state;
    }
    get snapshot() {
        return {
            previousState: this.previousState,
            reason: "reset",
            state: this.state,
            toolId: this.toolId,
            updatedAt: this.updatedAt,
        };
    }
    canTransition(nextState) {
        return this.state === nextState || allowedTransitions[this.state].includes(nextState);
    }
    transition(nextState, reason) {
        if (!this.canTransition(nextState)) {
            throw new Error(`Invalid ${this.toolId} tool transition: ${this.state} -> ${nextState}.`);
        }
        this.previousState = this.state;
        this.state = nextState;
        this.updatedAt = Date.now();
        return {
            previousState: this.previousState,
            reason,
            state: this.state,
            toolId: this.toolId,
            updatedAt: this.updatedAt,
        };
    }
    reset(reason = "reset") {
        this.previousState = this.state;
        this.state = "idle";
        this.updatedAt = Date.now();
        return {
            previousState: this.previousState,
            reason,
            state: this.state,
            toolId: this.toolId,
            updatedAt: this.updatedAt,
        };
    }
}
exports.ToolStateMachine = ToolStateMachine;
