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

/**
 * Parse a TikZ path string to extract all numeric coordinate pairs,
 * then compute an axis-aligned bounding box [xMin, xMax, yMin, yMax].
 */
function parseBoundingBoxFromPath(path: string): { xMin: number; xMax: number; yMin: number; yMax: number } | null {
  // Match all coordinate pairs like (1.23,-4.56) or (A) — we only use numeric ones
  const coordRegex = /\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)/g;
  let match: RegExpExecArray | null;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let found = false;

  while ((match = coordRegex.exec(path)) !== null) {
    const x = parseFloat(match[1]!);
    const y = parseFloat(match[2]!);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
      found = true;
    }
  }

  // Also handle named coordinates like (A) by trying arc parameters
  // arc[start angle=X, end angle=Y, radius=R] — extract center from preceding coordinate
  const arcRegex = /\((-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\)\s*circle\s*\((-?\d+(?:\.\d+)?)\)/g;
  while ((match = arcRegex.exec(path)) !== null) {
    const cx = parseFloat(match[1]!);
    const cy = parseFloat(match[2]!);
    const r = parseFloat(match[3]!);
    if (Number.isFinite(cx) && Number.isFinite(cy) && Number.isFinite(r)) {
      xMin = Math.min(xMin, cx - r);
      xMax = Math.max(xMax, cx + r);
      yMin = Math.min(yMin, cy - r);
      yMax = Math.max(yMax, cy + r);
      found = true;
    }
  }

  return found ? { xMin, xMax, yMin, yMax } : null;
}

function formatNumber2(value: number): string {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/**
 * Generate TikZ hatch lines for a region using \clip + \foreach.
 * Computes the foreach range by projecting bounding box corners onto the
 * normal direction of the hatch angle, ensuring full coverage.
 */
function formatHatchFill(
  path: string,
  style: GeometryStyle,
  fill: string,
  providedBB?: { xMin: number; xMax: number; yMin: number; yMax: number },
): string[] {
  const pattern = style.pattern!;
  const angle = pattern.angle ?? 45;
  const spacing = pattern.spacing ?? 0.2;
  const lineWidth = pattern.lineWidth ?? 0.4;
  const isCrosshatch = pattern.type === "crosshatch";

  const bb = providedBB ?? parseBoundingBoxFromPath(path);
  if (!bb) {
    // Fallback: use a generous range with default corners
    const fallbackCorners = [
      { x: -30, y: -30 },
      { x: 30, y: -30 },
      { x: 30, y: 30 },
      { x: -30, y: 30 },
    ];
    const fallbackDiag = Math.hypot(60, 60);
    const result = generateHatchForAngle(path, fill, angle, spacing, lineWidth, fallbackCorners, fallbackDiag);
    const lines = [
      `\\begin{scope}`,
      `  \\clip ${path};`,
      ...result.drawLines,
    ];
    if (isCrosshatch) {
      const result2 = generateHatchForAngle(path, fill, angle + 90, spacing, lineWidth, fallbackCorners, fallbackDiag);
      lines.push(...result2.drawLines);
    }
    lines.push(`\\end{scope}`);
    return lines;
  }

  // The four corners of the bounding box
  const corners = [
    { x: bb.xMin, y: bb.yMin },
    { x: bb.xMax, y: bb.yMin },
    { x: bb.xMax, y: bb.yMax },
    { x: bb.xMin, y: bb.yMax },
  ];

  // Diagonal of bounding box — used as the half-length of each hatch line
  const diagonal = Math.hypot(bb.xMax - bb.xMin, bb.yMax - bb.yMin);

  const result = generateHatchForAngle(path, fill, angle, spacing, lineWidth, corners, diagonal);

  if (isCrosshatch) {
    // Second set of lines perpendicular to the first (angle + 90)
    const result2 = generateHatchForAngle(path, fill, angle + 90, spacing, lineWidth, corners, diagonal);
    // Merge: share the same scope
    return [
      `\\begin{scope}`,
      `  \\clip ${path};`,
      ...result.drawLines,
      ...result2.drawLines,
      `\\end{scope}`,
    ];
  }

  return [
    `\\begin{scope}`,
    `  \\clip ${path};`,
    ...result.drawLines,
    `\\end{scope}`,
  ];
}

function generateHatchForAngle(
  _path: string,
  fill: string,
  angleDeg: number,
  spacing: number,
  lineWidth: number,
  corners: { x: number; y: number }[],
  diagonal: number,
): { drawLines: string[] } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);

  // Normal direction (perpendicular to hatch lines)
  const nx = -sinA;
  const ny = cosA;

  // Project all 4 BB corners onto the normal direction
  const projections = corners.map((c) => c.x * nx + c.y * ny);
  const minProj = Math.min(...projections);
  const maxProj = Math.max(...projections);

  // Round to spacing grid
  const startI = Math.floor(minProj / spacing) * spacing;
  const endI = Math.ceil(maxProj / spacing) * spacing;

  // Half-length of each line (covers full diagonal)
  const halfLen = diagonal / 2 + 1;

  const drawLines: string[] = [];

  // Use \foreach for compact output
  const foreachStart = formatNumber2(startI);
  const foreachSecond = formatNumber2(startI + spacing);
  const foreachEnd = formatNumber2(endI);



  // Vector direction of hatch lines
  const ux = cosA;
  const uy = sinA;

  // Center of Bounding Box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const projM = cx * nx + cy * ny;

  const k1x = cx - projM * nx - halfLen * ux;
  const k1y = cy - projM * ny - halfLen * uy;
  const k2x = cx - projM * nx + halfLen * ux;
  const k2y = cy - projM * ny + halfLen * uy;

  const nxStr = formatNumber2(nx);
  const nyStr = formatNumber2(ny);
  
  const formatK = (val: number) => {
    const s = formatNumber2(val);
    return val >= 0 ? `+${s}` : s;
  };

  drawLines.push(`  \\foreach \\i in {${foreachStart},${foreachSecond},...,${foreachEnd}}`);
  drawLines.push(`    \\draw[line width=${formatNumber2(lineWidth)}pt, ${fill}] ({${nxStr}*\\i ${formatK(k1x)}},{${nyStr}*\\i ${formatK(k1y)}}) -- ({${nxStr}*\\i ${formatK(k2x)}},{${nyStr}*\\i ${formatK(k2y)}});`);

  return { drawLines };
}

export function formatPatternFill(
  path: string,
  style: GeometryStyle,
  options: TikzOptions,
  _colorFor: (color: string) => string | null,
  providedBB?: { xMin: number; xMax: number; yMin: number; yMax: number }
): string[] {
  if (!style.pattern || style.pattern.type === "none" || !options.preserveStyle) {
    return [];
  }
  const patternColorStr = style.pattern.color ?? "#000000";
  const fill = options.preserveColors && patternColorStr !== "transparent" ? _colorFor(patternColorStr) || "black" : "black";

  // Hatch / crosshatch: use clip + foreach lines
  if (style.pattern.type === "hatch" || style.pattern.type === "crosshatch") {
    return formatHatchFill(path, style, fill, providedBB);
  }

  // Original scatter-pattern logic (dots, stars, squares, triangles)
  const lines = [
    `\\begin{scope}`,
    `  \\clip ${path};`,
  ];
  
  const bb = providedBB ?? parseBoundingBoxFromPath(path);
  const rangeMin = bb ? Math.floor(Math.min(bb.xMin, bb.yMin)) - 1 : -30;
  const rangeMax = bb ? Math.ceil(Math.max(bb.xMax, bb.yMax)) + 1 : 30;

  // Tính spacing và size giống hệt Canvas (1 unit TikZ = 40px Canvas)
  const spacingPx = Math.max(style.pattern.size * 1.5, style.pattern.size * (1.5 + (1 - style.pattern.density) * 3));
  const step = spacingPx / 40;
  const sizeCm = style.pattern.size / 40;
  
  let nodeContent = "";
  if (style.pattern.type === "dots") {
    nodeContent = `\\fill[${fill}] (\\x, \\y) circle (${formatNumber2(sizeCm / 2)});`;
  } else if (style.pattern.type === "stars") {
    nodeContent = `\\node[inner sep=0pt, font=\\tiny, text=${fill}] at (\\x, \\y) {$\\star$};`;
  } else if (style.pattern.type === "squares") {
    const half = formatNumber2(sizeCm / 2);
    nodeContent = `\\fill[${fill}] (\\x-${half}, \\y-${half}) rectangle (\\x+${half}, \\y+${half});`;
  } else if (style.pattern.type === "triangles") {
    const half = formatNumber2(sizeCm / 2);
    const hHalf = formatNumber2((sizeCm * Math.sqrt(3)) / 4);
    nodeContent = `\\fill[${fill}] (\\x, \\y+${hHalf}) -- (\\x-${half}, \\y-${hHalf}) -- (\\x+${half}, \\y-${hHalf}) -- cycle;`;
  }

  lines.push(`  \\foreach \\x in {${formatNumber2(rangeMin)}, ${formatNumber2(rangeMin + step)}, ..., ${formatNumber2(rangeMax)}} {`);
  lines.push(`    \\foreach \\y in {${formatNumber2(rangeMin)}, ${formatNumber2(rangeMin + step)}, ..., ${formatNumber2(rangeMax)}} {`);
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

export function optimizeCoordinates(coordinates: readonly string[]): string[] {
  const regex = /^\\coordinate \(([^)]+)\) at \(([^,]+),([^)]+)\);$/;
  const groups: Array<{ name: string; x: string; y: string }> = [];
  const unoptimized: string[] = [];
  
  for (const coord of coordinates) {
    const match = coord.match(regex);
    if (match) {
      const [, name, x, y] = match;
      groups.push({ name: name!, x: x!, y: y! });
    } else {
      unoptimized.push(coord);
    }
  }
  
  const optimized: string[] = [];
  if (groups.length === 1) {
    optimized.push(`\\coordinate (${groups[0]!.name}) at (${groups[0]!.x},${groups[0]!.y});`);
  } else if (groups.length > 1) {
    // Chunking to avoid overly long lines
    const chunkSize = 10;
    for (let i = 0; i < groups.length; i += chunkSize) {
      const chunk = groups.slice(i, i + chunkSize);
      const pairs = chunk.map(g => `${g.name}/${g.x}/${g.y}`).join(", ");
      optimized.push(`\\foreach \\p/\\x/\\y in {${pairs}} \\coordinate (\\p) at (\\x,\\y);`);
    }
  }
  
  return [...optimized, ...unoptimized];
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

  lines.push(...formatSectionLines("Coordinates", optimizeCoordinates(sections.coordinates), options.includeComments));
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
      ...optimizeCoordinates(sections.coordinates),
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
