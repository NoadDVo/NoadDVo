import type { TikzParseResult } from "./TikzParseTypes";

export function parseTikz(_source: string): TikzParseResult {
  return {
    issues: [
      {
        code: "TIKZ_PARSE_NOT_IMPLEMENTED",
        message: "TikZ-to-geometry parsing is planned for a future sync phase.",
      },
    ],
    objects: [],
    supported: false,
  };
}

