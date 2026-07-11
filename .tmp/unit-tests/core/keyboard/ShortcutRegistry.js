"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutRegistry = void 0;
exports.normalizeKeyboardEvent = normalizeKeyboardEvent;
function normalizeShortcutKey(key) {
    if (key === "Spacebar" || key === " ") {
        return " ";
    }
    return key.toLowerCase();
}
function modifierMatches(expected, actual) {
    return Boolean(expected) === actual;
}
function primaryModifierMatches(shortcut, event) {
    if (shortcut.ctrl === true && shortcut.meta === undefined) {
        return event.ctrlKey || event.metaKey;
    }
    return (modifierMatches(shortcut.ctrl, event.ctrlKey) &&
        modifierMatches(shortcut.meta, event.metaKey));
}
function normalizeKeyboardEvent(event) {
    return {
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        key: normalizeShortcutKey(event.key),
        metaKey: event.metaKey,
        repeat: event.repeat,
        shiftKey: event.shiftKey,
    };
}
class ShortcutRegistry {
    actions = new Map();
    constructor(actions = []) {
        actions.forEach((action) => this.register(action));
    }
    register(action) {
        this.actions.set(action.id, action);
    }
    getAction(actionId) {
        return this.actions.get(actionId) ?? null;
    }
    match(event) {
        for (const action of this.actions.values()) {
            if (this.matchesShortcut(action.shortcut, event)) {
                return action;
            }
        }
        return null;
    }
    matchesShortcut(shortcut, event) {
        return (normalizeShortcutKey(shortcut.key) === event.key &&
            primaryModifierMatches(shortcut, event) &&
            (event.key === "shift" || modifierMatches(shortcut.shift, event.shiftKey)) &&
            (event.key === "alt" || modifierMatches(shortcut.alt, event.altKey)));
    }
}
exports.ShortcutRegistry = ShortcutRegistry;
