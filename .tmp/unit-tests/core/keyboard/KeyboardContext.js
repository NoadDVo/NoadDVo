"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEditableKeyboardTarget = isEditableKeyboardTarget;
function isEditableKeyboardTarget(target) {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    return (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable ||
        target.getAttribute("role") === "textbox");
}
