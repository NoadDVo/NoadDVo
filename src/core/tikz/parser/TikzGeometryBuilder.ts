import {
  DEFAULT_GEOMETRY_STYLE,
  normalizeDependencyMetadata,
  type GeometryObject,
  type GeometryObjectRecord,
  type GeometryStyle,
  type LabelPosition,
  type Point2D,
  type PointObject,
} from "../../geometry";
import type {
  TikzAst,
  TikzCommandNode,
  TikzParseIssue,
} from "./TikzParseTypes";

type BuildResult = {
  readonly issues: readonly TikzParseIssue[];
  readonly objects: readonly GeometryObject[];
};

type PathPoint =
  | {
      readonly kind: "ref";
      readonly name: string;
    }
  | {
      readonly kind: "literal";
      readonly point: Point2D;
    };

type BuilderState = {
  readonly colorDefinitions: Map<string, string>;
  readonly issues: TikzParseIssue[];
  readonly nameToPointId: Map<string, string>;
  readonly objects: Map<string, GeometryObject>;
  sequence: number;
};

const numberPattern = "[-+]?(?:\\d+(?:\\.\\d+)?|\\.\\d+)";
const standardColors: Record<string, string> = {
  black: "#0b0f14",
  blue: "#2563eb",
  brown: "#8b5e34",
  cyan: "#0891b2",
  gray: "#6b7280",
  green: "#16a34a",
  magenta: "#c026d3",
  orange: "#f97316",
  purple: "#9333ea",
  red: "#dc2626",
  white: "#ffffff",
  yellow: "#ca8a04",
};

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function sanitizeId(value: string): string {
  const sanitized = value.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return sanitized || "object";
}

function nextId(state: BuilderState, prefix: string, hint: string): string {
  const base = `${prefix}-${sanitizeId(hint)}`;
  let candidate = base;
  let suffix = 1;

  while (state.objects.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function timestamp(state: BuilderState): number {
  state.sequence += 1;

  return state.sequence;
}

function parseNumber(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parsePointPair(x: string | undefined, y: string | undefined): Point2D | null {
  const parsedX = parseNumber(x);
  const parsedY = parseNumber(y);

  return parsedX === null || parsedY === null ? null : { x: parsedX, y: parsedY };
}

function baseObject(
  state: BuilderState,
  id: string,
  style: GeometryStyle = DEFAULT_GEOMETRY_STYLE,
): Pick<
  GeometryObject,
  "createdAt" | "dependencies" | "dependents" | "id" | "locked" | "style" | "updatedAt" | "visible"
> {
  const createdAt = timestamp(state);

  return {
    createdAt,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    style,
    updatedAt: createdAt,
    visible: true,
  };
}

function createPoint(
  state: BuilderState,
  name: string,
  point: Point2D,
): PointObject {
  const existingId = state.nameToPointId.get(name);
  const existing = existingId ? state.objects.get(existingId) : null;

  if (existing?.type === "point") {
    return existing;
  }

  const id = nextId(state, "point", name);
  const object: PointObject = {
    ...baseObject(state, id),
    name,
    pointKind: "free",
    type: "point",
    x: point.x,
    y: point.y,
  };

  state.nameToPointId.set(name, id);
  state.objects.set(id, object);

  return object;
}

function createGeneratedPoint(
  state: BuilderState,
  prefix: string,
  point: Point2D,
): PointObject {
  const name = `${prefix}${state.sequence + 1}`;

  return createPoint(state, name, point);
}

function pointForPathPoint(state: BuilderState, pathPoint: PathPoint): PointObject | null {
  if (pathPoint.kind === "ref") {
    const existingId = state.nameToPointId.get(pathPoint.name);
    const existing = existingId ? state.objects.get(existingId) : null;

    return existing?.type === "point" ? existing : null;
  }

  return createGeneratedPoint(state, "P", pathPoint.point);
}

function parseOptions(options: readonly string[], state: BuilderState): GeometryStyle {
  const style: GeometryStyle = { ...DEFAULT_GEOMETRY_STYLE };
  let stroke = style.stroke;
  let fill = style.fill;
  let strokeOpacity = style.strokeOpacity;
  let fillOpacity = style.fillOpacity;
  let strokeWidth = style.strokeWidth;
  let dash = style.dash;

  const colorFor = (value: string): string => {
    const cleaned = value.trim();
    const defined = state.colorDefinitions.get(cleaned);

    if (defined) {
      return defined;
    }

    if (standardColors[cleaned]) {
      return standardColors[cleaned];
    }

    return /^#?[0-9a-fA-F]{6}$/.test(cleaned)
      ? `#${cleaned.replace(/^#/, "")}`
      : stroke;
  };

  options.forEach((option) => {
    const [rawKey, rawValue] = option.split("=").map((part) => part.trim());
    const key = rawKey ?? "";
    const value = rawValue ?? "";

    if (key === "draw" && value) {
      stroke = colorFor(value);
    } else if (key === "fill" && value) {
      fill = colorFor(value);
    } else if (key === "dashed") {
      dash = "dashed";
    } else if (key === "dotted") {
      dash = "dotted";
    } else if (key === "line width") {
      const width = parseNumber(value.replace("pt", ""));

      if (width !== null) {
        strokeWidth = Math.max(1, width / 0.4);
      }
    } else if (key === "draw opacity") {
      strokeOpacity = parseNumber(value) ?? strokeOpacity;
    } else if (key === "fill opacity") {
      fillOpacity = parseNumber(value) ?? fillOpacity;
    } else if (key === "opacity") {
      const opacity = parseNumber(value);

      if (opacity !== null) {
        strokeOpacity = opacity;
        fillOpacity = opacity;
      }
    }
  });

  return {
    ...style,
    dash,
    fill,
    fillOpacity,
    stroke,
    strokeOpacity,
    strokeWidth,
  };
}

function readColorDefinition(command: TikzCommandNode, state: BuilderState): void {
  const match = compact(command.argumentText).match(
    /^\{\s*([^}]+?)\s*\}\s*\{\s*HTML\s*\}\s*\{\s*([0-9a-fA-F]{6})\s*\}$/i,
  );

  if (!match?.[1] || !match[2]) {
    return;
  }

  state.colorDefinitions.set(match[1].trim(), `#${match[2].toUpperCase()}`);
}

function recoverCoordinate(command: TikzCommandNode, state: BuilderState): void {
  const pattern = new RegExp(
    `^\\(\\s*([A-Za-z][A-Za-z0-9]*)\\s*\\)\\s*at\\s*\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)$`,
  );
  const match = compact(command.argumentText).match(pattern);
  const point = parsePointPair(match?.[2], match?.[3]);

  if (!match?.[1] || !point) {
    state.issues.push({
      code: "TIKZ_UNSUPPORTED_COORDINATE",
      column: command.column,
      line: command.line,
      message: "Only named numeric coordinates can be recovered.",
      severity: "warning",
    });
    return;
  }

  createPoint(state, match[1], point);
}

function readPathPoints(argumentText: string): PathPoint[] {
  const points: PathPoint[] = [];
  const pattern = new RegExp(
    `\\(\\s*([A-Za-z][A-Za-z0-9]*)\\s*\\)|\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)`,
    "g",
  );
  const text = compact(argumentText);
  let match = pattern.exec(text);

  while (match) {
    if (match[1]) {
      points.push({ kind: "ref", name: match[1] });
    } else {
      const point = parsePointPair(match[2], match[3]);

      if (point) {
        points.push({ kind: "literal", point });
      }
    }

    match = pattern.exec(text);
  }

  return points;
}

function pathUsesCycle(argumentText: string): boolean {
  return /\bcycle\b/i.test(argumentText);
}

function pathIsPointMarker(argumentText: string): boolean {
  return /\bcircle\s*\(/i.test(argumentText) && readPathPoints(argumentText).length === 1;
}

function optionHasArrow(options: readonly string[]): boolean {
  return options.some((option) => /Latex|Stealth|->|-{|arrow/i.test(option));
}

function recoverLinearPath(command: TikzCommandNode, state: BuilderState): boolean {
  if (pathIsPointMarker(command.argumentText)) {
    return true;
  }

  const pathPoints = readPathPoints(command.argumentText);
  const points = pathPoints
    .map((pathPoint) => pointForPathPoint(state, pathPoint))
    .filter((point): point is PointObject => Boolean(point));

  if (points.length !== pathPoints.length) {
    state.issues.push({
      code: "TIKZ_UNKNOWN_POINT_REFERENCE",
      column: command.column,
      line: command.line,
      message: "Path references a point that has not been defined.",
      severity: "warning",
    });
    return true;
  }

  if (points.length >= 3 && pathUsesCycle(command.argumentText)) {
    const style = parseOptions(command.options, state);
    const id = nextId(state, command.name === "draw" ? "polygon" : "region", points.map((point) => point.name ?? point.id).join("-"));
    const object: GeometryObject =
      command.name === "draw"
        ? {
            ...baseObject(state, id, style),
            closed: true,
            pointIds: points.map((point) => point.id),
            type: "polygon",
          }
        : {
            ...baseObject(state, id, {
              ...style,
              fill: style.fill === "transparent" ? style.stroke : style.fill,
              fillOpacity: style.fillOpacity > 0 ? style.fillOpacity : 0.2,
            }),
            boundaryPointIds: points.map((point) => point.id),
            type: "region",
          };

    state.objects.set(id, object);
    return true;
  }

  if (points.length === 2) {
    const start = points[0];
    const end = points[1];

    if (!start || !end) {
      return false;
    }

    const style = parseOptions(command.options, state);
    const id = nextId(
      state,
      optionHasArrow(command.options) ? "vector" : "segment",
      `${start.name ?? start.id}-${end.name ?? end.id}`,
    );
    const object: GeometryObject = optionHasArrow(command.options)
      ? {
          ...baseObject(state, id, style),
          endPointId: end.id,
          metadata: { arrowStyle: "latex" },
          startPointId: start.id,
          type: "vector",
        }
      : {
          ...baseObject(state, id, style),
          endPointId: end.id,
          startPointId: start.id,
          type: "segment",
        };

    state.objects.set(id, object);
    return true;
  }

  return false;
}

function recoverCircle(command: TikzCommandNode, state: BuilderState): boolean {
  const pattern = new RegExp(
    `^\\(\\s*([A-Za-z][A-Za-z0-9]*)\\s*\\)\\s*circle\\s*\\(\\s*(${numberPattern})`,
  );
  const literalPattern = new RegExp(
    `^\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)\\s*circle\\s*\\(\\s*(${numberPattern})`,
  );
  const text = compact(command.argumentText);
  const namedMatch = text.match(pattern);
  const literalMatch = text.match(literalPattern);
  const radius = parseNumber(namedMatch?.[2] ?? literalMatch?.[3]);
  const literalPoint = parsePointPair(literalMatch?.[1], literalMatch?.[2]);
  const center = namedMatch?.[1]
    ? pointForPathPoint(state, { kind: "ref", name: namedMatch[1] })
    : literalPoint
      ? pointForPathPoint(state, {
          kind: "literal",
          point: literalPoint,
        })
      : null;

  if (!center || radius === null) {
    return false;
  }

  const style = parseOptions(command.options, state);
  const id = nextId(state, "circle", center.name ?? center.id);

  state.objects.set(id, {
    ...baseObject(state, id, style),
    centerPointId: center.id,
    circleKind: "center-radius",
    radius,
    type: "circle",
  });

  return true;
}

function recoverArc(command: TikzCommandNode, state: BuilderState): boolean {
  const startPattern = new RegExp(
    `^\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)\\s*arc\\s*\\[([^\\]]+)\\]`,
  );
  const text = compact(command.argumentText);
  const match = text.match(startPattern);
  const startPoint = parsePointPair(match?.[1], match?.[2]);

  if (!match?.[3] || !startPoint) {
    return false;
  }

  const arcOptions = match[3].split(",").map((option) => option.trim());
  const valueFor = (key: string): number | null => {
    const entry = arcOptions.find((option) =>
      new RegExp(`^${key}\\s*=`).test(option),
    );

    return parseNumber(entry?.split("=")[1]?.replace("cm", ""));
  };
  const startAngle = valueFor("start angle");
  const endAngle = valueFor("end angle");
  const radius = valueFor("radius");

  if (startAngle === null || endAngle === null || radius === null) {
    return false;
  }

  const startRadians = startAngle * Math.PI / 180;
  const endRadians = endAngle * Math.PI / 180;
  const center = {
    x: startPoint.x - radius * Math.cos(startRadians),
    y: startPoint.y - radius * Math.sin(startRadians),
  };
  const endPoint = {
    x: center.x + radius * Math.cos(endRadians),
    y: center.y + radius * Math.sin(endRadians),
  };
  const centerObject = createGeneratedPoint(state, "Oarc", center);
  const startObject = createGeneratedPoint(state, "Sarc", startPoint);
  const endObject = createGeneratedPoint(state, "Earc", endPoint);
  const id = nextId(state, "arc", `${centerObject.name}-${startObject.name}-${endObject.name}`);

  state.objects.set(id, {
    ...baseObject(state, id, parseOptions(command.options, state)),
    centerPointId: centerObject.id,
    direction: endAngle >= startAngle ? "counterclockwise" : "clockwise",
    endPointId: endObject.id,
    startPointId: startObject.id,
    type: "arc",
  });

  return true;
}

function labelPositionFromOptions(options: readonly string[]): LabelPosition {
  const joined = options.join(" ");

  if (joined.includes("above left")) {
    return "above-left";
  }
  if (joined.includes("above right")) {
    return "above-right";
  }
  if (joined.includes("below left")) {
    return "below-left";
  }
  if (joined.includes("below right")) {
    return "below-right";
  }
  if (joined.includes("above")) {
    return "above";
  }
  if (joined.includes("below")) {
    return "below";
  }
  if (joined.includes("left")) {
    return "left";
  }
  if (joined.includes("right")) {
    return "right";
  }

  return "above-right";
}

function cleanNodeContent(content: string): string {
  return content.trim().replace(/^\$/, "").replace(/\$$/, "");
}

function recoverNode(command: TikzCommandNode, state: BuilderState): void {
  const text = compact(command.argumentText);
  const match = text.match(/\bat\s*\(\s*([A-Za-z][A-Za-z0-9]*)\s*\)\s*\{\s*(.*?)\s*\}$/);
  const literalMatch = text.match(
    new RegExp(`\\bat\\s*\\(\\s*(${numberPattern})\\s*,\\s*(${numberPattern})\\s*\\)\\s*\\{\\s*(.*?)\\s*\\}$`),
  );

  if (match?.[1]) {
    const pointId = state.nameToPointId.get(match[1]);
    const point = pointId ? state.objects.get(pointId) : null;
    const label = cleanNodeContent(match[2] ?? "");

    if (point?.type === "point" && (!label || label === point.name)) {
      state.objects.set(point.id, {
        ...point,
        style: {
          ...point.style,
          labelPosition: labelPositionFromOptions(command.options),
          labelVisible: true,
        },
      });
      return;
    }
  }

  const literalPoint = parsePointPair(literalMatch?.[1], literalMatch?.[2]);
  const content = literalMatch?.[3] ?? match?.[2];

  if (!literalPoint || content === undefined) {
    state.issues.push({
      code: "TIKZ_UNSUPPORTED_NODE",
      column: command.column,
      line: command.line,
      message: "Only simple labels and positioned text nodes can be recovered.",
      severity: "warning",
    });
    return;
  }

  const id = nextId(state, "text", content.slice(0, 16) || "node");

  state.objects.set(id, {
    ...baseObject(state, id, parseOptions(command.options, state)),
    content: cleanNodeContent(content),
    textMode: content.includes("$") ? "math" : "plain",
    type: "text",
    x: literalPoint.x,
    y: literalPoint.y,
  });
}

function recoverPic(command: TikzCommandNode, state: BuilderState): void {
  const match = compact(command.argumentText).match(/\{\s*(right angle|angle)\s*=\s*([A-Za-z][A-Za-z0-9]*)\s*--\s*([A-Za-z][A-Za-z0-9]*)\s*--\s*([A-Za-z][A-Za-z0-9]*)\s*\}/);

  if (!match?.[2] || !match[3] || !match[4]) {
    state.issues.push({
      code: "TIKZ_UNSUPPORTED_PIC",
      column: command.column,
      line: command.line,
      message: "Only TikZ angle pics can be recovered.",
      severity: "warning",
    });
    return;
  }

  const ids = [match[2], match[3], match[4]].map((name) => state.nameToPointId.get(name));

  if (ids.some((id) => !id)) {
    state.issues.push({
      code: "TIKZ_UNKNOWN_POINT_REFERENCE",
      column: command.column,
      line: command.line,
      message: "Angle pic references a point that has not been defined.",
      severity: "warning",
    });
    return;
  }

  const radiusOption = command.options.find((option) => option.startsWith("angle radius="));
  const radius = parseNumber(radiusOption?.split("=")[1]?.replace("cm", "")) ?? 0.6;
  const id = nextId(state, "angle", `${match[2]}-${match[3]}-${match[4]}`);

  state.objects.set(id, {
    ...baseObject(state, id, parseOptions(command.options, state)),
    pointAId: ids[0] ?? "",
    pointCId: ids[2] ?? "",
    radius,
    showRightAngleMarker: match[1] === "right angle",
    type: "angle",
    vertexPointId: ids[1] ?? "",
  });
}

function recoverPathCommand(command: TikzCommandNode, state: BuilderState): void {
  if (recoverCircle(command, state) || recoverArc(command, state) || recoverLinearPath(command, state)) {
    return;
  }

  state.issues.push({
    code: "TIKZ_UNSUPPORTED_PATH",
    column: command.column,
    line: command.line,
    message: `${command.name} path could not be converted to geometry.`,
    severity: "warning",
  });
}

export function buildGeometryFromTikzAst(ast: TikzAst): BuildResult {
  const state: BuilderState = {
    colorDefinitions: new Map(),
    issues: [],
    nameToPointId: new Map(),
    objects: new Map(),
    sequence: 0,
  };

  ast.commands.forEach((command) => {
    if (command.name === "definecolor") {
      readColorDefinition(command, state);
    }
  });

  ast.commands.forEach((command) => {
    if (command.name === "coordinate") {
      recoverCoordinate(command, state);
    } else if (command.name === "draw" || command.name === "fill" || command.name === "filldraw") {
      recoverPathCommand(command, state);
    } else if (command.name === "node") {
      recoverNode(command, state);
    } else if (command.name === "pic") {
      recoverPic(command, state);
    } else if (!["begin", "end", "documentclass", "usepackage", "usetikzlibrary", "definecolor"].includes(command.name)) {
      state.issues.push({
        code: "TIKZ_UNSUPPORTED_COMMAND",
        column: command.column,
        line: command.line,
        message: `Command \\${command.name} is not supported by the geometry parser.`,
        severity: "warning",
      });
    }
  });

  const normalized = normalizeDependencyMetadata(
    Object.fromEntries(state.objects.entries()) as GeometryObjectRecord,
  );

  return {
    issues: state.issues,
    objects: Object.values(normalized).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)),
  };
}
