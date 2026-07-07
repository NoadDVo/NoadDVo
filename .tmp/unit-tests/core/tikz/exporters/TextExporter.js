"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
function escapePlainText(content) {
    return content
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/([%&#_$])/g, "\\$1")
        .replace(/\{/g, "\\{")
        .replace(/\}/g, "\\}");
}
function textContentForTikz(object) {
    if (object.textMode === "plain") {
        return escapePlainText(object.content);
    }
    if (object.textMode === "math" ||
        object.textMode === "coordinate-label" ||
        object.textMode === "measurement-label") {
        const trimmed = object.content.trim();
        return trimmed.startsWith("$") && trimmed.endsWith("$")
            ? trimmed
            : `$${trimmed}$`;
    }
    return object.content;
}
function alignmentToAnchor(alignment) {
    if (alignment === "center") {
        return "center";
    }
    return alignment === "right" ? "east" : "west";
}
function attachmentAnchor(object) {
    const attachment = (0, geometry_1.getTextAttachment)(object);
    if (!attachment) {
        return null;
    }
    if (attachment.placement.includes("above")) {
        return attachment.placement.includes("left")
            ? "south east"
            : attachment.placement.includes("right")
                ? "south west"
                : "south";
    }
    if (attachment.placement.includes("below")) {
        return attachment.placement.includes("left")
            ? "north east"
            : attachment.placement.includes("right")
                ? "north west"
                : "north";
    }
    if (attachment.placement === "left") {
        return "east";
    }
    if (attachment.placement === "right") {
        return "west";
    }
    return "center";
}
exports.TextExporter = {
    exportObject: (object, context) => {
        const position = (0, geometry_1.getTextPosition)(object, context.scene.objects);
        const color = context.options.preserveColors
            ? context.colorRegistry.getColorName(object.style.stroke)
            : null;
        const fontSize = (0, geometry_1.getTextFontSize)(object);
        const opacity = (0, geometry_1.getTextOpacity)(object);
        const rotation = (0, geometry_1.getTextRotation)(object);
        const options = [
            `anchor=${attachmentAnchor(object) ?? alignmentToAnchor((0, geometry_1.getTextAlignment)(object))}`,
            ...(color ? [`text=${color}`] : []),
            ...(opacity < 1 ? [`opacity=${(0, TikzFormatter_1.formatNumber)(opacity, 3)}`] : []),
            ...(rotation !== 0 ? [`rotate=${(0, TikzFormatter_1.formatNumber)(rotation, 2)}`] : []),
            `font=\\fontsize{${(0, TikzFormatter_1.formatNumber)(fontSize, 2)}}{${(0, TikzFormatter_1.formatNumber)(fontSize * 1.2, 2)}}\\selectfont`,
        ];
        context.scene.sections.labels.push(`\\node${(0, TikzFormatter_1.formatTikzOptions)(options)} at ${(0, TikzFormatter_1.formatPoint)(position, context.options.coordinatePrecision)} {${textContentForTikz(object)}};`);
    },
    objectType: "text",
};
