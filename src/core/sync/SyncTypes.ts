import type {
  GeometryObject,
  GeometryObjectRecord,
  GeometryObjectType,
  ValidationResult,
} from "../geometry";
import type {
  TikzGeneratedOutput,
  TikzOptions,
  TikzParseResult,
} from "../tikz";

export type SyncDirection = "geometry-to-tikz" | "tikz-to-geometry";

export type SyncStatus = "ready" | "partial" | "failed";

export type SyncDiagnosticSeverity = "info" | "warning" | "error";

export type SyncDiagnostic = {
  readonly code: string;
  readonly message: string;
  readonly severity: SyncDiagnosticSeverity;
  readonly direction?: SyncDirection | undefined;
  readonly objectId?: string | undefined;
  readonly line?: number | undefined;
  readonly column?: number | undefined;
};

export type SyncIntermediateSource = "geometry" | "tikz";

export type SyncIntermediateObject = {
  readonly dependencies: readonly string[];
  readonly objectId: string;
  readonly objectType: GeometryObjectType;
  readonly signature: string;
  readonly source: SyncIntermediateSource;
  readonly tikzName?: string | undefined;
};

export type SyncIntermediateScene = {
  readonly objects: readonly SyncIntermediateObject[];
  readonly source: SyncIntermediateSource;
};

export type SyncPlanOperationType =
  | "generate-tikz"
  | "parse-tikz"
  | "validate-geometry"
  | "candidate-replace-scene";

export type SyncPlanOperation = {
  readonly type: SyncPlanOperationType;
  readonly description: string;
  readonly objectIds?: readonly string[] | undefined;
};

export type SyncPlan = {
  readonly direction: SyncDirection;
  readonly operations: readonly SyncPlanOperation[];
};

export type SyncContext = {
  readonly createdAt: number;
  readonly direction: SyncDirection;
  readonly sourceId: string;
  readonly tikzOptions: TikzOptions;
};

export type GeometryToTikzSyncResult = {
  readonly context: SyncContext;
  readonly diagnostics: readonly SyncDiagnostic[];
  readonly direction: "geometry-to-tikz";
  readonly intermediate: SyncIntermediateScene;
  readonly plan: SyncPlan;
  readonly status: SyncStatus;
  readonly tikz: TikzGeneratedOutput;
};

export type TikzToGeometrySyncResult = {
  readonly context: SyncContext;
  readonly diagnostics: readonly SyncDiagnostic[];
  readonly direction: "tikz-to-geometry";
  readonly intermediate: SyncIntermediateScene;
  readonly objects: readonly GeometryObject[];
  readonly objectRecord: GeometryObjectRecord;
  readonly parseResult: TikzParseResult;
  readonly plan: SyncPlan;
  readonly status: SyncStatus;
  readonly validation: ValidationResult;
};

export type SyncResult = GeometryToTikzSyncResult | TikzToGeometrySyncResult;
