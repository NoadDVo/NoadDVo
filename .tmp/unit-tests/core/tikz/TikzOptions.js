"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_TIKZ_OPTIONS = void 0;
exports.getTikzOptions = getTikzOptions;
exports.DEFAULT_TIKZ_OPTIONS = {
    coordinatePrecision: 3,
    exportAxes: false,
    exportGrid: false,
    exportLabels: true,
    exportPoints: true,
    includeColorDefinitions: true,
    includeComments: true,
    includeDocumentWrapper: false,
    includeTikzLibraries: true,
    mode: "academic",
    outputType: "snippet",
    preferTkzEuclide: false,
    preserveColors: true,
    preserveStyle: true,
    scale: 1,
    showHiddenObjects: false,
    usePointNames: true,
};
function getTikzOptions(mode = "academic") {
    if (mode === "minimal") {
        return {
            ...exports.DEFAULT_TIKZ_OPTIONS,
            exportLabels: false,
            exportPoints: false,
            includeColorDefinitions: false,
            includeComments: false,
            mode,
            preserveColors: false,
            preserveStyle: false,
        };
    }
    if (mode === "colorful") {
        return {
            ...exports.DEFAULT_TIKZ_OPTIONS,
            mode,
            preserveColors: true,
            preserveStyle: true,
        };
    }
    if (mode === "olympiad") {
        return {
            ...exports.DEFAULT_TIKZ_OPTIONS,
            includeColorDefinitions: false,
            mode,
            preserveColors: false,
            preserveStyle: false,
        };
    }
    return exports.DEFAULT_TIKZ_OPTIONS;
}
