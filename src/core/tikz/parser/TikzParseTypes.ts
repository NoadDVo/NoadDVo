export type TikzParseIssue = {
  readonly code: string;
  readonly message: string;
  readonly line?: number;
};

export type TikzParseResult = {
  readonly supported: false;
  readonly objects: readonly never[];
  readonly issues: readonly TikzParseIssue[];
};

