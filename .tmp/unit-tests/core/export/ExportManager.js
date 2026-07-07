"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportManager = exports.ExportManager = void 0;
const tikz_1 = require("../tikz");
const ExportJson_1 = require("./ExportJson");
const ExportSvg_1 = require("./ExportSvg");
const ExportTex_1 = require("./ExportTex");
const mimeTypes = {
    json: "application/json;charset=utf-8",
    svg: "image/svg+xml;charset=utf-8",
    tex: "application/x-tex;charset=utf-8",
    tikz: "text/plain;charset=utf-8",
};
function createTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}
function downloadText(content, filename, format) {
    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
function defaultFilename(extension) {
    return `noaddvo-geometry-${createTimestamp()}.${extension}`;
}
class ExportManager {
    copyTikzToClipboard(objects, mode = "academic") {
        const tikz = (0, tikz_1.generateTikz)(objects, mode).code;
        return navigator.clipboard.writeText(tikz);
    }
    exportTikz(objects, mode = "academic") {
        const tikz = (0, tikz_1.generateTikz)(objects, mode).code;
        downloadText(tikz, defaultFilename("tex"), "tikz");
    }
    exportTex(objects, mode = "academic") {
        const tikz = (0, tikz_1.generateTikz)(objects, mode).code;
        const tex = (0, ExportTex_1.wrapTikzInStandaloneDocument)(tikz);
        downloadText(tex, defaultFilename("tex"), "tex");
    }
    exportJson(snapshot) {
        downloadText((0, ExportJson_1.exportProjectJson)(snapshot), defaultFilename("ndv"), "json");
    }
    exportProjectText(content, filename = defaultFilename("ndv")) {
        downloadText(content, filename, "json");
    }
    exportSvg(svgElement) {
        downloadText((0, ExportSvg_1.exportSvgElement)(svgElement), defaultFilename("svg"), "svg");
    }
}
exports.ExportManager = ExportManager;
exports.exportManager = new ExportManager();
