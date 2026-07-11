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

export function stylePartsToOptions(parts: TikzStyleParts): string[] {
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
    options.push(`draw opacity=${formatOpacity(parts.strokeOpacity)}`);
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

  return options;
}

export function formatStyleOptions(parts: TikzStyleParts): string {
  const options = stylePartsToOptions(parts);

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

function formatSectionLines(
  title: string,
  lines: readonly string[],
  includeComments: boolean,
): string[] {
  if (lines.length === 0) {
    return [];
  }

  return includeComments ? formatSection(title, lines) : [...lines];
}

function formatTikzPicture(
  options: TikzOptions,
  sections: TikzSceneSections,
): string[] {
  const lines: string[] = [];
  const pictureOptions =
    options.scale === 1 && options.mode === "minimal"
      ? ""
      : `[scale=${formatNumber(options.scale, 3)}]`;

  lines.push(`\\begin{tikzpicture}${pictureOptions}`);

  if (options.includeComments) {
    lines.push("");
  }

  lines.push(...formatSectionLines("Coordinates", sections.coordinates, options.includeComments));
  lines.push(...formatSectionLines("Filled regions", sections.fills, options.includeComments));
  lines.push(...formatSectionLines("Lines and shapes", sections.shapes, options.includeComments));
  lines.push(...formatSectionLines("Points", sections.points, options.includeComments));
  lines.push(...formatSectionLines("Labels", sections.labels, options.includeComments));
  lines.push(...formatSectionLines("Measurements", sections.measurements, options.includeComments));

  if (!options.includeComments) {
    lines.push("\\end{tikzpicture}");

    return lines;
  }

  const lastLine = lines[lines.length - 1];

  if (lastLine === "") {
    lines.pop();
  }

  lines.push("\\end{tikzpicture}");

  return lines;
}

function wrapStandaloneDocument(
  body: readonly string[],
  includeTikzLibraries: boolean,
): string {
  const lines = [
    "\\documentclass[tikz,border=5pt]{standalone}",
    "\\usepackage{tikz}",
    ...(includeTikzLibraries
      ? ["\\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}"]
      : []),
    "",
    "\\begin{document}",
    "",
    ...body,
    "",
    "\\end{document}",
  ];

  return lines.join("\n");
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
  if (options.outputType === "raw") {
    return [
      ...colorDefinitions,
      ...sections.coordinates,
      ...sections.fills,
      ...sections.shapes,
      ...sections.points,
      ...sections.labels,
      ...sections.measurements,
    ].join("\n");
  }

  const colorLines =
    colorDefinitions.length > 0
      ? options.includeComments
        ? ["% Colors", ...colorDefinitions, ""]
        : [...colorDefinitions]
      : [];

  const picture = [...colorLines, ...formatTikzPicture(options, sections)];

  return options.includeDocumentWrapper || options.outputType === "document"
    ? wrapStandaloneDocument(picture, options.includeTikzLibraries)
    : picture.join("\n");
}
