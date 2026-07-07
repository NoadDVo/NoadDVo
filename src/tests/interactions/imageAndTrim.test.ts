import {
  DEFAULT_GEOMETRY_STYLE,
  createReferenceImageObject,
  type CircleObject,
  type ArcObject,
  type GeometryObjectRecord,
  type LineObject,
  type PointObject,
  type PolygonObject,
  type RayObject,
  type RegionObject,
  type SegmentObject,
  type VectorObject,
} from "../../core/geometry";
import { generateTikz, getTikzOptions } from "../../core/tikz";
import { worldToScreen, type Viewport } from "../../core/geometry/viewport";
import { hitTest } from "../../core/selection/HitTest";
import { MoveTool } from "../../core/tools/MoveTool";
import { getEraseCandidates, TrimTool } from "../../core/tools/TrimTool";
import type { ToolContext, ToolPointerEvent } from "../../core/tools/ToolContext";
import { importProjectJson } from "../../core/export";
import {
  createProjectDocument,
  serializeProjectDocument,
} from "../../core/project/ProjectSerializer";
import { historyManager } from "../../core/history";
import { assert, assertEqual } from "../assert";

const viewport: Viewport = {
  height: 400,
  offsetX: 0,
  offsetY: 0,
  scale: 50,
  width: 500,
};

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
    createdAt: 1,
    dependencies: [startPointId, endPointId],
    dependents: [],
    endPointId,
    id,
    locked: false,
    name: "AB",
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "segment",
    updatedAt: 1,
    visible: true,
  };
}

function circle(id: string, centerPointId: string, radius: number): CircleObject {
  return {
    centerPointId,
    circleKind: "center-radius",
    createdAt: 1,
    dependencies: [centerPointId],
    dependents: [],
    id,
    locked: false,
    name: "c",
    radius,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 1,
    visible: true,
  };
}

function vector(id: string, startPointId: string, endPointId: string): VectorObject {
  return {
    createdAt: 1,
    dependencies: [startPointId, endPointId],
    dependents: [],
    endPointId,
    id,
    locked: false,
    name: "Vector",
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "vector",
    updatedAt: 1,
    visible: true,
  };
}

function line(id: string, pointAId: string, pointBId: string): LineObject {
  return {
    createdAt: 1,
    dependencies: [pointAId, pointBId],
    dependents: [],
    id,
    locked: false,
    name: "Line",
    pointAId,
    pointBId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "line",
    updatedAt: 1,
    visible: true,
  };
}

function ray(id: string, startPointId: string, throughPointId: string): RayObject {
  return {
    createdAt: 1,
    dependencies: [startPointId, throughPointId],
    dependents: [],
    id,
    locked: false,
    name: "Ray",
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    throughPointId,
    type: "ray",
    updatedAt: 1,
    visible: true,
  };
}

function arc(id: string, centerPointId: string, startPointId: string, endPointId: string): ArcObject {
  return {
    centerPointId,
    createdAt: 1,
    dependencies: [centerPointId, startPointId, endPointId],
    dependents: [],
    direction: "counterclockwise",
    endPointId,
    id,
    locked: false,
    name: "Arc",
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 1,
    visible: true,
  };
}

function polygon(id: string, pointIds: readonly string[]): PolygonObject {
  return {
    closed: true,
    createdAt: 1,
    dependencies: [...pointIds],
    dependents: [],
    id,
    locked: false,
    name: "Polygon",
    pointIds,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 1,
    visible: true,
  };
}

function region(id: string, boundaryPointIds: readonly string[]): RegionObject {
  return {
    boundaryPointIds,
    createdAt: 1,
    dependencies: [...boundaryPointIds],
    dependents: [],
    id,
    locked: false,
    name: "Region",
    regionKind: "polygon",
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      fill: "#7ddcff",
      fillOpacity: 0.2,
    },
    type: "region",
    updatedAt: 1,
    visible: true,
  };
}

function pointerEvent(worldPoint: { readonly x: number; readonly y: number }): ToolPointerEvent {
  return {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    screenPoint: worldToScreen(worldPoint, viewport),
    shiftKey: false,
    snappedWorldPoint: worldPoint,
    worldPoint,
  };
}

function context(initialObjects: GeometryObjectRecord): {
  readonly context: ToolContext;
  readonly getObjects: () => GeometryObjectRecord;
  readonly undo: () => void;
} {
  let objects = initialObjects;
  let selectedObjectIds: readonly string[] = [];
  let beforeObjects: GeometryObjectRecord | null = null;

  const toolContext: ToolContext = {
    activeTool: "trim",
    addObject: (object) => {
      objects = { ...objects, [object.id]: object };
      return true;
    },
    beginHistoryTransaction: () => {
      beforeObjects = objects;
    },
    cancelHistoryTransaction: () => {
      beforeObjects = null;
    },
    clearSelection: () => {
      selectedObjectIds = [];
    },
    commitHistoryTransaction: () => {
      beforeObjects = null;
    },
    deleteObject: (objectId) => {
      beforeObjects = objects;
      const next = { ...objects };

      delete next[objectId];
      objects = next;
      selectedObjectIds = selectedObjectIds.filter((id) => id !== objectId);
    },
    gridSize: 1,
    hoveredObjectId: null,
    get objects() {
      return objects;
    },
    pointerWorld: { x: 0, y: 0 },
    selectObject: (objectId) => {
      selectedObjectIds = [objectId];
    },
    get selectedObjectIds() {
      return selectedObjectIds;
    },
    setActiveTool: () => {},
    setHoveredObject: () => {},
    setObjects: (nextObjects, _description, nextSelectedObjectIds) => {
      beforeObjects = objects;
      objects = Array.isArray(nextObjects)
        ? Object.fromEntries(nextObjects.map((object) => [object.id, object]))
        : nextObjects;
      selectedObjectIds = nextSelectedObjectIds ?? selectedObjectIds;
      return true;
    },
    setSelectedObjects: (objectIds) => {
      selectedObjectIds = objectIds;
    },
    snapEnabled: false,
    snapPoint: (pointValue) => pointValue,
    updateObject: (objectId, updater) => {
      const current = objects[objectId];

      if (!current) {
        return false;
      }

      objects = {
        ...objects,
        [objectId]: typeof updater === "function" ? updater(current) : updater,
      };

      return true;
    },
    viewport,
  };

  return {
    context: toolContext,
    getObjects: () => objects,
    undo: () => {
      if (beforeObjects) {
        objects = beforeObjects;
      }
    },
  };
}

export function runImageAndTrimTests(): void {
  assertReferenceImageObjectCreation();
  assertReferenceImageHitTestAndSerialization();
  assertReferenceImageMoveOpacityAndDelete();
  assertTrimSegmentCreatesShorterSegment();
  assertTrimCircleCreatesArc();
  assertTrimDeleteObject();
  assertPreviewEraseWholeSegment();
  assertPreviewEraseWholeVector();
  assertPreviewEraseLineAndRaySafely();
  assertCircleArcCandidateSelection();
  assertPreviewTrimCircleArc();
  assertPreviewEraseArc();
  assertPreviewErasePolygonEdgeSafely();
  assertPreviewDeleteRegion();
  assertLockedObjectIsNotErasable();
  assertCandidateCyclingCommitsSelectedCandidate();
  assertTrimmedObjectsExportToTikz();
  assertUndoRestoresPreviousObjects();
}

function assertReferenceImageMoveOpacityAndDelete(): void {
  const image = createReferenceImageObject({
    height: 2,
    mimeType: "image/png",
    position: { x: 0, y: 0 },
    src: "data:image/png;base64,abc",
    width: 3,
  });
  const move = new MoveTool();
  const tool = context({ [image.id]: image });

  move.activate(tool.context);
  move.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);
  move.pointerMove(pointerEvent({ x: 1, y: 1 }), tool.context);
  move.pointerUp(pointerEvent({ x: 1, y: 1 }), tool.context);

  const movedImage = tool.getObjects()[image.id];

  assertEqual(movedImage?.type, "image", "moved reference image remains an image");
  assertEqual(movedImage?.type === "image" ? movedImage.x : null, 1, "reference image moves on x");
  assertEqual(movedImage?.type === "image" ? movedImage.y : null, 1, "reference image moves on y");

  tool.context.updateObject(image.id, (current) =>
    current.type === "image"
      ? {
          ...current,
          opacity: 0.2,
          updatedAt: 2,
          width: 4,
        }
      : current,
  );

  const updatedImage = tool.getObjects()[image.id];

  assertEqual(updatedImage?.type === "image" ? updatedImage.opacity : null, 0.2, "reference image opacity updates");
  assertEqual(updatedImage?.type === "image" ? updatedImage.width : null, 4, "reference image scale updates through dimensions");

  tool.context.deleteObject(image.id);

  assert(!tool.getObjects()[image.id], "reference image deletes through geometry store actions");
}

function assertReferenceImageObjectCreation(): void {
  const image = createReferenceImageObject({
    mimeType: "image/png",
    position: { x: 2, y: 3 },
    src: "data:image/png;base64,abc",
  });

  assertEqual(image.type, "image", "reference image is a geometry object");
  assertEqual(image.opacity, 0.45, "reference image uses tracing opacity");
  assertEqual(image.x, 2, "reference image stores x position");
  assertEqual(image.y, 3, "reference image stores y position");
}

function assertReferenceImageHitTestAndSerialization(): void {
  const image = createReferenceImageObject({
    height: 2,
    mimeType: "image/svg+xml",
    position: { x: 0, y: 0 },
    src: "data:image/svg+xml;base64,PHN2Zy8+",
    width: 3,
  });
  const objects = { [image.id]: image };
  const hit = hitTest(
    worldToScreen({ x: 0.2, y: 0.2 }, viewport),
    { x: 0.2, y: 0.2 },
    objects,
    viewport,
  );

  assertEqual(hit?.objectId, image.id, "reference image is selectable by hit testing");

  const document = createProjectDocument(
    {
      author: "NoadDVo",
      createdAt: "2026-01-01T00:00:00.000Z",
      description: "",
      id: "project-image-test",
      name: "Image Test",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    {
      objects,
      selectedObjectIds: [image.id],
      settings: {
        gridSize: 1,
        showAxes: true,
        showGrid: true,
        snapEnabled: true,
      },
      theme: "dark-arctic",
      tikzOptions: getTikzOptions("academic"),
      viewport,
    },
  );
  const imported = importProjectJson(serializeProjectDocument(document));

  assert(imported.valid, "project with embedded reference image imports");
  assertEqual(imported.valid ? imported.objects[image.id]?.type : null, "image", "image object survives project import");
}

function assertTrimSegmentCreatesShorterSegment(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const ab = segment("ab", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, ab, b });

  trim.activate(tool.context);
  trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 3, y: 0 }), tool.context);

  const objects = Object.values(tool.getObjects());
  const trimmedSegment = objects.find((object): object is SegmentObject => object.type === "segment" && object.id !== "ab");

  assert(!tool.getObjects().ab, "source segment is removed after trim");
  assert(trimmedSegment, "trim creates a replacement segment");
}

function assertTrimCircleCreatesArc(): void {
  const o = point("o", "O", 0, 0);
  const c = circle("c", "o", 2);
  const trim = new TrimTool();
  const tool = context({ c, o });

  trim.activate(tool.context);
  trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);
  trim.pointerDown(pointerEvent({ x: -2, y: 0 }), tool.context);

  const objects = Object.values(tool.getObjects());
  const arc = objects.find((object) => object.type === "arc");

  assert(!tool.getObjects().c, "source circle is removed after trim");
  assert(arc, "trim creates an arc from a circle");
}

function assertTrimDeleteObject(): void {
  const a = point("a", "A", 0, 0);
  const trim = new TrimTool();
  const tool = context({ a });

  trim.activate(tool.context);
  trim.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);

  assert(!tool.getObjects().a, "trim tool can delete a whole object");
}

function assertPreviewEraseWholeSegment(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const ab = segment("ab", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, ab, b });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
  assert(trim.renderPreview(tool.context) !== null, "erase preview renders for segment");
  trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);

  assert(!tool.getObjects().ab, "preview click erases highlighted segment");
}

function assertPreviewEraseWholeVector(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const v = vector("v", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, b, v });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);

  assert(!tool.getObjects().v, "preview click erases highlighted vector");
}

function assertPreviewEraseLineAndRaySafely(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const l = line("l", "a", "b");
  const r = ray("r", "a", "b");
  const trimLine = new TrimTool();
  const lineTool = context({ a, b, l });

  trimLine.activate(lineTool.context);
  trimLine.pointerMove(pointerEvent({ x: 2, y: 0 }), lineTool.context);
  trimLine.pointerDown(pointerEvent({ x: 2, y: 0 }), lineTool.context);

  assert(!lineTool.getObjects().l, "line erase removes infinite geometry safely");

  const trimRay = new TrimTool();
  const rayTool = context({ a, b, r });

  trimRay.activate(rayTool.context);
  trimRay.pointerMove(pointerEvent({ x: 2, y: 0 }), rayTool.context);
  trimRay.pointerDown(pointerEvent({ x: 2, y: 0 }), rayTool.context);

  assert(!rayTool.getObjects().r, "ray erase removes infinite geometry safely");
}

function assertCircleArcCandidateSelection(): void {
  const o = point("o", "O", 0, 0);
  const p = point("p", "P", 2, 0);
  const q = point("q", "Q", -2, 0);
  const c = circle("c", "o", 2);
  const candidates = getEraseCandidates({ x: 0, y: 2 }, { c, o, p, q }, 0.2);
  const arcCandidate = candidates.find((candidate) => candidate.sourceObjectId === "c");

  assertEqual(arcCandidate?.candidateType, "trim-piece", "circle with cut points offers local arc erase candidate");
}

function assertPreviewTrimCircleArc(): void {
  const o = point("o", "O", 0, 0);
  const p = point("p", "P", 2, 0);
  const q = point("q", "Q", -2, 0);
  const c = circle("c", "o", 2);
  const trim = new TrimTool();
  const tool = context({ c, o, p, q });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 0, y: 2 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 0, y: 2 }), tool.context);

  assert(!tool.getObjects().c, "circle is removed after local arc erase");
  assert(Object.values(tool.getObjects()).some((object) => object.type === "arc"), "remaining circle portion becomes an arc");
}

function assertPreviewEraseArc(): void {
  const o = point("o", "O", 0, 0);
  const a = point("a", "A", 2, 0);
  const b = point("b", "B", -2, 0);
  const upper = arc("arc", "o", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, arc: upper, b, o });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 0, y: 2 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 0, y: 2 }), tool.context);

  assert(!tool.getObjects().arc, "arc candidate deletes highlighted arc");
}

function assertPreviewErasePolygonEdgeSafely(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 2, 0);
  const c = point("c", "C", 2, 2);
  const d = point("d", "D", 0, 2);
  const poly = polygon("poly", ["a", "b", "c", "d"]);
  const trim = new TrimTool();
  const tool = context({ a, b, c, d, poly });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 1, y: 0 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);

  assert(!tool.getObjects().poly, "polygon edge erase removes original polygon");
  assert(
    Object.values(tool.getObjects()).filter((object) => object.type === "segment").length >= 2,
    "polygon edge erase preserves remaining edges as segments",
  );
}

function assertPreviewDeleteRegion(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 2, 0);
  const c = point("c", "C", 0, 2);
  const fill = region("fill", ["a", "b", "c"]);
  const trim = new TrimTool();
  const tool = context({ a, b, c, fill });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 0.25, y: 0.25 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 0.25, y: 0.25 }), tool.context);

  assert(!tool.getObjects().fill, "region candidate deletes whole region");
}

function assertLockedObjectIsNotErasable(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const ab = {
    ...segment("ab", "a", "b"),
    locked: true,
  };
  const candidates = getEraseCandidates({ x: 2, y: 0 }, { a, ab, b }, 0.2);

  assert(!candidates.some((candidate) => candidate.sourceObjectId === "ab"), "locked object is not an erase candidate");
}

function assertCandidateCyclingCommitsSelectedCandidate(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const first = segment("first", "a", "b");
  const second = segment("second", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, b, first, second });

  trim.activate(tool.context);
  trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
  trim.keyDown({
    key: "Tab",
    preventDefault: () => {},
    shiftKey: false,
  } as KeyboardEvent, tool.context);
  trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);

  assert(tool.getObjects().first, "candidate cycling preserves unselected overlapping candidate");
  assert(!tool.getObjects().second, "candidate cycling commits selected overlapping candidate");
}

function assertTrimmedObjectsExportToTikz(): void {
  const a = point("a", "A", 0, 0);
  const b = point("b", "B", 4, 0);
  const ab = segment("ab", "a", "b");
  const trim = new TrimTool();
  const tool = context({ a, ab, b });

  trim.activate(tool.context);
  trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);
  trim.pointerDown(pointerEvent({ x: 3, y: 0 }), tool.context);

  const output = generateTikz(tool.getObjects(), "academic");

  assert(output.code.includes("\\draw"), "TikZ export still includes trimmed geometry");
}

function assertUndoRestoresPreviousObjects(): void {
  historyManager.clear();

  const a = point("a", "A", 0, 0);
  const trim = new TrimTool();
  const tool = context({ a });

  trim.activate(tool.context);
  trim.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);
  tool.undo();

  assert(tool.getObjects().a, "undo restores object deleted by trim tool");
}
