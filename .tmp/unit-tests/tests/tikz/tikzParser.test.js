"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTikzParserTests = runTikzParserTests;
const tikz_1 = require("../../core/tikz");
const assert_1 = require("../assert");
function runTikzParserTests() {
    assertTokenizer();
    assertAstAndGeometryRecovery();
    assertFillVectorCircleArcTextAndAngleRecovery();
    assertSyntaxValidation();
    assertUnsupportedCommandRecovery();
}
function assertTokenizer() {
    const tokens = (0, tikz_1.tokenizeTikz)("\\coordinate (A) at (0,0);").tokens;
    (0, assert_1.assertEqual)(tokens[0]?.type, "command", "tokenizer emits command tokens");
    (0, assert_1.assertEqual)(tokens[0]?.value, "\\coordinate", "tokenizer preserves command names");
    (0, assert_1.assert)(tokens.some((token) => token.value === ";"), "tokenizer emits semicolons");
}
function assertAstAndGeometryRecovery() {
    const result = (0, tikz_1.parseTikz)(`
    \\begin{tikzpicture}[scale=1]
    \\coordinate (A) at (0,0);
    \\coordinate (B) at (4,0);
    \\coordinate (C) at (0,3);
    \\draw (A) -- (B) -- (C) -- cycle;
    \\node[above left] at (A) {$A$};
    \\end{tikzpicture}
  `);
    const points = result.objects.filter((object) => object.type === "point");
    const polygon = result.objects.find((object) => object.type === "polygon");
    const pointA = points.find((point) => point.name === "A");
    (0, assert_1.assert)(result.supported, "valid TikZ parses as supported");
    (0, assert_1.assert)(result.ast.commands.some((command) => command.name === "coordinate"), "parser builds command AST");
    (0, assert_1.assertEqual)(points.length, 3, "coordinate commands recover points");
    (0, assert_1.assert)(polygon?.type === "polygon", "closed draw path recovers polygon");
    (0, assert_1.assertEqual)(polygon?.pointIds.length, 3, "polygon preserves point dependencies");
    (0, assert_1.assertEqual)(pointA?.style.labelPosition, "above-left", "node labels update point label position");
}
function assertFillVectorCircleArcTextAndAngleRecovery() {
    const result = (0, tikz_1.parseTikz)(`
    \\definecolor{ndvColorFF0000}{HTML}{FF0000}
    \\coordinate (A) at (0,0);
    \\coordinate (B) at (4,0);
    \\coordinate (C) at (0,3);
    \\filldraw[fill=ndvColorFF0000, fill opacity=0.2] (A) -- (B) -- (C) -- cycle;
    \\draw[-{Latex}] (A) -- (B);
    \\draw (A) circle (2);
    \\draw (2,0) arc[start angle=0, end angle=90, radius=2];
    \\node at (1,2) {Hello};
    \\pic [draw, "$\\alpha$", angle radius=0.6cm] {angle = A--B--C};
  `);
    (0, assert_1.assert)(result.objects.some((object) => object.type === "region"), "filldraw cycle recovers a region");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "vector"), "arrow draw recovers a vector");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "circle"), "circle path recovers a circle");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "arc"), "arc path recovers an arc");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "text"), "positioned node recovers text");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "angle"), "angle pic recovers an angle");
}
function assertSyntaxValidation() {
    const result = (0, tikz_1.parseTikz)("\\coordinate (A) at (0,0)");
    (0, assert_1.assert)(!result.supported, "syntax errors mark parse result unsupported");
    (0, assert_1.assertEqual)(result.issues[0]?.code, "TIKZ_MISSING_SEMICOLON", "missing semicolon is reported");
}
function assertUnsupportedCommandRecovery() {
    const result = (0, tikz_1.parseTikz)(`
    \\coordinate (A) at (0,0);
    \\coordinate (B) at (1,0);
    \\draw (A) -- (B);
    \\shade (0,0) circle (1);
  `);
    (0, assert_1.assert)(result.supported, "unsupported commands are recoverable warnings");
    (0, assert_1.assert)(result.objects.some((object) => object.type === "segment"), "supported geometry still recovers");
    (0, assert_1.assert)(result.issues.some((issue) => issue.code === "TIKZ_UNSUPPORTED_COMMAND"), "unsupported commands are reported");
}
