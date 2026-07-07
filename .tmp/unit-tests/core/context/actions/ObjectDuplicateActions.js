"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateObjectAction = void 0;
const clipboard_1 = require("../../clipboard");
const geometryTargets = ["point", "segment", "line", "ray", "vector", "circle", "polygon", "region", "arc", "angle", "text", "measurement"];
exports.duplicateObjectAction = {
    execute: () => {
        (0, clipboard_1.duplicateSelection)();
    },
    icon: "duplicate",
    id: "duplicate",
    isEnabled: (context) => context.selectedObjectIds.length > 0,
    shortcut: "Ctrl+D",
    targets: geometryTargets,
};
