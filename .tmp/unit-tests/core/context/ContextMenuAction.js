"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultContextMenuActions = void 0;
const CanvasActions_1 = require("./actions/CanvasActions");
const ClipboardActions_1 = require("./actions/ClipboardActions");
const ObjectActions_1 = require("./actions/ObjectActions");
const ProjectActions_1 = require("./actions/ProjectActions");
exports.defaultContextMenuActions = [
    ...CanvasActions_1.canvasContextMenuActions,
    ...ObjectActions_1.objectContextMenuActions,
    ...ClipboardActions_1.clipboardContextMenuActions,
    ...ProjectActions_1.projectContextMenuActions,
];
