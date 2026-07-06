import type { GeometryObject } from "../../geometry";

export type TikzParseIssue = {
  readonly code: string;
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly severity: "warning" | "error";
};

export type TikzTokenType =
  | "command"
  | "identifier"
  | "number"
  | "string"
  | "symbol"
  | "operator";

export type TikzToken = {
  readonly type: TikzTokenType;
  readonly value: string;
  readonly index: number;
  readonly line: number;
  readonly column: number;
};

export type TikzCommandNode = {
  readonly type: "command";
  readonly name: string;
  readonly options: readonly string[];
  readonly argumentText: string;
  readonly raw: string;
  readonly line: number;
  readonly column: number;
};

export type TikzAst = {
  readonly type: "tikz-document";
  readonly commands: readonly TikzCommandNode[];
};

export type TikzParseResult = {
  readonly ast: TikzAst;
  readonly issues: readonly TikzParseIssue[];
  readonly objects: readonly GeometryObject[];
  readonly supported: boolean;
  readonly tokens: readonly TikzToken[];
};
