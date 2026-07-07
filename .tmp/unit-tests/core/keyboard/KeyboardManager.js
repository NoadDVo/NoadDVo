"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyboardManager = exports.KeyboardManager = void 0;
const geometryStore_1 = require("../../app/store/geometryStore");
const uiStore_1 = require("../../app/store/uiStore");
const viewportStore_1 = require("../../app/store/viewportStore");
const ToolManager_1 = require("../tools/ToolManager");
const KeyboardAction_1 = require("./KeyboardAction");
const KeyboardContext_1 = require("./KeyboardContext");
const ShortcutRegistry_1 = require("./ShortcutRegistry");
function keyToHoldKey(key) {
    if (key === " ") {
        return "space";
    }
    if (key === "alt") {
        return "alt";
    }
    if (key === "shift") {
        return "shift";
    }
    return null;
}
class KeyboardManager {
    registry;
    holdState = {
        alt: false,
        shift: false,
        space: false,
    };
    constructor(registry = new ShortcutRegistry_1.ShortcutRegistry(KeyboardAction_1.defaultKeyboardActions)) {
        this.registry = registry;
    }
    registerAction(action) {
        this.registry.register(action);
    }
    handleKeyDown(event) {
        const normalizedEvent = (0, ShortcutRegistry_1.normalizeKeyboardEvent)(event);
        const action = this.registry.match(normalizedEvent);
        const isEditableTarget = (0, KeyboardContext_1.isEditableKeyboardTarget)(event.target);
        if (isEditableTarget && !action?.allowInEditable) {
            return;
        }
        if (action) {
            if (normalizedEvent.repeat && action.repeatable === false) {
                event.preventDefault();
                return;
            }
            if (action.preventDefault) {
                event.preventDefault();
            }
            const holdKey = keyToHoldKey(normalizedEvent.key);
            if (holdKey) {
                this.holdState = {
                    ...this.holdState,
                    [holdKey]: true,
                };
            }
            action.execute({
                event,
                objects: geometryStore_1.useGeometryStore.getState().objects,
                selectedObjectIds: geometryStore_1.useGeometryStore.getState().selectedObjectIds,
            });
            return;
        }
        if (!isEditableTarget) {
            ToolManager_1.toolManager.keyDown(event);
        }
    }
    handleKeyUp(event) {
        const normalizedEvent = (0, ShortcutRegistry_1.normalizeKeyboardEvent)(event);
        const holdKey = keyToHoldKey(normalizedEvent.key);
        if (!holdKey) {
            return;
        }
        this.holdState = {
            ...this.holdState,
            [holdKey]: false,
        };
        if (holdKey === "space") {
            viewportStore_1.useViewportStore.getState().setSpacePressed(false);
        }
        if (holdKey === "alt") {
            viewportStore_1.useViewportStore.getState().setSnapTemporarilyDisabled(false);
        }
        this.updateKeyboardHint();
    }
    releaseHeldKeys() {
        this.holdState = {
            alt: false,
            shift: false,
            space: false,
        };
        viewportStore_1.useViewportStore.getState().setSpacePressed(false);
        viewportStore_1.useViewportStore.getState().setSnapTemporarilyDisabled(false);
        uiStore_1.useUiStore.getState().setKeyboardModeHint(null);
    }
    updateKeyboardHint() {
        const ui = uiStore_1.useUiStore.getState();
        if (this.holdState.space) {
            ui.setKeyboardModeHint("pan");
            return;
        }
        if (this.holdState.alt) {
            ui.setKeyboardModeHint("snap-off");
            return;
        }
        if (this.holdState.shift) {
            ui.setKeyboardModeHint("constraint");
            return;
        }
        ui.setKeyboardModeHint(null);
    }
}
exports.KeyboardManager = KeyboardManager;
exports.keyboardManager = new KeyboardManager();
