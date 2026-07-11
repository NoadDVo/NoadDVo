"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTikzTests = runTikzTests;
const geometry_1 = require("../../core/geometry");
const tikz_1 = require("../../core/tikz");
const assert_1 = require("../assert");
function point(id, name, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: ["ab"],
        id,
        locked: false,
        name,
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function runTikzTests() {
    const segment = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        endPointId: "b",
        id: "ab",
        locked: false,
        name: "AB",
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
    const objects = {
        a: point("a", "A", 0, 0),
        ab: segment,
        b: point("b", "B", 1, 0),
    };
    const code = (0, tikz_1.generateTikz)(objects, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\begin{tikzpicture}", "TikZ output has picture environment");
    (0, assert_1.assertIncludes)(code, "\\coordinate (A) at (0,0);", "TikZ output exports point A");
    (0, assert_1.assertIncludes)(code, "\\draw", "TikZ output exports drawable shape");
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
function assertDefaultBlackIsImplicit() {
    const variants = ["#0B0F14", "0B0F14", "rgb(11, 15, 20)", "black", "#000000", "000000"];
    variants.forEach((stroke) => {
        const code = (0, tikz_1.generateTikz)({
            a: point("a", "A", 0, 0),
            ab: {
                createdAt: 2,
                dependencies: ["a", "b"],
                dependents: [],
                endPointId: "b",
                id: "ab",
                locked: false,
                startPointId: "a",
                style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, stroke },
                type: "segment",
                updatedAt: 2,
                visible: true,
            },
            b: point("b", "B", 1, 0),
        }, "academic").code;
        if (code.includes("ndvColor0B0F14") || code.includes("ndvColor000000")) {
            throw new Error(`Default black should be implicit for ${stroke}.`);
        }
    });
}
function assertNonBlackColorIsExported() {
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 0, 0),
        ab: {
            createdAt: 2,
            dependencies: ["a", "b"],
            dependents: [],
            endPointId: "b",
            id: "ab",
            locked: false,
            startPointId: "a",
            style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, stroke: "#ff0000" },
            type: "segment",
            updatedAt: 2,
            visible: true,
        },
        b: point("b", "B", 1, 0),
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\definecolor{ndvColorFF0000}{HTML}{FF0000}", "non-black colors are defined");
    (0, assert_1.assertIncludes)(code, "draw=ndvColorFF0000", "non-black colors are applied");
}
function assertRayIsExported() {
    const ray = {
        createdAt: 2,
        dependencies: ["a", "b"],
        dependents: [],
        id: "ray-ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        throughPointId: "b",
        type: "ray",
        updatedAt: 2,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
        "ray-ab": ray,
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\draw", "TikZ ray exports a draw command");
    (0, assert_1.assertIncludes)(code, "(0,0) -- (10,0);", "TikZ ray clips to export bounds");
}
function assertVectorIsExported() {
    const vector = {
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
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "vector",
        updatedAt: 2,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
        "vector-ab": vector,
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\draw[-{Latex}", "TikZ vector exports an arrow draw command");
    (0, assert_1.assertIncludes)(code, "(A) -- (B);", "TikZ vector exports named endpoints");
}
function assertTextIsExported() {
    const text = {
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
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        textMode: "math",
        type: "text",
        updatedAt: 2,
        visible: true,
        x: 2,
        y: 3,
    };
    const code = (0, tikz_1.generateTikz)({ "text-a": text }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\node", "TikZ text exports a node command");
    (0, assert_1.assertIncludes)(code, "at (2,3)", "TikZ text exports its world position");
    (0, assert_1.assertIncludes)(code, "{$x^2+y^2$};", "TikZ math text preserves math content");
}
function assertThreePointCircleIsExported() {
    const circle = {
        circleKind: "three-points",
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "circle-abc",
        locked: false,
        pointAId: "a",
        pointBId: "b",
        pointCId: "c",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 2,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 1, 0),
        b: point("b", "B", 0, 1),
        c: point("c", "C", -1, 0),
        "circle-abc": circle,
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "(0,0) circle (1);", "TikZ exports three-point circle via computed center");
}
function assertArcIsExported() {
    const arc = {
        centerPointId: "o",
        createdAt: 2,
        dependencies: ["o", "a", "b"],
        dependents: [],
        direction: "counterclockwise",
        endPointId: "b",
        id: "arc-ab",
        locked: false,
        startPointId: "a",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 2,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 1, 0),
        b: point("b", "B", 0, 1),
        o: point("o", "O", 0, 0),
        "arc-ab": arc,
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "arc[start angle=0, end angle=90, radius=1];", "TikZ exports arcs");
}
function assertRegionIsExported() {
    const region = {
        boundaryPointIds: ["a", "b", "c"],
        createdAt: 2,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "region-abc",
        locked: false,
        style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, fill: "#7ddcff", fillOpacity: 0.2 },
        type: "region",
        updatedAt: 2,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 4, 0),
        c: point("c", "C", 0, 3),
        "region-abc": region,
    }, "colorful").code;
    (0, assert_1.assertIncludes)(code, "\\filldraw", "TikZ exports regions as filled boundaries");
    (0, assert_1.assertIncludes)(code, "fill opacity=0.2", "TikZ region preserves fill opacity");
}
function assertPolygonFillModes() {
    const polygon = {
        closed: true,
        createdAt: 3,
        dependencies: ["a", "b", "c"],
        dependents: [],
        id: "polygon-abc",
        locked: false,
        pointIds: ["a", "b", "c"],
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#00ccff",
            fillOpacity: 0.35,
            strokeOpacity: 0.6,
        },
        type: "polygon",
        updatedAt: 3,
        visible: true,
    };
    const code = (0, tikz_1.generateTikz)({
        a: point("a", "A", 0, 0),
        b: point("b", "B", 4, 0),
        c: point("c", "C", 0, 3),
        "polygon-abc": polygon,
    }, "colorful").code;
    (0, assert_1.assertIncludes)(code, "% Filled regions", "filled polygons are grouped before drawings");
    (0, assert_1.assertIncludes)(code, "\\filldraw", "filled polygons use filldraw when stroke is visible");
    (0, assert_1.assertIncludes)(code, "fill opacity=0.35", "polygon fill opacity is exported");
    (0, assert_1.assertIncludes)(code, "draw opacity", "stroke opacity uses draw opacity syntax when needed");
}
function assertOutputModes() {
    const objects = {
        a: point("a", "A", 0, 0),
    };
    const raw = (0, tikz_1.generateTikz)(objects, {
        ...(0, tikz_1.getTikzOptions)("academic"),
        outputType: "raw",
    }).code;
    const document = (0, tikz_1.generateTikz)(objects, {
        ...(0, tikz_1.getTikzOptions)("academic"),
        includeDocumentWrapper: true,
    }).code;
    const minimal = (0, tikz_1.generateTikz)(objects, "minimal").code;
    (0, assert_1.assert)(!raw.includes("\\begin{tikzpicture}"), "raw output excludes tikzpicture wrapper");
    (0, assert_1.assertIncludes)(raw, "\\coordinate (A) at (0,0);", "raw output includes commands");
    (0, assert_1.assertIncludes)(document, "\\documentclass[tikz,border=5pt]{standalone}", "document output has wrapper");
    (0, assert_1.assertIncludes)(document, "\\usetikzlibrary{calc,angles,quotes,intersections,arrows.meta}", "document output includes libraries");
    (0, assert_1.assertIncludes)(minimal, "\\begin{tikzpicture}", "minimal mode still exports a snippet");
    (0, assert_1.assert)(!minimal.includes("% Coordinates"), "minimal mode omits comments");
    (0, assert_1.assert)(!minimal.includes("[scale=1]"), "minimal mode omits redundant scale option");
}
function assertLabelAnchorsAndNameSanitization() {
    const code = (0, tikz_1.generateTikz)({
        a: {
            ...point("a", "A-1", 0, 0),
            style: { ...geometry_1.DEFAULT_GEOMETRY_STYLE, labelPosition: "above-left" },
        },
        b: point("b", "A 1", 1, 0),
    }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\coordinate (A1) at (0,0);", "TikZ names remove punctuation");
    (0, assert_1.assertIncludes)(code, "\\coordinate (A11) at (1,0);", "TikZ names avoid duplicates");
    (0, assert_1.assertIncludes)(code, "\\node[above left] at (A1)", "label anchors follow the spec mapping");
}
function assertInvalidObjectWarnings() {
    const result = (0, tikz_1.generateTikz)({
        ab: {
            createdAt: 1,
            dependencies: ["a", "b"],
            dependents: [],
            endPointId: "b",
            id: "ab",
            locked: false,
            startPointId: "a",
            style: geometry_1.DEFAULT_GEOMETRY_STYLE,
            type: "segment",
            updatedAt: 1,
            visible: true,
        },
    }, "academic");
    (0, assert_1.assertEqual)(result.errors.length, 0, "TikZ generation does not hard fail invalid objects");
    (0, assert_1.assertEqual)(result.warnings[0]?.code, "TIKZ_INVALID_SEGMENT", "invalid objects produce warnings");
}
function assertDeterministicCode() {
    const objects = {
        a: point("a", "A", 0, 0),
        b: point("b", "B", 1, 0),
    };
    const first = (0, tikz_1.generateTikz)(objects, "academic").code;
    const second = (0, tikz_1.generateTikz)(objects, "academic").code;
    (0, assert_1.assertEqual)(first, second, "same scene produces deterministic TikZ code");
}
