import type { GeometryStyle, Point2D } from "../geometry";
import type { TikzOptions } from "./TikzOptions";
import type { TikzSceneSections, TikzStyleParts } from "./TikzTypes";

export function formatNumber(value: number, precision = 3): string {
  const rounded = Number(value.toFixed(precision));

  if (Object.is(rounded, -0)) {
    return "0";
  }

  const text = String(rounded);

  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

export function formatPoint(point: Point2D, precision = 3): string {
  return `(${formatNumber(point.x, precision)},${formatNumber(point.y, precision)})`;
}

function formatOpacity(value: number): string {
  return formatNumber(Math.min(1, Math.max(0, value)), 3);
}

function strokeWidthToPt(widthPx: number): string {
  return `${formatNumber(Math.max(1, widthPx) * 0.4, 2)}pt`;
}

function dashToTikz(dash: GeometryStyle["dash"]): string | null {
  if (dash === "dashed") {
    return "dashed";
  }

  if (dash === "dotted") {
    return "dotted";
  }

  return null;
}

export function formatTikzOptions(options: readonly string[]): string {
  const cleanOptions = options.filter(Boolean);

  return cleanOptions.length > 0 ? `[${cleanOptions.join(", ")}]` : "";
}

export function formatStyleOptions(parts: TikzStyleParts): string {
  const options: string[] = [];

  if (parts.draw) {
    options.push(`draw=${parts.draw}`);
  }

  if (parts.fill) {
    options.push(`fill=${parts.fill}`);
  }

  if (parts.lineWidth) {
    options.push(`line width=${parts.lineWidth}`);
  }

  if (parts.strokeOpacity !== undefined && parts.strokeOpacity < 1) {
    options.push(`opacity=${formatOpacity(parts.strokeOpacity)}`);
  }

  if (parts.fillOpacity !== undefined && parts.fillOpacity < 1) {
    options.push(`fill opacity=${formatOpacity(parts.fillOpacity)}`);
  }

  if (parts.dash) {
    const dash = dashToTikz(parts.dash);

    if (dash) {
      options.push(dash);
    }
  }

  return formatTikzOptions(options);
}

export function styleToTikzParts(
  style: GeometryStyle,
  options: TikzOptions,
  colorFor: (color: string) => string | null,
): TikzStyleParts {
  if (!options.preserveStyle) {
    return {};
  }

  const draw = options.preserveColors ? colorFor(style.stroke) : null;
  const fill =
    options.preserveColors && style.fill !== "transparent"
      ? colorFor(style.fill)
      : null;

  return {
    ...(draw ? { draw } : {}),
    ...(fill ? { fill } : {}),
    dash: style.dash,
    fillOpacity: style.fillOpacity,
    lineWidth: strokeWidthToPt(style.strokeWidth),
    strokeOpacity: style.strokeOpacity,
  };
}

function formatSection(title: string, lines: readonly string[]): string[] {
  if (lines.length === 0) {
    return [];
  }

  return [`% ${title}`, ...lines, ""];
}

export function formatTikzDocument({
  colorDefinitions,
  options,
  sections,
}: {
  readonly colorDefinitions: readonly string[];
  readonly options: TikzOptions;
  readonly sections: TikzSceneSections;
}): string {
  const lines: string[] = [];

  if (colorDefinitions.length > 0) {
    lines.push("% Colors", ...colorDefinitions, "");
  }

  lines.push(`\\begin{tikzpicture}[scale=${formatNumber(options.scale, 3)}]`, "");
  lines.push(...formatSection("Coordinates", sections.coordinates));
  lines.push(...formatSection("Shapes", sections.shapes));
  lines.push(...formatSection("Points", sections.points));
  lines.push(...formatSection("Labels", sections.labels));
  lines.push("\\end{tikzpicture}");

  return lines.join("\n");
}
