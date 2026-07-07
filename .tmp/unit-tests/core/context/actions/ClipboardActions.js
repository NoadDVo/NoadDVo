"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clipboardContextMenuActions = void 0;
const clipboard_1 = require("../../clipboard");
const tikz_1 = require("../../tikz");
const geometryTargets = ["point", "segment", "line", "ray", "vector", "circle", "polygon", "region", "arc", "angle", "text", "measurement"];
exports.clipboardContextMenuActions = [
    {
        execute: () => {
            (0, clipboard_1.copySelectionToGeometryClipboard)();
        },
        icon: "clipboard",
        id: "copy",
        isEnabled: (context) => context.selectedObjectIds.length > 0,
        shortcut: "Ctrl+C",
        targets: geometryTargets,
    },
    {
        execute: () => {
            (0, clipboard_1.cutSelectionToGeometryClipboard)();
        },
        icon: "clipboard",
        id: "cut",
        isEnabled: (context) => context.selectedObjectIds.length > 0,
        shortcut: "Ctrl+X",
        targets: geometryTargets,
    },
    {
        execute: () => {
            (0, clipboard_1.pasteGeometryClipboard)();
        },
        icon: "paste",
        id: "paste",
        isEnabled: () => (0, clipboard_1.hasGeometryClipboard)(),
        shortcut: "Ctrl+V",
        targets: ["canvas", ...geometryTargets],
    },
    {
        execute: async (context) => {
            const code = (0, tikz_1.generateTikz)(context.objects, "academic").code;
            await navigator.clipboard.writeText(code);
        },
        icon: "tikz",
        id: "copy-tikz",
        shortcut: "Ctrl+C",
        targets: geometryTargets,
    },
];
