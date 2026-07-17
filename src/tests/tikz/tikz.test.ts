import {
  DEFAULT_GEOMETRY_STYLE,
  type ArcObject,
  type CircleObject,
  type GeometryObjectRecord,
  type PolygonObject,
  type PointObject,
  type RegionObject,
  type RayObject,
  type SegmentObject,
  type TextObject,
  type VectorObject,
} from "../../core/geometry";
import { generateTikz, getTikzOptions } from "../../core/tikz";
import { assert, assertEqual, assertIncludes } from "../assert";

function point(id: string, name: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: ["ab"],
    id,
    locked: false,
    name,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

export function runTikzTests(): void {
  const segment: SegmentObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "ab",
    locked: false,
    name: "AB",
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 2,
    visible: true,
  };
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
    ab: segment,
    b: point("b", "B", 1, 0),
  };
  const code = generateTikz(objects, "academic").code;

  assertIncludes(code, "\\begin{tikzpicture}", "TikZ output has picture environment");
  assertIncludes(code, "\\coordinate (A) at (0,0);", "TikZ output exports point A");
  assertIncludes(code, "\\draw", "TikZ output exports drawable shape");
  assertDefaultBlackIsImplicit();
  assertNonBlackColorIsExported();
  assertRayIsExported();
  assertVectorIsExported();
  assertTextIsExported();
  assertThreePointCircleIsExported();
  assertArcIsExported();
  assertRegionIsExported();
  assertPolygonFillModes();
  assertOutputModes();
  assertLabelAnchorsAndNameSanitization();
  assertInvalidObjectWarnings();
  assertDeterministicCode();
}

function assertDefaultBlackIsImplicit(): void {
  const variants = ["#0B0F14", "0B0F14", "rgb(11, 15, 20)", "black", "#000000", "000000"];

  variants.forEach((stroke) => {
    const code = generateTikz(
      {
        a: point("a", "A", 0, 0),
        ab: {
          createdAt: 2,
          dependencies: ["a", "b"],
          dependents: [],
          endPointId: "b",
          id: "ab",
          locked: false,
          startPointId: "a",
          style: { ...DEFAULT_GEOMETRY_STYLE, stroke },
          type: "segment",
          updatedAt: 2,
          visible: true,
        },
        b: point("b", "B", 1, 0),
      },
      "academic",
    ).code;

    if (code.includes("ndvColor0B0F14") || code.includes("ndvColor000000")) {
      throw new Error(`Default black should be implicit for ${stroke}.`);
    }
  });
}

function assertNonBlackColorIsExported(): void {
  const code = generateTikz(
    {
      a: point("a", "A", 0, 0),
      ab: {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: { ...DEFAULT_GEOMETRY_STYLE, stroke: "#ff0000" },
        type: "segment",
        updatedAt: 2,
        visible: true,
      },
      b: point("b", "B", 1, 0),
    },
    "academic",
  ).code;

  assertIncludes(code, "\\definecolor{ndvColorFF0000}{HTML}{FF0000}", "non-black colors are defined");
  assertIncludes(code, "draw=ndvColorFF0000", "non-black colors are applied");
}

function assertRayIsExported(): void {
  const ray: RayObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    id: "ray-ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    throughPointId: "b",
    type: "ray",
    updatedAt: 2,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 0, 0),
      b: point("b", "B", 1, 0),
      "ray-ab": ray,
    },
    "academic",
  ).code;

  assertIncludes(code, "\\draw", "TikZ ray exports a draw command");
  assertIncludes(code, "(0,0) -- (10,0);", "TikZ ray clips to export bounds");
}

function assertVectorIsExported(): void {
  const vector: VectorObject = {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "vector-ab",
    locked: false,
    metadata: {
      arrowStyle: "latex",
    },
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "vector",
    updatedAt: 2,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 0, 0),
      b: point("b", "B", 1, 0),
      "vector-ab": vector,
    },
    "academic",
  ).code;

  assertIncludes(code, "\\draw[-{Latex}", "TikZ vector exports an arrow draw command");
  assertIncludes(code, "(A) -- (B);", "TikZ vector exports named endpoints");
}

function assertTextIsExported(): void {
  const text: TextObject = {
    content: "$x^2+y^2$",
    createdAt: 2,
    dependencies: [],
    dependents: [],
    id: "text-a",
    locked: false,
    metadata: {
      alignment: "center",
      fontSize: 14,
    },
    style: DEFAULT_GEOMETRY_STYLE,
    textMode: "math",
    type: "text",
    updatedAt: 2,
    visible: true,
    x: 2,
    y: 3,
  };
  const code = generateTikz({ "text-a": text }, "academic").code;

  assertIncludes(code, "\\node", "TikZ text exports a node command");
  assertIncludes(code, "at (2,3)", "TikZ text exports its world position");
  assertIncludes(code, "{$x^2+y^2$};", "TikZ math text preserves math content");
}

function assertThreePointCircleIsExported(): void {
  const circle: CircleObject = {
    circleKind: "three-points",
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "circle-abc",
    locked: false,
    pointAId: "a",
    pointBId: "b",
    pointCId: "c",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 2,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 1, 0),
      b: point("b", "B", 0, 1),
      c: point("c", "C", -1, 0),
      "circle-abc": circle,
    },
    "academic",
  ).code;

  assertIncludes(code, "(0,0) circle (1);", "TikZ exports three-point circle via computed center");
}

function assertArcIsExported(): void {
  const arc: ArcObject = {
    centerPointId: "o",
    createdAt: 2,
    dependencies: ["o", "a", "b"],
    dependents: [],
    direction: "counterclockwise",
    endPointId: "b",
    id: "arc-ab",
    locked: false,
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 2,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 1, 0),
      b: point("b", "B", 0, 1),
      o: point("o", "O", 0, 0),
      "arc-ab": arc,
    },
    "academic",
  ).code;

  assertIncludes(code, "arc[start angle=0, end angle=90, radius=1];", "TikZ exports arcs");
}

function assertRegionIsExported(): void {
  const region: RegionObject = {
    boundaryPointIds: ["a", "b", "c"],
    createdAt: 2,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "region-abc",
    locked: false,
    style: { ...DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
    type: "region",
    updatedAt: 2,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 0, 0),
      b: point("b", "B", 4, 0),
      c: point("c", "C", 0, 3),
      "region-abc": region,
    },
    "colorful",
  ).code;

  assertIncludes(code, "\\filldraw", "TikZ exports regions as filled boundaries");
  assertIncludes(code, "fill opacity=0.2", "TikZ region preserves fill opacity");
}

function assertPolygonFillModes(): void {
  const polygon: PolygonObject = {
    closed: true,
    createdAt: 3,
    dependencies: ["a", "b", "c"],
    dependents: [],
    id: "polygon-abc",
    locked: false,
    pointIds: ["a", "b", "c"],
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#00ccff",
      fillOpacity: 0.35,
      strokeOpacity: 0.6,
    },
    type: "polygon",
    updatedAt: 3,
    visible: true,
  };
  const code = generateTikz(
    {
      a: point("a", "A", 0, 0),
      b: point("b", "B", 4, 0),
      c: point("c", "C", 0, 3),
      "polygon-abc": polygon,
    },
    "colorful",
  ).code;

  assertIncludes(code, "% Filled regions", "filled polygons are grouped before drawings");
  assertIncludes(code, "\\filldraw", "filled polygons use filldraw when stroke is visible");
  assertIncludes(code, "fill opacity=0.35", "polygon fill opacity is exported");
  assertIncludes(code, "draw opacity", "stroke opacity uses draw opacity syntax when needed");
}

function assertOutputModes(): void {
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
  };
  const raw = generateTikz(objects, {
    ...getTikzOptions("academic"),
    outputType: "raw",
  }).code;
  const document = generateTikz(objects, {
    ...getTikzOptions("academic"),
    includeDocumentWrapper: true,
  }).code;
  const minimal = generateTikz(objects, "minimal").code;

  assert(!raw.includes("\\begin{tikzpicture}"), "raw output excludes tikzpicture wrapper");
  assertIncludes(raw, "\\coordinate (A) at (0,0);", "raw output includes commands");
  assertIncludes(document, "\\documentclass[tikz,border=5pt]{standalone}", "document output has wrapper");
  assertIncludes(document, "\\usetikzlibrary{calc,intersections,arrows.meta}", "document output includes libraries");
  assertIncludes(minimal, "\\begin{tikzpicture}", "minimal mode still exports a snippet");
  assert(!minimal.includes("% Coordinates"), "minimal mode omits comments");
  assert(!minimal.includes("[scale=1]"), "minimal mode omits redundant scale option");
}

function assertLabelAnchorsAndNameSanitization(): void {
  const code = generateTikz(
    {
      a: {
        ...point("a", "A-1", 0, 0),
        style: { ...DEFAULT_GEOMETRY_STYLE, labelPosition: "above-left" },
      },
      b: point("b", "A 1", 1, 0),
    },
    "academic",
  ).code;

  assertIncludes(code, "\\coordinate (A1) at (0,0);", "TikZ names remove punctuation");
  assertIncludes(code, "\\coordinate (A11) at (1,0);", "TikZ names avoid duplicates");
  assertIncludes(code, "\\node[above left] at (A1)", "label anchors follow the spec mapping");
}

function assertInvalidObjectWarnings(): void {
  const result = generateTikz(
    {
      ab: {
        createdAt: 1,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        startPointId: "a",
        style: DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 1,
        visible: true,
      },
    },
    "academic",
  );

  assertEqual(result.errors.length, 0, "TikZ generation does not hard fail invalid objects");
  assertEqual(result.warnings[0]?.code, "TIKZ_INVALID_SEGMENT", "invalid objects produce warnings");
}

function assertDeterministicCode(): void {
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
    b: point("b", "B", 1, 0),
  };
  const first = generateTikz(objects, "academic").code;
  const second = generateTikz(objects, "academic").code;

  assertEqual(first, second, "same scene produces deterministic TikZ code");
}
