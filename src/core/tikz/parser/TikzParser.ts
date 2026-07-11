import { parseTikzAst } from "./TikzAstParser";
import { buildGeometryFromTikzAst } from "./TikzGeometryBuilder";
import type { TikzParseResult } from "./TikzParseTypes";
import { tokenizeTikz } from "./TikzTokenizer";

export function parseTikz(source: string): TikzParseResult {
  const tokenized = tokenizeTikz(source);
  const parsed = parseTikzAst(tokenized.tokens);
  const geometry = buildGeometryFromTikzAst(parsed.ast);
  const issues = [...tokenized.issues, ...parsed.issues, ...geometry.issues];

  return {
    ast: parsed.ast,
    issues,
    objects: geometry.objects,
    supported: !issues.some((issue) => issue.severity === "error"),
    tokens: tokenized.tokens,
  };
}

export { parseTikzAst } from "./TikzAstParser";
export { tokenizeTikz } from "./TikzTokenizer";
