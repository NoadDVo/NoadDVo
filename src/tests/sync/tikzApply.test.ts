import { useGeometryStore } from "../../app/store/geometryStore";
import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type PointObject,
  type SegmentObject,
} from "../../core/geometry";
import { historyManager } from "../../core/history";
import { applyTikzToGeometry, createTikzApplyPreview } from "../../core/sync";
import { assert, assertEqual } from "../assert";

function point(id: string, name: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name,
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

function segment(id: string, startPointId: string, endPointId: string): SegmentObject {
  return {
    createdAt: 2,
    dependencies: [startPointId, endPointId],
    dependents: [],
    endPointId,
    id,
    locked: false,
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 2,
    visible: true,
  };
}

function baseScene(): GeometryObjectRecord {
  return {
    a: point("a", "A", 0, 0),
    ab: segment("ab", "a", "b"),
    b: point("b", "B", 1, 0),
  };
}

export function runTikzApplyTests(): void {
  assertPointCoordinateEditPreservesIdentity();
  assertNewCoordinateCreatesPoint();
  assertSegmentApplyReusesExistingPoints();
  assertUnsupportedTikzDoesNotCrashOrClearScene();
  assertInvalidTikzProducesDiagnostics();
  assertUndoRestoresPreviousGeometry();
  assertPreviewPointCoordinateUpdates();
  assertPreviewNewPointCreation();
  assertPreviewSegmentUpdates();
  assertPreviewDuplicateNameWarning();
  assertPreviewDerivedPointOverwriteWarning();
  assertPreviewBlocksParseErrors();
  assertPreviewCancelLeavesSceneUnchanged();
  assertPreviewApplyCreatesHistoryEntry();
}

function assertPointCoordinateEditPreservesIdentity(): void {
  const result = applyTikzToGeometry({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (2,3);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });
  const pointA = result.objectRecord.a;

  assertEqual(result.status, "ready", "point edit applies cleanly");
  if (pointA?.type !== "point") {
    throw new Error("existing point A keeps its id");
  }
  assertEqual(pointA.x, 2, "point A x coordinate is updated");
  assertEqual(pointA.y, 3, "point A y coordinate is updated");
  assert(result.updatedObjectIds.includes("a"), "point edit is reported as an update");
}

function assertNewCoordinateCreatesPoint(): void {
  const result = applyTikzToGeometry({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (0,0);",
      "\\coordinate (B) at (1,0);",
      "\\coordinate (C) at (0,1);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(result.objectRecord["point-C"]?.type === "point", "new TikZ coordinate creates a point");
  assert(result.createdObjectIds.includes("point-C"), "new point creation is reported");
}

function assertSegmentApplyReusesExistingPoints(): void {
  const result = applyTikzToGeometry({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (0,0);",
      "\\coordinate (B) at (2,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });
  const segmentObject = result.objectRecord.ab;

  if (segmentObject?.type !== "segment") {
    throw new Error("existing segment keeps its id");
  }
  assertEqual(segmentObject.startPointId, "a", "segment start reuses existing point A");
  assertEqual(segmentObject.endPointId, "b", "segment end reuses existing point B");
}

function assertUnsupportedTikzDoesNotCrashOrClearScene(): void {
  const result = applyTikzToGeometry({
    currentObjects: baseScene(),
    source: "\\shade (0,0) circle (1);",
  });

  assertEqual(result.status, "partial", "unsupported-only TikZ returns partial sync");
  assertEqual(Object.keys(result.objectRecord).length, 3, "unsupported-only TikZ preserves scene");
  assert(
    result.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_UNSUPPORTED_COMMAND"),
    "unsupported TikZ produces a diagnostic",
  );
}

function assertInvalidTikzProducesDiagnostics(): void {
  const result = applyTikzToGeometry({
    currentObjects: baseScene(),
    source: "\\coordinate (A) at (0,0)",
  });

  assertEqual(result.status, "failed", "invalid TikZ fails safely");
  assertEqual(result.objectRecord.a?.id, "a", "invalid TikZ preserves existing scene");
  assert(
    result.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_MISSING_SEMICOLON"),
    "invalid TikZ emits parse diagnostics",
  );
}

function resetGeometryStore(objects: GeometryObjectRecord): void {
  historyManager.clear();
  useGeometryStore.setState({
    canRedo: false,
    canUndo: false,
    historyVersion: 0,
    hoveredObjectId: null,
    lastError: null,
    objects,
    selectedObjectIds: [],
  });
}

function assertUndoRestoresPreviousGeometry(): void {
  resetGeometryStore(baseScene());

  const result = applyTikzToGeometry({
    currentObjects: useGeometryStore.getState().objects,
    source: [
      "\\coordinate (A) at (5,6);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assertEqual(result.status, "ready", "TikZ apply result is valid before committing");
  assert(
    useGeometryStore.getState().setObjects(
      result.objectRecord,
      "Apply TikZ to geometry",
      result.changedObjectIds,
    ),
    "TikZ apply commits through geometry store",
  );
  assert(useGeometryStore.getState().canUndo, "TikZ apply creates an undo entry");

  const appliedPoint = useGeometryStore.getState().objects.a;

  if (appliedPoint?.type !== "point") {
    throw new Error("applied point remains present");
  }
  assertEqual(appliedPoint.x, 5, "store contains applied TikZ coordinate");

  useGeometryStore.getState().undo();

  const restoredPoint = useGeometryStore.getState().objects.a;

  if (restoredPoint?.type !== "point") {
    throw new Error("undo restores point");
  }
  assertEqual(restoredPoint.x, 0, "undo restores previous x coordinate");
}

function assertPreviewPointCoordinateUpdates(): void {
  const preview = createTikzApplyPreview({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (2,3);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(preview.canApply, "point coordinate preview can be applied");
  assert(
    preview.groups.updates.some(
      (operation) =>
        operation.objectId === "a" &&
        operation.beforeValue?.includes("(0, 0)") &&
        operation.afterValue?.includes("(2, 3)"),
    ),
    "preview shows point coordinate before and after values",
  );
}

function assertPreviewNewPointCreation(): void {
  const preview = createTikzApplyPreview({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (0,0);",
      "\\coordinate (B) at (1,0);",
      "\\coordinate (C) at (0,1);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(
    preview.groups.creates.some((operation) => operation.objectId === "point-C"),
    "preview groups new coordinates as creates",
  );
}

function assertPreviewSegmentUpdates(): void {
  const preview = createTikzApplyPreview({
    currentObjects: baseScene(),
    source: [
      "\\coordinate (A) at (0,0);",
      "\\coordinate (B) at (2,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(
    preview.groups.updates.some((operation) => operation.objectId === "ab"),
    "preview reports matched segment as an update",
  );
}

function duplicatePointScene(): GeometryObjectRecord {
  return {
    a: point("a", "A", 0, 0),
    a2: point("a2", "A", 4, 4),
  };
}

function assertPreviewDuplicateNameWarning(): void {
  const preview = createTikzApplyPreview({
    currentObjects: duplicatePointScene(),
    source: "\\coordinate (A) at (1,1);",
  });

  assert(
    preview.groups.conflicts.some((operation) =>
      operation.reason.includes("matches multiple existing points"),
    ),
    "duplicate point names are surfaced as conflicts",
  );
}

function derivedPointScene(): GeometryObjectRecord {
  return {
    a: point("a", "A", 0, 0),
    b: point("b", "B", 2, 0),
    m: {
      ...point("m", "M", 1, 0),
      construction: {
        pointAId: "a",
        pointBId: "b",
        type: "midpoint",
      },
      dependencies: ["a", "b"],
      pointKind: "derived",
    },
  };
}

function assertPreviewDerivedPointOverwriteWarning(): void {
  const preview = createTikzApplyPreview({
    currentObjects: derivedPointScene(),
    source: [
      "\\coordinate (A) at (0,0);",
      "\\coordinate (B) at (2,0);",
      "\\coordinate (M) at (1.2,0);",
    ].join("\n"),
  });

  assert(
    preview.groups.conflicts.some((operation) =>
      operation.diagnostics.some(
        (diagnostic) => diagnostic.code === "TIKZ_APPLY_POINT_DEPENDENCY_REPLACED",
      ),
    ),
    "derived point overwrite appears as a conflict",
  );
}

function assertPreviewBlocksParseErrors(): void {
  const preview = createTikzApplyPreview({
    currentObjects: baseScene(),
    source: "\\coordinate (A) at (0,0)",
  });

  assert(!preview.canApply, "preview blocks apply when parse errors exist");
  assert(
    preview.groups.conflicts.some((operation) =>
      operation.diagnostics.some((diagnostic) => diagnostic.code === "TIKZ_MISSING_SEMICOLON"),
    ),
    "parse errors are grouped as conflicts",
  );
}

function assertPreviewCancelLeavesSceneUnchanged(): void {
  resetGeometryStore(baseScene());

  createTikzApplyPreview({
    currentObjects: useGeometryStore.getState().objects,
    source: [
      "\\coordinate (A) at (9,9);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  const pointA = useGeometryStore.getState().objects.a;

  if (pointA?.type !== "point") {
    throw new Error("point A remains present after preview cancel");
  }

  assertEqual(pointA.x, 0, "preview without apply leaves scene unchanged");
  assert(!useGeometryStore.getState().canUndo, "preview without apply does not create history");
}

function assertPreviewApplyCreatesHistoryEntry(): void {
  resetGeometryStore(baseScene());

  const preview = createTikzApplyPreview({
    currentObjects: useGeometryStore.getState().objects,
    source: [
      "\\coordinate (A) at (7,8);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(preview.canApply, "preview is valid before applying");
  assert(
    useGeometryStore.getState().setObjects(
      preview.applyResult.objectRecord,
      "Apply TikZ to geometry",
      preview.applyResult.changedObjectIds,
    ),
    "preview apply commits through geometry store",
  );
  assert(useGeometryStore.getState().canUndo, "preview apply creates history entry");

  useGeometryStore.getState().undo();

  const restoredPoint = useGeometryStore.getState().objects.a;

  if (restoredPoint?.type !== "point") {
    throw new Error("undo restores point after preview apply");
  }

  assertEqual(restoredPoint.x, 0, "undo restores previous geometry after preview apply");
}
