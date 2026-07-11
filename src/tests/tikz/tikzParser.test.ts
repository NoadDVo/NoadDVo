import { parseTikz, tokenizeTikz } from "../../core/tikz";
import { assert, assertEqual } from "../assert";

export function runTikzParserTests(): void {
  assertTokenizer();
  assertAstAndGeometryRecovery();
  assertFillVectorCircleArcTextAndAngleRecovery();
  assertSyntaxValidation();
  assertUnsupportedCommandRecovery();
}

function assertTokenizer(): void {
  const tokens = tokenizeTikz("\\coordinate (A) at (0,0);").tokens;

  assertEqual(tokens[0]?.type, "command", "tokenizer emits command tokens");
  assertEqual(tokens[0]?.value, "\\coordinate", "tokenizer preserves command names");
  assert(tokens.some((token) => token.value === ";"), "tokenizer emits semicolons");
}

function assertAstAndGeometryRecovery(): void {
  const result = parseTikz(`
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

  assert(result.supported, "valid TikZ parses as supported");
  assert(result.ast.commands.some((command) => command.name === "coordinate"), "parser builds command AST");
  assertEqual(points.length, 3, "coordinate commands recover points");
  assert(polygon?.type === "polygon", "closed draw path recovers polygon");
  assertEqual(polygon?.pointIds.length, 3, "polygon preserves point dependencies");
  assertEqual(pointA?.style.labelPosition, "above-left", "node labels update point label position");
}

function assertFillVectorCircleArcTextAndAngleRecovery(): void {
  const result = parseTikz(`
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

  assert(result.objects.some((object) => object.type === "region"), "filldraw cycle recovers a region");
  assert(result.objects.some((object) => object.type === "vector"), "arrow draw recovers a vector");
  assert(result.objects.some((object) => object.type === "circle"), "circle path recovers a circle");
  assert(result.objects.some((object) => object.type === "arc"), "arc path recovers an arc");
  assert(result.objects.some((object) => object.type === "text"), "positioned node recovers text");
  assert(result.objects.some((object) => object.type === "angle"), "angle pic recovers an angle");
}

function assertSyntaxValidation(): void {
  const result = parseTikz("\\coordinate (A) at (0,0)");

  assert(!result.supported, "syntax errors mark parse result unsupported");
  assertEqual(result.issues[0]?.code, "TIKZ_MISSING_SEMICOLON", "missing semicolon is reported");
}

function assertUnsupportedCommandRecovery(): void {
  const result = parseTikz(`
    \\coordinate (A) at (0,0);
    \\coordinate (B) at (1,0);
    \\draw (A) -- (B);
    \\shade (0,0) circle (1);
  `);

  assert(result.supported, "unsupported commands are recoverable warnings");
  assert(result.objects.some((object) => object.type === "segment"), "supported geometry still recovers");
  assert(
    result.issues.some((issue) => issue.code === "TIKZ_UNSUPPORTED_COMMAND"),
    "unsupported commands are reported",
  );
}
