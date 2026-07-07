"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
const ToolStateMachine_1 = require("./state/ToolStateMachine");
class BaseTool {
    id;
    name;
    cursor;
    shortcut;
    stateMachine;
    constructor({ cursor = "crosshair", id, name, shortcut }) {
        this.cursor = cursor;
        this.id = id;
        this.name = name;
        this.shortcut = shortcut;
        this.stateMachine = new ToolStateMachine_1.ToolStateMachine(id);
    }
    get state() {
        return this.stateMachine.current;
    }
    activate(_context) {
        this.resetState("activate");
        this.transitionState("waitingInput", "await-input");
    }
    deactivate(_context) {
        this.transitionState("cancelled", "cancel");
        this.resetState("reset");
    }
    pointerDown(_event, _context) { }
    pointerMove(_event, _context) { }
    pointerUp(_event, _context) { }
    keyDown(_event, _context) { }
    cancel(_context) {
        this.transitionState("cancelled", "cancel");
        this.resetState("reset");
    }
    renderPreview(_context) {
        return null;
    }
    transitionState(nextState, reason) {
        this.stateMachine.transition(nextState, reason);
    }
    resetState(reason = "reset") {
        this.stateMachine.reset(reason);
    }
}
exports.BaseTool = BaseTool;
