import type { GeometryObjectRecord } from "../../core/geometry";
import {
  createLiveTikzToGeometry,
  isSameSyncCycle,
  type LiveSyncStamp,
  type TikzApplyPreview,
} from "../../core/sync";

export type LiveTikzPanelSyncStatus =
  | "applied"
  | "blocked"
  | "commit-failed"
  | "loop"
  | "unchanged";

export type LiveTikzPanelSyncResult = {
  readonly preview: TikzApplyPreview;
  readonly stamp: LiveSyncStamp;
  readonly status: LiveTikzPanelSyncStatus;
};

export function runLiveTikzPanelSync({
  commitObjects,
  currentObjects,
  lastStamp,
  source,
}: {
  readonly commitObjects: (
    objects: GeometryObjectRecord,
    changedObjectIds: readonly string[],
  ) => boolean;
  readonly currentObjects: GeometryObjectRecord;
  readonly lastStamp: LiveSyncStamp | null;
  readonly source: string;
}): LiveTikzPanelSyncResult {
  const liveResult = createLiveTikzToGeometry({
    currentObjects,
    origin: "tikz-editor",
    source,
  });

  if (!liveResult.autoApplicable) {
    return {
      preview: liveResult.preview,
      stamp: liveResult.stamp,
      status: "blocked",
    };
  }

  if (liveResult.preview.applyResult.changedObjectIds.length === 0) {
    return {
      preview: liveResult.preview,
      stamp: liveResult.stamp,
      status: "unchanged",
    };
  }

  if (isSameSyncCycle(lastStamp, liveResult.stamp)) {
    return {
      preview: liveResult.preview,
      stamp: liveResult.stamp,
      status: "loop",
    };
  }

  const committed = commitObjects(
    liveResult.preview.applyResult.objectRecord,
    liveResult.preview.applyResult.changedObjectIds,
  );

  return {
    preview: liveResult.preview,
    stamp: liveResult.stamp,
    status: committed ? "applied" : "commit-failed",
  };
}
