import {
  DEFAULT_GEOMETRY_STYLE,
  type GeometryObjectRecord,
  type PointObject,
  type SegmentObject,
} from "../../core/geometry";
import {
  syncEngine,
  syncGeometryToTikz,
  syncTikzToGeometry,
} from "../../core/sync";
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

export function runSyncTests(): void {
  assertGeometryToTikzSyncPlan();
  assertTikzToGeometrySyncPlan();
  assertSyncDiagnostics();
  assertSyncEngineFacade();
}

function assertGeometryToTikzSyncPlan(): void {
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
    ab: segment("ab", "a", "b"),
    b: point("b", "B", 1, 0),
  };
  const result = syncGeometryToTikz({ objects, sourceId: "scene-a" });

  assertEqual(result.direction, "geometry-to-tikz", "sync result records geometry-to-tikz direction");
  assertEqual(result.status, "ready", "valid geometry-to-tikz sync is ready");
  assertIncludes(result.tikz.code, "\\coordinate (A) at (0,0);", "sync output includes generated TikZ");
  assertEqual(result.plan.operations[0]?.type, "generate-tikz", "geometry-to-tikz sync plans generation");
  assertEqual(result.intermediate.source, "geometry", "geometry sync creates geometry intermediate scene");
  assert(
    result.intermediate.objects.some(
      (object) => object.objectId === "a" && object.tikzName === "A",
    ),
    "geometry intermediate preserves point TikZ names",
  );
}

function assertTikzToGeometrySyncPlan(): void {
  const source = [
    "\\coordinate (A) at (0,0);",
    "\\coordinate (B) at (2,0);",
    "\\draw (A) -- (B);",
  ].join("\n");
  const result = syncTikzToGeometry({ source, sourceId: "tikz-a" });

  assertEqual(result.direction, "tikz-to-geometry", "sync result records tikz-to-geometry direction");
  assertEqual(result.status, "ready", "supported TikZ sync is ready");
  assert(result.validation.valid, "tikz-to-geometry validates recovered objects");
  assertEqual(result.plan.operations[0]?.type, "parse-tikz", "tikz-to-geometry sync starts with parsing");
  assertEqual(result.intermediate.source, "tikz", "tikz sync creates TikZ intermediate scene");
  assert(result.objectRecord["point-A"]?.type === "point", "TikZ sync recovers named point A");
  assert(result.objects.some((object) => object.type === "segment"), "TikZ sync recovers segment geometry");
}

function assertSyncDiagnostics(): void {
  const result = syncTikzToGeometry({
    source: ["\\coordinate (A) at (0,0);", "\\shade (A) circle (1);"].join("\n"),
  });

  assertEqual(result.status, "partial", "unsupported recoverable TikZ yields partial sync status");
  assert(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "TIKZ_UNSUPPORTED_COMMAND" &&
        diagnostic.severity === "warning" &&
        diagnostic.direction === "tikz-to-geometry",
    ),
    "sync diagnostics include normalized parser warnings",
  );
}

function assertSyncEngineFacade(): void {
  const objects: GeometryObjectRecord = {
    a: point("a", "A", 0, 0),
  };
  const geometryResult = syncEngine.syncGeometryToTikz({ objects });
  const tikzResult = syncEngine.syncTikzToGeometry({
    source: "\\coordinate (A) at (0,0);",
  });

  assertEqual(geometryResult.direction, "geometry-to-tikz", "sync engine exposes geometry-to-tikz");
  assertEqual(tikzResult.direction, "tikz-to-geometry", "sync engine exposes tikz-to-geometry");
}
