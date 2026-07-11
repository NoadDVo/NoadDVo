import {
  DEFAULT_GEOMETRY_STYLE,
  clearBoundaryFillCache,
  getBoundaryFillCacheStats,
  getFaces,
  getSelectableBoundaryFaces,
  validateGeometryObject,
  type ArcObject,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type LineObject,
  type PointObject,
  type PolygonObject,
  type RegionObject,
} from "../../core/geometry";
import { DEFAULT_VIEWPORT } from "../../core/geometry/viewport";
import { importProjectJson } from "../../core/export";
import { createProjectMetadata } from "../../core/project";
import {
  createProjectDocument,
  serializeProjectDocument,
} from "../../core/project/ProjectSerializer";
import { RegionRenderer } from "../../core/renderer/RegionRenderer";
import { generateTikz, getTikzOptions } from "../../core/tikz";
import {
  createRegionFromPolygon,
  FillTool,
  findExistingRegionForPolygon,
  findFillablePolygon,
} from "../../core/tools/FillTool";
import type { ToolContext, ToolPointerEvent } from "../../core/tools/ToolContext";
import { assert, assertEqual, assertIncludes } from "../assert";

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

function polygon(id: string, pointIds: readonly string[]): PolygonObject {
  return {
    closed: true,
    createdAt: 2,
    dependencies: pointIds,
    dependents: [],
    id,
    locked: false,
    name: "Triangle",
    pointIds,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "polygon",
    updatedAt: 2,
    visible: true,
  };
}

function segment(id: string, startPointId: string, endPointId: string): GeometryObject {
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
    centerPointId,
    circleKind: "center-radius",
    createdAt: 2,
    dependencies: [centerPointId],
    dependents: [],
    id,
    locked: false,
    radius,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "circle",
    updatedAt: 2,
    visible: true,
  };
}

function arc(
  id: string,
  centerPointId: string,
  startPointId: string,
  endPointId: string,
): ArcObject {
  return {
    centerPointId,
    createdAt: 3,
    dependencies: [centerPointId, startPointId, endPointId],
    dependents: [],
    direction: "counterclockwise",
    endPointId,
    id,
    locked: false,
    startPointId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "arc",
    updatedAt: 3,
    visible: true,
  };
}

function line(id: string, pointAId: string, pointBId: string): LineObject {
  return {
    createdAt: 3,
    dependencies: [pointAId, pointBId],
    dependents: [],
    id,
    locked: false,
    pointAId,
    pointBId,
    style: DEFAULT_GEOMETRY_STYLE,
    type: "line",
    updatedAt: 3,
    visible: true,
  };
}

function fixtureObjects(): GeometryObjectRecord {
  const a = point("a", 0, 0);
  const b = point("b", 4, 0);
  const c = point("c", 0, 3);
  const triangle = polygon("triangle", ["a", "b", "c"]);

  return {
    a,
    b,
    c,
    triangle,
  };
}

function pointerAt(x: number, y: number): ToolPointerEvent {
  return {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    screenPoint: { x, y },
    shiftKey: false,
    snappedWorldPoint: { x, y },
    worldPoint: { x, y },
  };
}

function createTestContext(objects: GeometryObjectRecord): ToolContext & {
  readonly added: GeometryObject[];
  readonly committed: () => boolean;
  readonly selected: () => readonly string[];
} {
  const added: GeometryObject[] = [];
  let currentObjects = { ...objects };
  let committed = false;
  let selected: readonly string[] = [];

  return {
    activeTool: "fill",
    addObject: (object) => {
      added.push(object);
      currentObjects = { ...currentObjects, [object.id]: object };
      return true;
    },
    added,
    beginHistoryTransaction: () => {},
    cancelHistoryTransaction: () => {},
    clearSelection: () => {
      selected = [];
    },
    commitHistoryTransaction: () => {
      committed = true;
    },
    committed: () => committed,
    deleteObject: () => {},
    gridSize: 1,
    hoveredObjectId: null,
    objects: currentObjects,
    pointerWorld: { x: 0, y: 0 },
    selected: () => selected,
    selectedObjectIds: [],
    selectObject: (objectId) => {
      selected = [objectId];
    },
    setActiveTool: () => {},
    setHoveredObject: () => {},
    setObjects: () => true,
    setSelectedObjects: (objectIds) => {
      selected = objectIds;
    },
    snapEnabled: false,
    snapPoint: (pointValue) => pointValue,
    updateObject: () => true,
    viewport: {
      height: 100,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      width: 100,
    },
  };
}

export function runFillToolTests(): void {
  assertPolygonFillStillWorks();
  assertFullCircleFill();
  assertCircleWithDiameterFillsClickedSemicircle();
  assertCircleWithChordFillsClickedCircularSegment();
  assertOppositeChordSideFillsOppositeRegion();
  assertFullCircleFallbackOnlyWithoutSmallerLoop();
  assertSemicircleFill();
  assertSectorFill();
  assertTwoCirclesLensFill();
  assertLineCircleFill();
  assertPolygonEdgesPlusArcFill();
  assertNoClosedFaceReturnsDiagnostic();
  assertMultipleFacesReturnCandidatesAndSmallestDefault();
  assertTabCyclesCandidates();
  assertClickCommitsSelectedCandidate();
  assertEnterCommitsSelectedCandidate();
  assertEscapeCancelsFillPreview();
  assertBoundaryFillCacheReusesSceneFaces();
  assertTooManyObjectsAbortSafely();
  assertDenseIntersectionsAbortSafely();
  assertDegenerateOverlappingEdgesDoNotLoop();
  assertPointerMoveDoesNotRecomputeArrangementRepeatedly();
}

function assertPolygonFillStillWorks(): void {
  const objects = fixtureObjects();
  const triangle = objects.triangle;

  if (!triangle || triangle.type !== "polygon") {
    throw new Error("fill tool test fixture requires a polygon");
  }

  const selectedPolygon = findFillablePolygon({ x: 0.5, y: 0.5 }, objects);
  const outsidePolygon = findFillablePolygon({ x: 5, y: 5 }, objects);
  const region = createRegionFromPolygon(triangle);
  const objectsWithRegion = { ...objects, [region.id]: region };
  const context = createTestContext(objects);
  const tool = new FillTool();

  assertEqual(selectedPolygon?.id, "triangle", "fill tool finds a polygon containing the click");
  assertEqual(outsidePolygon, null, "fill tool ignores clicks outside closed polygons");
  assert(validateGeometryObject(region, objectsWithRegion).valid, "fill tool creates valid region geometry");
  assertEqual(region.boundaryPointIds.length, 3, "region stores polygon boundary point dependencies");
  assertEqual(region.style.fill, "#7ddcff", "region receives default fill color");
  assertEqual(region.style.strokeOpacity, 0, "region does not duplicate polygon outline by default");
  assertEqual(
    findExistingRegionForPolygon(triangle, objectsWithRegion)?.id,
    region.id,
    "fill tool can find an existing region for the same polygon",
  );

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0.5), context);
  tool.pointerDown(pointerAt(0.5, 0.5), context);

  assertEqual(context.added.length, 1, "fill tool pointer interaction adds one region");
  assertEqual(context.added[0]?.type, "region", "fill tool pointer interaction creates a region");
  assert(context.committed(), "fill tool commits the creation transaction");
  assertEqual(context.selected()[0], context.added[0]?.id, "fill tool selects the new region");
}

function addedRegionAfterFill(objects: GeometryObjectRecord, click: { readonly x: number; readonly y: number }): RegionObject {
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(click.x, click.y), context);
  tool.pointerDown(pointerAt(click.x, click.y), context);

  const region = context.added[0];

  if (region?.type !== "region") {
    throw new Error("fill tool did not create a region");
  }

  assert(context.committed(), "fill tool commits boundary region creation");
  return region;
}

function assertFullCircleFill(): void {
  const objects = {
    c: point("c", 0, 0),
    circle: circle("circle", "c", 2),
  };
  const region = addedRegionAfterFill(objects, { x: 0.25, y: 0.25 });

  assertEqual(region.regionKind, "boundary", "full circle fill creates a boundary region");
  assertEqual(region.loops?.[0]?.edges[0]?.edgeKind, "circle", "full circle region stores a circle edge");
  assert(validateGeometryObject(region, { ...objects, [region.id]: region }).valid, "full circle region validates");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "circle");
  assertRegionV2Serialization(region, objects);
}

function circleWithDiameterObjects(): GeometryObjectRecord {
  return {
    a: point("a", 2, 0),
    b: point("b", -2, 0),
    c: point("c", 0, 0),
    circle: circle("circle", "c", 2),
    diameter: segment("diameter", "a", "b"),
  };
}

function assertCircleWithDiameterFillsClickedSemicircle(): void {
  const objects = circleWithDiameterObjects();
  const candidate = getSelectableBoundaryFaces({ x: 0, y: 1 }, objects).candidates[0];
  const region = addedRegionAfterFill(objects, { x: 0, y: 1 });

  assert(candidate?.id !== "full-circle-fallback", "diameter click chooses a traced face before full circle");
  assertEqual(region.loops?.[0]?.edges.length, 2, "diameter fill stores arc plus diameter segment");
  assert(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "arc"), "diameter fill boundary includes an arc edge");
  assert(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "segment"), "diameter fill boundary includes a diameter segment");
  assert(region.metadata?.boundaryType !== "full-circle-fallback", "diameter fill does not use full circle fallback");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertCircleWithChordFillsClickedCircularSegment(): void {
  const rootThree = Math.sqrt(3);
  const objects = {
    a: point("a", -rootThree, 1),
    b: point("b", rootThree, 1),
    c: point("c", 0, 0),
    chord: segment("chord", "a", "b"),
    circle: circle("circle", "c", 2),
  };
  const candidate = getSelectableBoundaryFaces({ x: 0, y: 1.35 }, objects).candidates[0];
  const region = addedRegionAfterFill(objects, { x: 0, y: 1.35 });

  assert(candidate?.id !== "full-circle-fallback", "circle with chord fills the clicked circular segment");
  assert(region.metadata?.boundaryType !== "full-circle-fallback", "chord fill is not a full circle");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertOppositeChordSideFillsOppositeRegion(): void {
  const objects = circleWithDiameterObjects();
  const candidate = getSelectableBoundaryFaces({ x: 0, y: -1 }, objects).candidates[0];
  const region = addedRegionAfterFill(objects, { x: 0, y: -1 });

  assert(candidate?.id !== "full-circle-fallback", "clicking opposite side of chord selects opposite circular region");
  assert(region.metadata?.boundaryType !== "full-circle-fallback", "opposite chord side stores distinct boundary type");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertFullCircleFallbackOnlyWithoutSmallerLoop(): void {
  const fullCircleObjects = {
    c: point("c", 0, 0),
    circle: circle("circle", "c", 2),
  };
  const splitCircleObjects = circleWithDiameterObjects();

  assertEqual(
    getSelectableBoundaryFaces({ x: 0, y: 0.5 }, fullCircleObjects).candidates.length,
    1,
    "a standalone circle exposes one selectable region",
  );
  assert(
    getSelectableBoundaryFaces({ x: 0, y: 0.5 }, splitCircleObjects).candidates.every((face) => face.edgeCount > 1),
    "split circle exposes traced faces instead of a whole-circle guess",
  );
}

function assertSemicircleFill(): void {
  const objects = {
    a: point("a", 1, 0),
    b: point("b", -1, 0),
    chord: segment("chord", "a", "b"),
    o: point("o", 0, 0),
    upperArc: arc("upperArc", "o", "a", "b"),
  };
  const candidate = getSelectableBoundaryFaces({ x: 0, y: 0.4 }, objects).candidates[0];
  const region = addedRegionAfterFill(objects, { x: 0, y: 0.4 });

  assert(candidate?.id !== "full-circle-fallback", "fill detection finds a semicircle-like arc and chord loop");
  assertEqual(region.loops?.[0]?.edges.length, 2, "semicircle region stores arc and chord edges");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertSectorFill(): void {
  const objects = {
    a: point("a", 1, 0),
    arcQuarter: arc("arcQuarter", "o", "a", "b"),
    b: point("b", 0, 1),
    o: point("o", 0, 0),
    radiusA: segment("radiusA", "o", "a"),
    radiusB: segment("radiusB", "o", "b"),
  };
  const candidate = getSelectableBoundaryFaces({ x: 0.2, y: 0.2 }, objects).candidates[0];
  const region = addedRegionAfterFill(objects, { x: 0.2, y: 0.2 });

  assert(candidate?.id !== "full-circle-fallback", "fill detection finds a sector loop");
  assertEqual(region.loops?.[0]?.edges.length, 3, "sector region stores two radius edges and an arc");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertTwoCirclesLensFill(): void {
  const objects = {
    c1: point("c1", 0, 0),
    c2: point("c2", 1.5, 0),
    left: circle("left", "c1", 1),
    right: circle("right", "c2", 1),
  };
  const result = getSelectableBoundaryFaces({ x: 0.75, y: 0 }, objects);
  const region = addedRegionAfterFill(objects, { x: 0.75, y: 0 });

  assert(result.candidates.length > 0, "two intersecting circles produce a selectable lens face");
  assertEqual(region.loops?.[0]?.edges.length, 2, "lens region is bounded by two circle arcs");
  assert(region.loops?.[0]?.edges.every((edge) => edge.edgeKind === "arc"), "lens edges are circle arc pieces");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertLineCircleFill(): void {
  const objects = {
    a: point("a", -2, 0),
    b: point("b", 2, 0),
    c: point("c", 0, 0),
    circle: circle("circle", "c", 1),
    divider: line("divider", "a", "b"),
  };
  const result = getSelectableBoundaryFaces({ x: 0, y: 0.4 }, objects);
  const region = addedRegionAfterFill(objects, { x: 0, y: 0.4 });

  assert(result.candidates.length > 0, "line and circle intersections produce bounded faces");
  assertEqual(region.loops?.[0]?.edges.length, 2, "line-circle fill is bounded by a line piece and circle arc");
  assert(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "line"), "line-circle region keeps the line piece");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertPolygonEdgesPlusArcFill(): void {
  const objects = {
    a: point("a", 1, 0),
    arcQuarter: arc("arcQuarter", "o", "a", "b"),
    b: point("b", 0, 1),
    o: point("o", 0, 0),
    triangle: polygon("triangle", ["o", "a", "b"]),
  };
  const result = getSelectableBoundaryFaces({ x: 0.6, y: 0.6 }, objects);
  const region = addedRegionAfterFill(objects, { x: 0.6, y: 0.6 });

  assert(result.candidates.length > 0, "polygon edges plus an arc form a traced closed face");
  assert(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "polygon-edge"), "polygon-edge pieces are retained");
  assert(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "arc"), "arc piece is retained");
  assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}

function assertNoClosedFaceReturnsDiagnostic(): void {
  const objects = {
    a: point("a", 0, 0),
    b: point("b", 2, 0),
    segment: segment("segment", "a", "b"),
  };
  const result = getSelectableBoundaryFaces({ x: 0.5, y: 0.25 }, objects);
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0.25), context);
  tool.pointerDown(pointerAt(0.5, 0.25), context);

  assertEqual(result.candidates.length, 0, "open geometry reports no selectable closed face");
  assertEqual(result.diagnostics[0]?.code, "NO_CLOSED_FACE", "no-face result provides a diagnostic");
  assertEqual(context.added.length, 0, "fill tool does not create an incorrect region for open geometry");
  assert(tool.renderPreview(context) !== null, "no closed face renders a diagnostic preview");
}

function nestedCircleObjects(): GeometryObjectRecord {
  return {
    outerCenter: point("outerCenter", 0, 0),
    innerCenter: point("innerCenter", 0, 0),
    outerCircle: circle("outerCircle", "outerCenter", 3),
    innerCircle: circle("innerCircle", "innerCenter", 1),
  };
}

function assertMultipleFacesReturnCandidatesAndSmallestDefault(): void {
  const objects = nestedCircleObjects();
  const faces = getFaces(objects);
  const result = getSelectableBoundaryFaces({ x: 0.5, y: 0 }, objects);

  assert(faces.faces.length >= 2, "face engine enumerates multiple closed faces before selection");
  assert(result.candidates.length >= 2, "nested circles return multiple containing candidate regions");
  assert(
    result.diagnostics.some((diagnostic) => diagnostic.code === "MULTIPLE_REGIONS"),
    "multiple candidates include cycle diagnostic",
  );
  assert(
    result.candidates[0] && result.candidates[1] && result.candidates[0].area < result.candidates[1].area,
    "candidate list defaults to the smallest containing face",
  );
  assert(result.candidates[0]?.centroid, "candidate includes centroid metadata");
}

function assertTabCyclesCandidates(): void {
  const objects = nestedCircleObjects();
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0), context);
  tool.keyDown({ key: "Tab", preventDefault: () => {} } as KeyboardEvent, context);
  tool.pointerDown(pointerAt(0.5, 0), context);

  const region = context.added[0];

  if (region?.type !== "region") {
    throw new Error("Tab cycle did not commit a region");
  }

  assert(Number(region.metadata?.boundaryArea ?? 0) > 20, "Tab cycles from inner circle to larger surrounding region");
}

function assertClickCommitsSelectedCandidate(): void {
  const objects = nestedCircleObjects();
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0), context);
  assert(tool.renderPreview(context) !== null, "fill preview renders before click commit");
  tool.pointerDown(pointerAt(0.5, 0), context);

  assertEqual(context.added.length, 1, "click commits the currently highlighted candidate");
  assert(Number(context.added[0]?.metadata?.boundaryArea ?? 0) < 4, "default click commits smallest candidate");
}

function assertEnterCommitsSelectedCandidate(): void {
  const objects = nestedCircleObjects();
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0), context);
  tool.keyDown({ key: "Enter", preventDefault: () => {} } as KeyboardEvent, context);

  assertEqual(context.added.length, 1, "Enter commits the highlighted fill preview");
}

function assertEscapeCancelsFillPreview(): void {
  const objects = nestedCircleObjects();
  const context = createTestContext(objects);
  const tool = new FillTool();

  tool.activate(context);
  tool.pointerMove(pointerAt(0.5, 0), context);
  assert(tool.renderPreview(context) !== null, "preview exists before Escape");
  tool.keyDown({ key: "Escape", preventDefault: () => {} } as KeyboardEvent, context);

  assertEqual(context.added.length, 0, "Escape does not commit a region");
  assertEqual(tool.renderPreview(context), null, "Escape clears the fill preview");
}

function manySegmentObjects(count: number): GeometryObjectRecord {
  const objects: Record<string, GeometryObject> = {};

  for (let index = 0; index < count; index += 1) {
    const aId = `a${index}`;
    const bId = `b${index}`;

    objects[aId] = point(aId, index, 0);
    objects[bId] = point(bId, index, 1);
    objects[`s${index}`] = segment(`s${index}`, aId, bId);
  }

  return objects;
}

function manyLineObjects(count: number): GeometryObjectRecord {
  const objects: Record<string, GeometryObject> = {};

  for (let index = 0; index < count; index += 1) {
    const aId = `la${index}`;
    const bId = `lb${index}`;

    objects[aId] = point(aId, -10, index - count / 2);
    objects[bId] = point(bId, 10, count / 2 - index);
    objects[`l${index}`] = line(`l${index}`, aId, bId);
  }

  return objects;
}

function assertBoundaryFillCacheReusesSceneFaces(): void {
  const objects = circleWithDiameterObjects();

  clearBoundaryFillCache();
  getSelectableBoundaryFaces({ x: 0, y: 1 }, objects);
  getSelectableBoundaryFaces({ x: 0, y: -1 }, objects);

  const stats = getBoundaryFillCacheStats();

  assertEqual(stats.misses, 1, "first face enumeration builds the cache");
  assertEqual(stats.hits, 1, "second pointer query reuses cached faces");
}

function assertTooManyObjectsAbortSafely(): void {
  const result = getFaces(manySegmentObjects(12), {
    limits: {
      maxPrimitives: 5,
    },
    useCache: false,
  });

  assertEqual(result.faces.length, 0, "too many primitives do not produce faces");
  assertEqual(result.diagnostics[0]?.code, "REGION_TOO_COMPLEX", "too many primitives report complexity diagnostic");
}

function assertDenseIntersectionsAbortSafely(): void {
  const result = getFaces(manyLineObjects(8), {
    limits: {
      maxIntersections: 6,
    },
    useCache: false,
  });

  assertEqual(result.faces.length, 0, "dense intersections abort without hanging");
  assertEqual(result.diagnostics[0]?.code, "TOO_MANY_INTERSECTIONS", "dense intersections report intersection diagnostic");
}

function assertDegenerateOverlappingEdgesDoNotLoop(): void {
  const objects = {
    a: point("a", 0, 0),
    b: point("b", 1, 0),
    c: point("c", 0, 0),
    d: point("d", 1, 0),
    s1: segment("s1", "a", "b"),
    s2: segment("s2", "c", "d"),
  };
  const result = getFaces(objects, {
    limits: {
      timeoutMs: 8,
    },
    useCache: false,
  });

  assertEqual(result.faces.length, 0, "overlapping degenerate edges do not create unstable faces");
  assert(result.diagnostics.length > 0, "overlapping degenerate edges return diagnostics");
}

function assertPointerMoveDoesNotRecomputeArrangementRepeatedly(): void {
  const objects = circleWithDiameterObjects();
  const context = createTestContext(objects);
  const tool = new FillTool();

  clearBoundaryFillCache();
  tool.activate(context);
  tool.pointerMove(pointerAt(0, 1), context);
  tool.pointerMove(pointerAt(0.01, 1), context);
  tool.pointerMove(pointerAt(0.02, 1), context);

  const stats = getBoundaryFillCacheStats();

  assertEqual(stats.misses, 1, "Fill Tool activation builds arrangement once");
  assertEqual(stats.hits, 1, "first hover reuses the warmed arrangement cache");
}

function hasPathWithArc(node: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some(hasPathWithArc);
  }

  if (typeof node !== "object" || node === null) {
    return false;
  }

  const props = (node as { readonly props?: Record<string, unknown> }).props;

  return typeof props?.d === "string" && props.d.includes("A ") ||
    hasPathWithArc(props?.children);
}

function assertSvgPathAndTikz(region: RegionObject, objects: GeometryObjectRecord, expectedTikz: string): void {
  const rendered = RegionRenderer.render(region, {
    hoveredObjectId: null,
    objects,
    selectedObjectIds: [region.id],
    viewport: DEFAULT_VIEWPORT,
    appTheme: "theme1",
  });
  const code = generateTikz(objects, "academic").code;

  assert(hasPathWithArc(rendered), "RegionRenderer emits curved SVG path data for boundary regions");
  assertIncludes(code, "\\fill", "TikZ exports boundary region as a fill command");
  assertIncludes(code, expectedTikz, "TikZ exports boundary region with expected curved command");
}

function assertRegionV2Serialization(region: RegionObject, sourceObjects: GeometryObjectRecord): void {
  const document = createProjectDocument(createProjectMetadata("Region v2"), {
    objects: { ...sourceObjects, [region.id]: region },
    selectedObjectIds: [region.id],
    settings: {
      gridSize: 1,
      showAxes: true,
      showGrid: true,
      snapEnabled: true,
    },
    theme: "dark-arctic",
    tikzOptions: getTikzOptions("academic"),
    viewport: DEFAULT_VIEWPORT,
  });
  const imported = importProjectJson(serializeProjectDocument(document));

  assertEqual(imported.valid, true, "Region v2 project imports successfully");
  if (imported.valid) {
    assertEqual(imported.objects[region.id]?.type, "region", "Region v2 survives project import");
    assertEqual(
      (imported.objects[region.id] as RegionObject | undefined)?.regionKind,
      "boundary",
      "Region v2 kind survives project import",
    );
  }
}
