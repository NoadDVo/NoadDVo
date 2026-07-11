"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VECTOR_ARROW_SIZE = exports.DEFAULT_VECTOR_ARROW_STYLE = void 0;
exports.getVectorArrowStyle = getVectorArrowStyle;
exports.getVectorArrowSize = getVectorArrowSize;
exports.vectorArrowStyleToTikz = vectorArrowStyleToTikz;
exports.DEFAULT_VECTOR_ARROW_STYLE = "latex";
exports.DEFAULT_VECTOR_ARROW_SIZE = 8;
const arrowStyles = new Set([
    "latex",
    "stealth",
    "triangle",
    "none",
]);
function readMetadataString(object, key) {
    const value = object.metadata?.[key];
    return typeof value === "string" ? value : null;
}
function readMetadataNumber(object, key) {
    const value = object.metadata?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function getVectorArrowStyle(object) {
    const value = readMetadataString(object, "arrowStyle");
    return value && arrowStyles.has(value)
        ? value
        : exports.DEFAULT_VECTOR_ARROW_STYLE;
}
function getVectorArrowSize(object) {
    return Math.max(1, readMetadataNumber(object, "arrowSize") ?? exports.DEFAULT_VECTOR_ARROW_SIZE);
}
function vectorArrowStyleToTikz(style, size) {
    if (style === "none") {
        return null;
    }
    const tikzStyle = style === "latex"
        ? "Latex"
        : style === "stealth"
            ? "Stealth"
            : "Triangle";
    return size && Number.isFinite(size) && size !== exports.DEFAULT_VECTOR_ARROW_SIZE
        ? `-{${tikzStyle}[length=${Math.max(1, size).toFixed(1)}pt]}`
        : `-{${tikzStyle}}`;
}
