import type { GeometryObjectRecord } from "../geometry";
import type { TikzGeneratedOutput } from "../tikz";
import { generateTikz, type TikzMode } from "../tikz";
import { createTikzApplyPreview, type TikzApplyPreview } from "./TikzApplyPreview";

export type SyncProvenanceSource =
  | "canvas"
  | "inspector"
  | "object-tree"
  | "tikz-editor"
  | "apply-preview"
  | "import"
  | "system";

export type LiveSyncDirection = "geometry-to-tikz" | "tikz-to-geometry";

export type LiveSyncStamp = {
  readonly direction: LiveSyncDirection;
  readonly hash: string;
  readonly origin: SyncProvenanceSource;
  readonly timestamp: number;
};

export type LiveGeometryToTikzResult = {
  readonly stamp: LiveSyncStamp;
  readonly tikz: TikzGeneratedOutput;
};

export type LiveTikzToGeometryResult = {
  readonly autoApplicable: boolean;
  readonly preview: TikzApplyPreview;
  readonly stamp: LiveSyncStamp;
};

export const LIVE_TIKZ_SYNC_DEBOUNCE_MS = 400;

export function createSyncHash(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return hash.toString(36);
}

export function createLiveSyncStamp({
  direction,
  origin,
  value,
}: {
  readonly direction: LiveSyncDirection;
  readonly origin: SyncProvenanceSource;
  readonly value: string;
}): LiveSyncStamp {
  return {
    direction,
    hash: createSyncHash(value),
    origin,
    timestamp: Date.now(),
  };
}

export function isSameSyncCycle(
  previous: LiveSyncStamp | null,
  next: LiveSyncStamp,
): boolean {
  return Boolean(
    previous &&
      previous.direction === next.direction &&
      previous.hash === next.hash &&
      previous.origin === next.origin,
  );
}

export function shouldAutoApplyPreview(preview: TikzApplyPreview): boolean {
  return (
    preview.canApply &&
    preview.applyResult.status === "ready" &&
    preview.groups.conflicts.length === 0 &&
    preview.groups.warnings.length === 0 &&
    preview.groups.deletes.length === 0 &&
    !preview.requiresDestructiveConfirmation &&
    !preview.requiresPartialConfirmation
  );
}

export function createLiveGeometryToTikz({
  mode,
  objects,
  origin,
}: {
  readonly mode: TikzMode;
  readonly objects: GeometryObjectRecord;
  readonly origin: SyncProvenanceSource;
}): LiveGeometryToTikzResult {
  const tikz = generateTikz(objects, mode);

  return {
    stamp: createLiveSyncStamp({
      direction: "geometry-to-tikz",
      origin,
      value: tikz.code,
    }),
    tikz,
  };
}

export function createLiveTikzToGeometry({
  currentObjects,
  origin,
  source,
}: {
  readonly currentObjects: GeometryObjectRecord;
  readonly origin: SyncProvenanceSource;
  readonly source: string;
}): LiveTikzToGeometryResult {
  const preview = createTikzApplyPreview({
    currentObjects,
    source,
  });

  return {
    autoApplicable: shouldAutoApplyPreview(preview),
    preview,
    stamp: createLiveSyncStamp({
      direction: "tikz-to-geometry",
      origin,
      value: source,
    }),
  };
}
