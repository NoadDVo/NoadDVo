"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyboardEventRouter = exports.KeyboardEventRouter = void 0;
const KeyboardManager_1 = require("./KeyboardManager");
class KeyboardEventRouter {
    manager;
    attachedTarget = null;
    handleKeyDown = (event) => {
        this.manager.handleKeyDown(event);
    };
    handleKeyUp = (event) => {
        this.manager.handleKeyUp(event);
    };
    handleBlur = () => {
        this.manager.releaseHeldKeys();
    };
    constructor(manager = KeyboardManager_1.keyboardManager) {
        this.manager = manager;
    }
    attach(target = window) {
        if (this.attachedTarget === target) {
            return;
        }
        this.detach();
        this.attachedTarget = target;
        target.addEventListener("keydown", this.handleKeyDown);
        target.addEventListener("keyup", this.handleKeyUp);
        target.addEventListener("blur", this.handleBlur);
    }
    detach() {
        if (!this.attachedTarget) {
            return;
        }
        this.attachedTarget.removeEventListener("keydown", this.handleKeyDown);
        this.attachedTarget.removeEventListener("keyup", this.handleKeyUp);
        this.attachedTarget.removeEventListener("blur", this.handleBlur);
        this.manager.releaseHeldKeys();
        this.attachedTarget = null;
    }
}
exports.KeyboardEventRouter = KeyboardEventRouter;
exports.keyboardEventRouter = new KeyboardEventRouter();
