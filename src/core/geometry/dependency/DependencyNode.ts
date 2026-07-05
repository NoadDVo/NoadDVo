export type DependencyNode = {
  readonly id: string;
  readonly parents: readonly string[];
  readonly children: readonly string[];
};

export type DependencyGraphError = {
  readonly code: "DEPENDENCY_MISSING_OBJECT" | "DEPENDENCY_MISSING_PARENT" | "DEPENDENCY_CYCLE";
  readonly message: string;
  readonly objectId?: string;
};

export type DependencyGraphResult<TValue> =
  | { readonly valid: true; readonly value: TValue }
  | { readonly valid: false; readonly error: DependencyGraphError };
