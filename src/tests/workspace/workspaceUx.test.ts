import { useGeometryStore } from "../../app/store/geometryStore";
import { resolveThemeMode } from "../../app/store/uiStore";
import {
  copySelectionToGeometryClipboard,
  duplicateSelection,
  pasteGeometryClipboard,
} from "../../core/clipboard";
import {
  DEFAULT_GEOMETRY_STYLE,
  type PointObject,
  type SegmentObject,
} from "../../core/geometry";
import { historyManager } from "../../core/history";
import type { Viewport } from "../../core/geometry/viewport";
import { createGridLines } from "../../features/canvas/grid/gridMath";
import { assert, assertEqual } from "../assert";

function point(id: string, x: number, y: number): PointObject {
  return {
    createdAt: 1,
    dependencies: [],
    dependents: [],
    id,
    locked: false,
    name: id.toUpperCase(),
    pointKind: "free",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "point",
    updatedAt: 1,
    visible: true,
    x,
    y,
  };
}

function segment(): SegmentObject {
  return {
    createdAt: 2,
    dependencies: ["a", "b"],
    dependents: [],
    endPointId: "b",
    id: "ab",
    locked: false,
    name: "AB",
    startPointId: "a",
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 2,
    visible: true,
  };
}

export function runWorkspaceUxTests(): void {
  assertClipboardWorkflow();
  assertGridSettingsAffectLineCreation();
  assertThemeResolution();
}

function resetGeometryStore(): void {
  historyManager.clear();
  useGeometryStore.setState({
    canRedo: false,
    canUndo: false,
    historyVersion: 0,
    hoveredObjectId: null,
    lastError: null,
    objects: {},
    selectedObjectIds: [],
  });
}

function assertClipboardWorkflow(): void {
  resetGeometryStore();
  useGeometryStore.setState({
    objects: {
      a: point("a", 0, 0),
      ab: segment(),
      b: point("b", 1, 0),
    },
    selectedObjectIds: ["ab"],
  });

  assert(copySelectionToGeometryClipboard(), "copy stores selected geometry plus dependencies");
  assert(pasteGeometryClipboard(), "paste applies copied geometry through the geometry store");

  const afterPaste = useGeometryStore.getState();
  const pastedSegments = Object.values(afterPaste.objects).filter(
    (object) => object.type === "segment",
  );

  assertEqual(pastedSegments.length, 2, "paste duplicates selected segment");
  assertEqual(afterPaste.selectedObjectIds.length, 1, "paste selects pasted root objects");
  assert(afterPaste.canUndo, "paste integrates with history");
  assert(duplicateSelection(), "duplicate uses the shared clipboard workflow");
}

function assertGridSettingsAffectLineCreation(): void {
  const viewport: Viewport = {
    height: 200,
    offsetX: 0,
    offsetY: 0,
    scale: 20,
    width: 200,
  };
  const withoutMinor = createGridLines(viewport, {
    adaptiveGrid: false,
    gridSize: 1,
    majorGrid: true,
    minorGrid: false,
  });
  const withMinor = createGridLines(viewport, {
    adaptiveGrid: false,
    gridSize: 1,
    majorGrid: true,
    minorGrid: true,
  });

  assert(withMinor.length > withoutMinor.length, "minor grid setting increases rendered grid lines");
  assert(withoutMinor.every((line) => line.major), "minor grid off keeps only major lines");
}

function assertThemeResolution(): void {
  assertEqual(resolveThemeMode("dark-arctic", true), "dark-arctic", "explicit arctic theme resolves unchanged");
  assertEqual(resolveThemeMode("dark", true), "dark", "explicit dark theme resolves unchanged");
  assertEqual(resolveThemeMode("light", false), "light", "explicit light theme resolves unchanged");
  assertEqual(resolveThemeMode("system", true), "light", "system theme follows light preference");
  assertEqual(resolveThemeMode("system", false), "dark", "system theme follows dark preference");
}
