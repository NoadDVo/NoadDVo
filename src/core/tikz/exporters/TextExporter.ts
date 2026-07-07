import {
  getTextAlignment,
  getTextAttachment,
  getTextFontSize,
  getTextOpacity,
  getTextPosition,
  getTextRotation,
  type TextObject,
} from "../../geometry";
import {
  formatNumber,
  formatPoint,
  formatTikzOptions,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

function escapePlainText(content: string): string {
  return content
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([%&#_$])/g, "\\$1")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

function textContentForTikz(object: TextObject): string {
  if (object.textMode === "plain") {
    return escapePlainText(object.content);
  }

  if (
    object.textMode === "math" ||
    object.textMode === "coordinate-label" ||
    object.textMode === "measurement-label"
  ) {
    const trimmed = object.content.trim();

    return trimmed.startsWith("$") && trimmed.endsWith("$")
      ? trimmed
      : `$${trimmed}$`;
  }

  return object.content;
}

function alignmentToAnchor(alignment: ReturnType<typeof getTextAlignment>): string {
  if (alignment === "center") {
    return "center";
  }

  return alignment === "right" ? "east" : "west";
}

function attachmentAnchor(object: TextObject): string | null {
  const attachment = getTextAttachment(object);

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

export const TextExporter: TikzObjectExporter<TextObject> = {
  exportObject: (object, context) => {
    const position = getTextPosition(object, context.scene.objects);
    const color = context.options.preserveColors
      ? context.colorRegistry.getColorName(object.style.stroke)
      : null;
    const fontSize = getTextFontSize(object);
    const opacity = getTextOpacity(object);
    const rotation = getTextRotation(object);
    const options = [
      `anchor=${attachmentAnchor(object) ?? alignmentToAnchor(getTextAlignment(object))}`,
      ...(color ? [`text=${color}`] : []),
      ...(opacity < 1 ? [`opacity=${formatNumber(opacity, 3)}`] : []),
      ...(rotation !== 0 ? [`rotate=${formatNumber(rotation, 2)}`] : []),
      `font=\\fontsize{${formatNumber(fontSize, 2)}}{${formatNumber(fontSize * 1.2, 2)}}\\selectfont`,
    ];

    context.scene.sections.labels.push(
      `\\node${formatTikzOptions(options)} at ${formatPoint(position, context.options.coordinatePrecision)} {${textContentForTikz(object)}};`,
    );
  },
  objectType: "text",
};
