import { useGeometryStore } from "../../app/store/geometryStore";
import {
  DEFAULT_GEOMETRY_STYLE,
  type CircleObject,
  type GeometryObjectRecord,
  type PointObject,
  type PolygonObject,
  type RegionObject,
  type SegmentObject,
} from "../../core/geometry";
import { historyManager } from "../../core/history";
import {
  LIVE_TIKZ_SYNC_DEBOUNCE_MS,
  createLiveGeometryToTikz,
  createLiveSyncStamp,
  createLiveTikzToGeometry,
  isSameSyncCycle,
} from "../../core/sync";
import { generateTikz } from "../../core/tikz";
import { runLiveTikzPanelSync } from "../../features/tikz-panel/liveTikzPanelSync";
import {
  getTikzPanelDisplayedCode,
  getTikzPanelStatusText,
  shouldFollowGeneratedTikz,
} from "../../features/tikz-panel/tikzPanelState";
import { assert, assertEqual, assertIncludes } from "../assert";

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

function circle(id: string, centerPointId: string, radius: number): CircleObject {
  return {
    circleKind: "center-radius",
    centerPointId,
    createdAt: 3,
    dependencies: [centerPointId],
    dependents: [],
    id,
    locked: false,
    radius,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 3,
    visible: true,
  };
}

function polygon(id: string, pointIds: readonly string[]): PolygonObject {
  return {
    closed: true,
    createdAt: 4,
    dependencies: pointIds,
    dependents: [],
    id,
    locked: false,
    pointIds,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 4,
    visible: true,
  };
}

function region(id: string, boundaryPointIds: readonly string[]): RegionObject {
  return {
    boundaryPointIds,
    createdAt: 5,
    dependencies: boundaryPointIds,
    dependents: [],
    id,
    locked: false,
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#60a5fa",
      fillOpacity: 0.3,
    },
    type: "region",
    updatedAt: 5,
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

export function runLiveSyncTests(): void {
  assertMovingPointUpdatesTikz();
  assertEditingTikzUpdatesExistingPoint();
  assertDebounceContractForRapidTyping();
  assertLoopPreventionStamp();
  assertUndoRedoDuringLiveSync();
  assertIdentityAndDependencyPreservation();
  assertLargeScenePerformance();
  assertPanelIntegrationAcceptancePath();
  assertTikzPanelGeneratedCodeState();
  assertGeneratedTikzAcceptanceCoverage();
}

function assertMovingPointUpdatesTikz(): void {
  const scene = {
    ...baseScene(),
    a: point("a", "A", 3, 4),
  };
  const result = createLiveGeometryToTikz({
    mode: "academic",
    objects: scene,
    origin: "canvas",
  });

  assertIncludes(result.tikz.code, "\\coordinate (A) at (3,4);", "moving a point updates generated TikZ");
  assertEqual(result.stamp.origin, "canvas", "geometry-to-TikZ sync records provenance");
}

function assertEditingTikzUpdatesExistingPoint(): void {
  resetGeometryStore(baseScene());

  const liveResult = createLiveTikzToGeometry({
    currentObjects: useGeometryStore.getState().objects,
    origin: "tikz-editor",
    source: [
      "\\coordinate (A) at (5,6);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  assert(liveResult.autoApplicable, "clean TikZ edit can auto-apply");
  assert(
    useGeometryStore.getState().setObjects(
      liveResult.preview.applyResult.objectRecord,
      "Live TikZ sync",
      liveResult.preview.applyResult.changedObjectIds,
    ),
    "live TikZ sync commits through geometry store",
  );

  const pointA = useGeometryStore.getState().objects.a;

  if (pointA?.type !== "point") {
    throw new Error("existing point A survives live sync");
  }

  assertEqual(pointA.x, 5, "live TikZ sync updates existing point x");
  assertEqual(pointA.y, 6, "live TikZ sync updates existing point y");
}

function assertDebounceContractForRapidTyping(): void {
  assertEqual(LIVE_TIKZ_SYNC_DEBOUNCE_MS, 400, "live TikZ sync uses a 400ms debounce");

  const fragments = [
    "\\coordinate",
    "\\coordinate (A)",
    "\\coordinate (A) at",
    "\\coordinate (A) at (1,",
    [
      "\\coordinate (A) at (1,2);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  ];
  const startedAt = Date.now();
  const previews = fragments.map((source) =>
    createLiveTikzToGeometry({
      currentObjects: baseScene(),
      origin: "tikz-editor",
      source,
    }),
  );
  const elapsed = Date.now() - startedAt;

  assert(elapsed < 1000, "rapid TikZ fragments parse without freezing the test runner");
  assert(previews[previews.length - 1]?.autoApplicable, "final complete fragment is auto-applicable");
}

function assertLoopPreventionStamp(): void {
  const first = createLiveSyncStamp({
    direction: "tikz-to-geometry",
    origin: "tikz-editor",
    value: "\\coordinate (A) at (1,2);",
  });
  const same = createLiveSyncStamp({
    direction: "tikz-to-geometry",
    origin: "tikz-editor",
    value: "\\coordinate (A) at (1,2);",
  });
  const different = createLiveSyncStamp({
    direction: "geometry-to-tikz",
    origin: "canvas",
    value: "\\coordinate (A) at (1,2);",
  });

  assert(isSameSyncCycle(first, same), "same live sync stamp prevents repeat cycles");
  assert(!isSameSyncCycle(first, different), "different origin or direction is not treated as a loop");
}

function assertUndoRedoDuringLiveSync(): void {
  resetGeometryStore(baseScene());

  const liveResult = createLiveTikzToGeometry({
    currentObjects: useGeometryStore.getState().objects,
    origin: "tikz-editor",
    source: [
      "\\coordinate (A) at (7,8);",
      "\\coordinate (B) at (1,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });

  useGeometryStore.getState().setObjects(
    liveResult.preview.applyResult.objectRecord,
    "Live TikZ sync",
    liveResult.preview.applyResult.changedObjectIds,
  );
  useGeometryStore.getState().undo();

  const undone = useGeometryStore.getState().objects.a;

  if (undone?.type !== "point") {
    throw new Error("undo keeps point A");
  }

  assertEqual(undone.x, 0, "undo restores geometry before live sync");

  useGeometryStore.getState().redo();

  const redone = useGeometryStore.getState().objects.a;

  if (redone?.type !== "point") {
    throw new Error("redo keeps point A");
  }

  assertEqual(redone.x, 7, "redo reapplies live sync geometry");
}

function assertIdentityAndDependencyPreservation(): void {
  const liveResult = createLiveTikzToGeometry({
    currentObjects: baseScene(),
    origin: "tikz-editor",
    source: [
      "\\coordinate (A) at (2,0);",
      "\\coordinate (B) at (3,0);",
      "\\draw (A) -- (B);",
    ].join("\n"),
  });
  const segmentObject = liveResult.preview.applyResult.objectRecord.ab;

  assert(liveResult.autoApplicable, "identity-preserving edit is auto-applicable");

  if (segmentObject?.type !== "segment") {
    throw new Error("segment identity is preserved");
  }

  assertEqual(segmentObject.startPointId, "a", "segment dependency on A is preserved");
  assertEqual(segmentObject.endPointId, "b", "segment dependency on B is preserved");
}

function largeScene(count: number): GeometryObjectRecord {
  const objects: Record<string, PointObject> = {};

  for (let index = 0; index < count; index += 1) {
    objects[`p${index}`] = point(`p${index}`, `P${index}`, index, index % 10);
  }

  return objects;
}

function assertLargeScenePerformance(): void {
  const objects = largeScene(200);
  const startedAt = Date.now();
  const result = createLiveGeometryToTikz({
    mode: "minimal",
    objects,
    origin: "system",
  });
  const elapsed = Date.now() - startedAt;

  assert(result.tikz.code.length > 0, "large scene produces TikZ");
  assert(elapsed < 2000, "large scene Geometry-to-TikZ sync stays responsive");
}

function assertPanelIntegrationAcceptancePath(): void {
  resetGeometryStore({
    a: point("a", "A", 0, 0),
  });
  useGeometryStore.getState().setSelectedObjects(["a"]);

  const generated = generateTikz(useGeometryStore.getState().objects, "academic").code;
  const edited = generated.replace("\\coordinate (A) at (0,0);", "\\coordinate (A) at (2,3);");
  const result = runLiveTikzPanelSync({
    commitObjects: (objects, changedObjectIds) =>
      useGeometryStore.getState().setObjects(objects, "Live TikZ sync", changedObjectIds),
    currentObjects: useGeometryStore.getState().objects,
    lastStamp: null,
    source: edited,
  });

  assertEqual(result.status, "applied", "panel live sync helper applies safe coordinate edits");

  const movedPoint = useGeometryStore.getState().objects.a;

  if (movedPoint?.type !== "point") {
    throw new Error("panel live sync preserves point A identity");
  }

  assertEqual(movedPoint.x, 2, "panel live sync updates canvas-backed point x");
  assertEqual(movedPoint.y, 3, "panel live sync updates canvas-backed point y");
  assertEqual(useGeometryStore.getState().selectedObjectIds[0], "a", "selection remains on point A for inspector/object tree");
  assert(useGeometryStore.getState().canUndo, "panel live sync creates history for undo");

  useGeometryStore.getState().undo();

  const restoredPoint = useGeometryStore.getState().objects.a;

  if (restoredPoint?.type !== "point") {
    throw new Error("undo preserves point A identity");
  }

  assertEqual(restoredPoint.x, 0, "undo restores point A x");
  assertEqual(restoredPoint.y, 0, "undo restores point A y");
}

function assertTikzPanelGeneratedCodeState(): void {
  const generatedCode = "\\coordinate (A) at (0,0);";
  const updatedGeneratedCode = "\\coordinate (A) at (2,3);";
  const draftCode = "\\coordinate (A) at (5,6);";

  assert(
    shouldFollowGeneratedTikz({
      autoUpdate: false,
      editable: true,
      manualEditsPending: false,
    }),
    "editable mode without pending manual edits still follows generated TikZ",
  );
  assert(
    shouldFollowGeneratedTikz({
      autoUpdate: false,
      editable: false,
      manualEditsPending: true,
    }),
    "readonly mode follows generated TikZ even if an old manual draft exists",
  );
  assertEqual(
    getTikzPanelDisplayedCode({
      autoUpdate: false,
      draftCode,
      editable: true,
      generatedCode: updatedGeneratedCode,
      manualEditsPending: false,
    }),
    updatedGeneratedCode,
    "geometry changes update the panel when no manual edits are pending",
  );
  assertEqual(
    getTikzPanelDisplayedCode({
      autoUpdate: false,
      draftCode,
      editable: true,
      generatedCode,
      manualEditsPending: true,
    }),
    draftCode,
    "pending manual edits keep the editable draft visible",
  );
  assertIncludes(
    getTikzPanelStatusText({
      autoUpdate: false,
      liveSyncEnabled: true,
      liveSyncStatus: "blocked",
      manualEditsPending: true,
    }),
    "Manual edits pending",
    "manual TikZ edits are visible in panel status",
  );
}

function assertGeneratedTikzAcceptanceCoverage(): void {
  const scene: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
    ab: segment("ab", "a", "b"),
    b: point("b", "B", 2, 0),
    c: point("c", "C", 0, 2),
    circleA: circle("circleA", "a", 2),
    polygonAbc: polygon("polygonAbc", ["a", "b", "c"]),
    regionAbc: region("regionAbc", ["a", "b", "c"]),
  };
  const initialCode = generateTikz(scene, "academic").code;
  const movedCode = generateTikz(
    {
      ...scene,
      a: point("a", "A", 1, 1),
    },
    "academic",
  ).code;

  assertIncludes(initialCode, "\\coordinate (A) at (0,0);", "creating point A generates a coordinate");
  assertIncludes(initialCode, "\\coordinate (B) at (2,0);", "creating segment endpoint B generates a coordinate");
  assertIncludes(initialCode, "(A) -- (B)", "creating segment AB generates a segment draw command");
  assertIncludes(initialCode, "circle", "creating a circle generates a circle command");
  assertIncludes(initialCode, "(A) -- (B) -- (C) -- cycle", "creating polygon ABC generates a closed polygon path");
  assertIncludes(initialCode, "\\filldraw", "creating a region generates a fill command");
  assertIncludes(movedCode, "\\coordinate (A) at (1,1);", "moving A regenerates its TikZ coordinate");
}
