import type { GeometryStyle, Point2D } from "../geometry";
import type { TikzOptions } from "./TikzOptions";
import type { TikzSceneSections, TikzStyleParts, TikzExportContext } from "./TikzTypes";

export function getTikzPointReference(objectId: string, context: TikzExportContext): string | null {
  const name = context.nameRegistry.getPointName(objectId);
  if (name) return name;
  
  const obj = context.scene.objects[objectId];
  if (obj?.type === "point") {
    // Return x,y without parentheses so that callers using (${name}) work correctly
    return `${formatNumber(obj.x, context.options.coordinatePrecision)},${formatNumber(obj.y, context.options.coordinatePrecision)}`;
  }
  return null;
}
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

export function formatPatternFill(
  path: string,
  style: GeometryStyle,
  options: TikzOptions,
  colorFor: (color: string) => string | null,
): string[] {
  if (!style.pattern || style.pattern.type === "none" || !options.preserveStyle) {
    return [];
  }

  const fill = options.preserveColors && style.fill !== "transparent" ? colorFor(style.fill) : null;
  if (!fill) {
    return [];
  }

  const lines = [
    `\\begin{scope}`,
    `  \\clip ${path};`,
  ];
  
  // Calculate bounding box approximations based on viewport or object bounds in the future.
  // For now, generate a fixed grid that covers typical shapes (-20 to 20 or similar).
  // In tikz, coordinate systems usually fit within -30 to 30 for Untitled Geometry.
  const step = Math.max(0.5, style.pattern.size / 10); // arbitrary scaling mapping
  const densityScale = Math.max(0.2, style.pattern.density);
  
  let nodeContent = "";
  if (style.pattern.type === "dots") {
    nodeContent = `\\fill[${fill}] (\\x, \\y) circle (${densityScale * 0.1});`;
  } else if (style.pattern.type === "stars") {
    nodeContent = `\\node[inner sep=0pt, font=\\tiny, text=${fill}, scale=${densityScale}] at (\\x, \\y) {$\\star$};`;
  } else if (style.pattern.type === "squares") {
    nodeContent = `\\fill[${fill}] (\\x-${densityScale*0.1}, \\y-${densityScale*0.1}) rectangle (\\x+${densityScale*0.1}, \\y+${densityScale*0.1});`;
  } else if (style.pattern.type === "triangles") {
    nodeContent = `\\fill[${fill}] (\\x, \\y+${densityScale*0.1}) -- (\\x-${densityScale*0.1}, \\y-${densityScale*0.05}) -- (\\x+${densityScale*0.1}, \\y-${densityScale*0.05}) -- cycle;`;
  }

  lines.push(`  \\foreach \\x in {-30, -${30 - step}, ..., 30} {`);
  lines.push(`    \\foreach \\y in {-30, -${30 - step}, ..., 30} {`);
  lines.push(`      ${nodeContent}`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push(`\\end{scope}`);

  return lines;
}

export function optimizeLabels(labels: readonly string[]): string[] {
  const regex = /^\\node\[(.*?)\] at \(([^)]+)\) \{(.+)\};$/;
  const groups = new Map<string, Array<{ coord: string; content: string }>>();
  const unoptimized: string[] = [];
  
  for (const label of labels) {
    const match = label.match(regex);
    if (match) {
      const [, anchor, coord, content] = match;
      if (!groups.has(anchor!)) {
        groups.set(anchor!, []);
      }
      groups.get(anchor!)!.push({ coord: coord!, content: content! });
    } else {
      unoptimized.push(label);
    }
  }
  
  const optimized: string[] = [];
  for (const [anchor, items] of groups.entries()) {
    if (items.length === 1) {
      optimized.push(`\\node[${anchor}] at (${items[0]!.coord}) {${items[0]!.content}};`);
    } else {
      let canUseSimple = true;
      for (const item of items) {
        if (item.content !== `$${item.coord}$`) {
          canUseSimple = false;
          break;
        }
      }
      
      if (canUseSimple) {
        const coords = items.map(item => item.coord).join(", ");
        optimized.push(`\\foreach \\p in {${coords}} \\node[${anchor}] at (\\p) {$\\p$};`);
      } else {
        const pairs = items.map(item => `${item.coord}/${item.content}`).join(", ");
        optimized.push(`\\foreach \\p/\\t in {${pairs}} \\node[${anchor}] at (\\p) {\\t};`);
      }
    }
  }
  
  return [...optimized, ...unoptimized];
}

export function optimizeShapes(shapes: readonly string[]): string[] {
  const optimized: string[] = [];
  let currentStyle: string | null = null;
  let currentPath: string = "";
  
  const regex = /^\\draw\[(.*?)\] (.*?);$/;
  
  for (const shape of shapes) {
    const match = shape.match(regex);
    if (match) {
      const [, style, path] = match;
      if (style === currentStyle) {
        const lastParenStart = currentPath.lastIndexOf("(");
        let endCoord = "";
        if (lastParenStart !== -1) {
            endCoord = currentPath.substring(lastParenStart);
        }
        if (endCoord !== "" && path!.startsWith(endCoord + " -- ")) {
            currentPath += " -- " + path!.substring(endCoord.length + 4);
        } else {
            currentPath += " " + path!;
        }
      } else {
        if (currentStyle !== null) {
          optimized.push(`\\draw[${currentStyle}] ${currentPath};`);
        }
        currentStyle = style!;
        currentPath = path!;
      }
    } else {
      if (currentStyle !== null) {
        optimized.push(`\\draw[${currentStyle}] ${currentPath};`);
        currentStyle = null;
        currentPath = "";
      }
      optimized.push(shape);
    }
  }
  
  if (currentStyle !== null) {
    optimized.push(`\\draw[${currentStyle}] ${currentPath};`);
  }
  
  return optimized;
}

export function optimizePoints(points: readonly string[]): string[] {
  const regex = /^\\fill(\[.*?\])? \(([^)]+)\) circle \(([^)]+)\);$/;
  const groups = new Map<string, Array<{ coord: string }>>();
  const unoptimized: string[] = [];
  
  for (const point of points) {
    const match = point.match(regex);
    if (match) {
      const [, options = "", coord, radius] = match;
      const key = `${options}|||${radius}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ coord: coord! });
    } else {
      unoptimized.push(point);
    }
  }
  
  const optimized: string[] = [];
  for (const [key, items] of groups.entries()) {
    const [options, radius] = key.split("|||");
    if (items.length === 1) {
      optimized.push(`\\fill${options} (${items[0]!.coord}) circle (${radius});`);
    } else {
      const coords = items.map(item => item.coord).join(", ");
      optimized.push(`\\foreach \\p in {${coords}} \\fill${options} (\\p) circle (${radius});`);
    }
  }
  
  return [...optimized, ...unoptimized];
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
  lines.push(...formatSectionLines("Lines and shapes", optimizeShapes(sections.shapes), options.includeComments));
  lines.push(...formatSectionLines("Points", optimizePoints(sections.points), options.includeComments));
  lines.push(...formatSectionLines("Labels", optimizeLabels(sections.labels), options.includeComments));
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
      ? ["\\usetikzlibrary{calc,intersections,arrows.meta}"]
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
      ...optimizeShapes(sections.shapes),
      ...optimizePoints(sections.points),
      ...optimizeLabels(sections.labels),
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
