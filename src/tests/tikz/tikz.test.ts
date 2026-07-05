import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type PointObject,
  type RayObject,
  type SegmentObject,
  type TextObject,
  type VectorObject,
} from "../../core/geometry";
import { generateTikz } from "../../core/tikz";
import { assertIncludes } from "../assert";

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
