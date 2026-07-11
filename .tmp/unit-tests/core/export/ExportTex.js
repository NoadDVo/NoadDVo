"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapTikzInStandaloneDocument = wrapTikzInStandaloneDocument;
const DEFAULT_TIKZ_LIBRARIES = "calc,angles,quotes,intersections,arrows.meta";
function wrapTikzInStandaloneDocument(tikzCode) {
    return [
        "\\documentclass[tikz,border=5pt]{standalone}",
        "\\usepackage{tikz}",
        `\\usetikzlibrary{${DEFAULT_TIKZ_LIBRARIES}}`,
        "",
        "\\begin{document}",
        "",
        tikzCode.trim(),
        "",
        "\\end{document}",
        "",
    ].join("\n");
}
