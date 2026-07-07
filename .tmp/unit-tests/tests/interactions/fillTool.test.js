"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runFillToolTests = runFillToolTests;
const geometry_1 = require("../../core/geometry");
const viewport_1 = require("../../core/geometry/viewport");
const export_1 = require("../../core/export");
const project_1 = require("../../core/project");
const ProjectSerializer_1 = require("../../core/project/ProjectSerializer");
const RegionRenderer_1 = require("../../core/renderer/RegionRenderer");
const tikz_1 = require("../../core/tikz");
const FillTool_1 = require("../../core/tools/FillTool");
const assert_1 = require("../assert");
function point(id, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        name: id.toUpperCase(),
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function polygon(id, pointIds) {
    return {
        closed: true,
        createdAt: 2,
        dependencies: pointIds,
        dependents: [],
        id,
        locked: false,
        name: "Triangle",
        pointIds,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "polygon",
        updatedAt: 2,
        visible: true,
    };
}
function segment(id, startPointId, endPointId) {
    return {
        createdAt: 2,
        dependencies: [startPointId, endPointId],
        dependents: [],
        endPointId,
        id,
        locked: false,
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 2,
        visible: true,
    };
}
function circle(id, centerPointId, radius) {
    return {
        centerPointId,
        circleKind: "center-radius",
        createdAt: 2,
        dependencies: [centerPointId],
        dependents: [],
        id,
        locked: false,
        radius,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 2,
        visible: true,
    };
}
function arc(id, centerPointId, startPointId, endPointId) {
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
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 3,
        visible: true,
    };
}
function line(id, pointAId, pointBId) {
    return {
        createdAt: 3,
        dependencies: [pointAId, pointBId],
        dependents: [],
        id,
        locked: false,
        pointAId,
        pointBId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "line",
        updatedAt: 3,
        visible: true,
    };
}
function fixtureObjects() {
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
function pointerAt(x, y) {
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
function createTestContext(objects) {
    const added = [];
    let currentObjects = { ...objects };
    let committed = false;
    let selected = [];
    return {
        activeTool: "fill",
        addObject: (object) => {
            added.push(object);
            currentObjects = { ...currentObjects, [object.id]: object };
            return true;
        },
        added,
        beginHistoryTransaction: () => { },
        cancelHistoryTransaction: () => { },
        clearSelection: () => {
            selected = [];
        },
        commitHistoryTransaction: () => {
            committed = true;
        },
        committed: () => committed,
        deleteObject: () => { },
        gridSize: 1,
        hoveredObjectId: null,
        objects: currentObjects,
        pointerWorld: { x: 0, y: 0 },
        selected: () => selected,
        selectedObjectIds: [],
        selectObject: (objectId) => {
            selected = [objectId];
        },
        setActiveTool: () => { },
        setHoveredObject: () => { },
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
function runFillToolTests() {
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
function assertPolygonFillStillWorks() {
    const objects = fixtureObjects();
    const triangle = objects.triangle;
    if (!triangle || triangle.type !== "polygon") {
        throw new Error("fill tool test fixture requires a polygon");
    }
    const selectedPolygon = (0, FillTool_1.findFillablePolygon)({ x: 0.5, y: 0.5 }, objects);
    const outsidePolygon = (0, FillTool_1.findFillablePolygon)({ x: 5, y: 5 }, objects);
    const region = (0, FillTool_1.createRegionFromPolygon)(triangle);
    const objectsWithRegion = { ...objects, [region.id]: region };
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    (0, assert_1.assertEqual)(selectedPolygon?.id, "triangle", "fill tool finds a polygon containing the click");
    (0, assert_1.assertEqual)(outsidePolygon, null, "fill tool ignores clicks outside closed polygons");
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(region, objectsWithRegion).valid, "fill tool creates valid region geometry");
    (0, assert_1.assertEqual)(region.boundaryPointIds.length, 3, "region stores polygon boundary point dependencies");
    (0, assert_1.assertEqual)(region.style.fill, "#7ddcff", "region receives default fill color");
    (0, assert_1.assertEqual)(region.style.strokeOpacity, 0, "region does not duplicate polygon outline by default");
    (0, assert_1.assertEqual)((0, FillTool_1.findExistingRegionForPolygon)(triangle, objectsWithRegion)?.id, region.id, "fill tool can find an existing region for the same polygon");
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0.5), context);
    tool.pointerDown(pointerAt(0.5, 0.5), context);
    (0, assert_1.assertEqual)(context.added.length, 1, "fill tool pointer interaction adds one region");
    (0, assert_1.assertEqual)(context.added[0]?.type, "region", "fill tool pointer interaction creates a region");
    (0, assert_1.assert)(context.committed(), "fill tool commits the creation transaction");
    (0, assert_1.assertEqual)(context.selected()[0], context.added[0]?.id, "fill tool selects the new region");
}
function addedRegionAfterFill(objects, click) {
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(click.x, click.y), context);
    tool.pointerDown(pointerAt(click.x, click.y), context);
    const region = context.added[0];
    if (region?.type !== "region") {
        throw new Error("fill tool did not create a region");
    }
    (0, assert_1.assert)(context.committed(), "fill tool commits boundary region creation");
    return region;
}
function assertFullCircleFill() {
    const objects = {
        c: point("c", 0, 0),
        circle: circle("circle", "c", 2),
    };
    const region = addedRegionAfterFill(objects, { x: 0.25, y: 0.25 });
    (0, assert_1.assertEqual)(region.regionKind, "boundary", "full circle fill creates a boundary region");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges[0]?.edgeKind, "circle", "full circle region stores a circle edge");
    (0, assert_1.assert)((0, geometry_1.validateGeometryObject)(region, { ...objects, [region.id]: region }).valid, "full circle region validates");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "circle");
    assertRegionV2Serialization(region, objects);
}
function circleWithDiameterObjects() {
    return {
        a: point("a", 2, 0),
        b: point("b", -2, 0),
        c: point("c", 0, 0),
        circle: circle("circle", "c", 2),
        diameter: segment("diameter", "a", "b"),
    };
}
function assertCircleWithDiameterFillsClickedSemicircle() {
    const objects = circleWithDiameterObjects();
    const candidate = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 1 }, objects).candidates[0];
    const region = addedRegionAfterFill(objects, { x: 0, y: 1 });
    (0, assert_1.assert)(candidate?.id !== "full-circle-fallback", "diameter click chooses a traced face before full circle");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges.length, 2, "diameter fill stores arc plus diameter segment");
    (0, assert_1.assert)(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "arc"), "diameter fill boundary includes an arc edge");
    (0, assert_1.assert)(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "segment"), "diameter fill boundary includes a diameter segment");
    (0, assert_1.assert)(region.metadata?.boundaryType !== "full-circle-fallback", "diameter fill does not use full circle fallback");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertCircleWithChordFillsClickedCircularSegment() {
    const rootThree = Math.sqrt(3);
    const objects = {
        a: point("a", -rootThree, 1),
        b: point("b", rootThree, 1),
        c: point("c", 0, 0),
        chord: segment("chord", "a", "b"),
        circle: circle("circle", "c", 2),
    };
    const candidate = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 1.35 }, objects).candidates[0];
    const region = addedRegionAfterFill(objects, { x: 0, y: 1.35 });
    (0, assert_1.assert)(candidate?.id !== "full-circle-fallback", "circle with chord fills the clicked circular segment");
    (0, assert_1.assert)(region.metadata?.boundaryType !== "full-circle-fallback", "chord fill is not a full circle");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertOppositeChordSideFillsOppositeRegion() {
    const objects = circleWithDiameterObjects();
    const candidate = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: -1 }, objects).candidates[0];
    const region = addedRegionAfterFill(objects, { x: 0, y: -1 });
    (0, assert_1.assert)(candidate?.id !== "full-circle-fallback", "clicking opposite side of chord selects opposite circular region");
    (0, assert_1.assert)(region.metadata?.boundaryType !== "full-circle-fallback", "opposite chord side stores distinct boundary type");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertFullCircleFallbackOnlyWithoutSmallerLoop() {
    const fullCircleObjects = {
        c: point("c", 0, 0),
        circle: circle("circle", "c", 2),
    };
    const splitCircleObjects = circleWithDiameterObjects();
    (0, assert_1.assertEqual)((0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 0.5 }, fullCircleObjects).candidates.length, 1, "a standalone circle exposes one selectable region");
    (0, assert_1.assert)((0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 0.5 }, splitCircleObjects).candidates.every((face) => face.edgeCount > 1), "split circle exposes traced faces instead of a whole-circle guess");
}
function assertSemicircleFill() {
    const objects = {
        a: point("a", 1, 0),
        b: point("b", -1, 0),
        chord: segment("chord", "a", "b"),
        o: point("o", 0, 0),
        upperArc: arc("upperArc", "o", "a", "b"),
    };
    const candidate = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 0.4 }, objects).candidates[0];
    const region = addedRegionAfterFill(objects, { x: 0, y: 0.4 });
    (0, assert_1.assert)(candidate?.id !== "full-circle-fallback", "fill detection finds a semicircle-like arc and chord loop");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges.length, 2, "semicircle region stores arc and chord edges");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertSectorFill() {
    const objects = {
        a: point("a", 1, 0),
        arcQuarter: arc("arcQuarter", "o", "a", "b"),
        b: point("b", 0, 1),
        o: point("o", 0, 0),
        radiusA: segment("radiusA", "o", "a"),
        radiusB: segment("radiusB", "o", "b"),
    };
    const candidate = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0.2, y: 0.2 }, objects).candidates[0];
    const region = addedRegionAfterFill(objects, { x: 0.2, y: 0.2 });
    (0, assert_1.assert)(candidate?.id !== "full-circle-fallback", "fill detection finds a sector loop");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges.length, 3, "sector region stores two radius edges and an arc");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertTwoCirclesLensFill() {
    const objects = {
        c1: point("c1", 0, 0),
        c2: point("c2", 1.5, 0),
        left: circle("left", "c1", 1),
        right: circle("right", "c2", 1),
    };
    const result = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0.75, y: 0 }, objects);
    const region = addedRegionAfterFill(objects, { x: 0.75, y: 0 });
    (0, assert_1.assert)(result.candidates.length > 0, "two intersecting circles produce a selectable lens face");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges.length, 2, "lens region is bounded by two circle arcs");
    (0, assert_1.assert)(region.loops?.[0]?.edges.every((edge) => edge.edgeKind === "arc"), "lens edges are circle arc pieces");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertLineCircleFill() {
    const objects = {
        a: point("a", -2, 0),
        b: point("b", 2, 0),
        c: point("c", 0, 0),
        circle: circle("circle", "c", 1),
        divider: line("divider", "a", "b"),
    };
    const result = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 0.4 }, objects);
    const region = addedRegionAfterFill(objects, { x: 0, y: 0.4 });
    (0, assert_1.assert)(result.candidates.length > 0, "line and circle intersections produce bounded faces");
    (0, assert_1.assertEqual)(region.loops?.[0]?.edges.length, 2, "line-circle fill is bounded by a line piece and circle arc");
    (0, assert_1.assert)(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "line"), "line-circle region keeps the line piece");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertPolygonEdgesPlusArcFill() {
    const objects = {
        a: point("a", 1, 0),
        arcQuarter: arc("arcQuarter", "o", "a", "b"),
        b: point("b", 0, 1),
        o: point("o", 0, 0),
        triangle: polygon("triangle", ["o", "a", "b"]),
    };
    const result = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0.6, y: 0.6 }, objects);
    const region = addedRegionAfterFill(objects, { x: 0.6, y: 0.6 });
    (0, assert_1.assert)(result.candidates.length > 0, "polygon edges plus an arc form a traced closed face");
    (0, assert_1.assert)(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "polygon-edge"), "polygon-edge pieces are retained");
    (0, assert_1.assert)(region.loops?.[0]?.edges.some((edge) => edge.edgeKind === "arc"), "arc piece is retained");
    assertSvgPathAndTikz(region, { ...objects, [region.id]: region }, "arc");
}
function assertNoClosedFaceReturnsDiagnostic() {
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 2, 0),
        segment: segment("segment", "a", "b"),
    };
    const result = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0.5, y: 0.25 }, objects);
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0.25), context);
    tool.pointerDown(pointerAt(0.5, 0.25), context);
    (0, assert_1.assertEqual)(result.candidates.length, 0, "open geometry reports no selectable closed face");
    (0, assert_1.assertEqual)(result.diagnostics[0]?.code, "NO_CLOSED_FACE", "no-face result provides a diagnostic");
    (0, assert_1.assertEqual)(context.added.length, 0, "fill tool does not create an incorrect region for open geometry");
    (0, assert_1.assert)(tool.renderPreview(context) !== null, "no closed face renders a diagnostic preview");
}
function nestedCircleObjects() {
    return {
        outerCenter: point("outerCenter", 0, 0),
        innerCenter: point("innerCenter", 0, 0),
        outerCircle: circle("outerCircle", "outerCenter", 3),
        innerCircle: circle("innerCircle", "innerCenter", 1),
    };
}
function assertMultipleFacesReturnCandidatesAndSmallestDefault() {
    const objects = nestedCircleObjects();
    const faces = (0, geometry_1.getFaces)(objects);
    const result = (0, geometry_1.getSelectableBoundaryFaces)({ x: 0.5, y: 0 }, objects);
    (0, assert_1.assert)(faces.faces.length >= 2, "face engine enumerates multiple closed faces before selection");
    (0, assert_1.assert)(result.candidates.length >= 2, "nested circles return multiple containing candidate regions");
    (0, assert_1.assert)(result.diagnostics.some((diagnostic) => diagnostic.code === "MULTIPLE_REGIONS"), "multiple candidates include cycle diagnostic");
    (0, assert_1.assert)(result.candidates[0] && result.candidates[1] && result.candidates[0].area < result.candidates[1].area, "candidate list defaults to the smallest containing face");
    (0, assert_1.assert)(result.candidates[0]?.centroid, "candidate includes centroid metadata");
}
function assertTabCyclesCandidates() {
    const objects = nestedCircleObjects();
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0), context);
    tool.keyDown({ key: "Tab", preventDefault: () => { } }, context);
    tool.pointerDown(pointerAt(0.5, 0), context);
    const region = context.added[0];
    if (region?.type !== "region") {
        throw new Error("Tab cycle did not commit a region");
    }
    (0, assert_1.assert)(Number(region.metadata?.boundaryArea ?? 0) > 20, "Tab cycles from inner circle to larger surrounding region");
}
function assertClickCommitsSelectedCandidate() {
    const objects = nestedCircleObjects();
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0), context);
    (0, assert_1.assert)(tool.renderPreview(context) !== null, "fill preview renders before click commit");
    tool.pointerDown(pointerAt(0.5, 0), context);
    (0, assert_1.assertEqual)(context.added.length, 1, "click commits the currently highlighted candidate");
    (0, assert_1.assert)(Number(context.added[0]?.metadata?.boundaryArea ?? 0) < 4, "default click commits smallest candidate");
}
function assertEnterCommitsSelectedCandidate() {
    const objects = nestedCircleObjects();
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0), context);
    tool.keyDown({ key: "Enter", preventDefault: () => { } }, context);
    (0, assert_1.assertEqual)(context.added.length, 1, "Enter commits the highlighted fill preview");
}
function assertEscapeCancelsFillPreview() {
    const objects = nestedCircleObjects();
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    tool.activate(context);
    tool.pointerMove(pointerAt(0.5, 0), context);
    (0, assert_1.assert)(tool.renderPreview(context) !== null, "preview exists before Escape");
    tool.keyDown({ key: "Escape", preventDefault: () => { } }, context);
    (0, assert_1.assertEqual)(context.added.length, 0, "Escape does not commit a region");
    (0, assert_1.assertEqual)(tool.renderPreview(context), null, "Escape clears the fill preview");
}
function manySegmentObjects(count) {
    const objects = {};
    for (let index = 0; index < count; index += 1) {
        const aId = `a${index}`;
        const bId = `b${index}`;
        objects[aId] = point(aId, index, 0);
        objects[bId] = point(bId, index, 1);
        objects[`s${index}`] = segment(`s${index}`, aId, bId);
    }
    return objects;
}
function manyLineObjects(count) {
    const objects = {};
    for (let index = 0; index < count; index += 1) {
        const aId = `la${index}`;
        const bId = `lb${index}`;
        objects[aId] = point(aId, -10, index - count / 2);
        objects[bId] = point(bId, 10, count / 2 - index);
        objects[`l${index}`] = line(`l${index}`, aId, bId);
    }
    return objects;
}
function assertBoundaryFillCacheReusesSceneFaces() {
    const objects = circleWithDiameterObjects();
    (0, geometry_1.clearBoundaryFillCache)();
    (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: 1 }, objects);
    (0, geometry_1.getSelectableBoundaryFaces)({ x: 0, y: -1 }, objects);
    const stats = (0, geometry_1.getBoundaryFillCacheStats)();
    (0, assert_1.assertEqual)(stats.misses, 1, "first face enumeration builds the cache");
    (0, assert_1.assertEqual)(stats.hits, 1, "second pointer query reuses cached faces");
}
function assertTooManyObjectsAbortSafely() {
    const result = (0, geometry_1.getFaces)(manySegmentObjects(12), {
        limits: {
            maxPrimitives: 5,
        },
        useCache: false,
    });
    (0, assert_1.assertEqual)(result.faces.length, 0, "too many primitives do not produce faces");
    (0, assert_1.assertEqual)(result.diagnostics[0]?.code, "REGION_TOO_COMPLEX", "too many primitives report complexity diagnostic");
}
function assertDenseIntersectionsAbortSafely() {
    const result = (0, geometry_1.getFaces)(manyLineObjects(8), {
        limits: {
            maxIntersections: 6,
        },
        useCache: false,
    });
    (0, assert_1.assertEqual)(result.faces.length, 0, "dense intersections abort without hanging");
    (0, assert_1.assertEqual)(result.diagnostics[0]?.code, "TOO_MANY_INTERSECTIONS", "dense intersections report intersection diagnostic");
}
function assertDegenerateOverlappingEdgesDoNotLoop() {
    const objects = {
        a: point("a", 0, 0),
        b: point("b", 1, 0),
        c: point("c", 0, 0),
        d: point("d", 1, 0),
        s1: segment("s1", "a", "b"),
        s2: segment("s2", "c", "d"),
    };
    const result = (0, geometry_1.getFaces)(objects, {
        limits: {
            timeoutMs: 8,
        },
        useCache: false,
    });
    (0, assert_1.assertEqual)(result.faces.length, 0, "overlapping degenerate edges do not create unstable faces");
    (0, assert_1.assert)(result.diagnostics.length > 0, "overlapping degenerate edges return diagnostics");
}
function assertPointerMoveDoesNotRecomputeArrangementRepeatedly() {
    const objects = circleWithDiameterObjects();
    const context = createTestContext(objects);
    const tool = new FillTool_1.FillTool();
    (0, geometry_1.clearBoundaryFillCache)();
    tool.activate(context);
    tool.pointerMove(pointerAt(0, 1), context);
    tool.pointerMove(pointerAt(0.01, 1), context);
    tool.pointerMove(pointerAt(0.02, 1), context);
    const stats = (0, geometry_1.getBoundaryFillCacheStats)();
    (0, assert_1.assertEqual)(stats.misses, 1, "Fill Tool activation builds arrangement once");
    (0, assert_1.assertEqual)(stats.hits, 1, "first hover reuses the warmed arrangement cache");
}
function hasPathWithArc(node) {
    if (Array.isArray(node)) {
        return node.some(hasPathWithArc);
    }
    if (typeof node !== "object" || node === null) {
        return false;
    }
    const props = node.props;
    return typeof props?.d === "string" && props.d.includes("A ") ||
        hasPathWithArc(props?.children);
}
function assertSvgPathAndTikz(region, objects, expectedTikz) {
    const rendered = RegionRenderer_1.RegionRenderer.render(region, {
        hoveredObjectId: null,
        objects,
        selectedObjectIds: [region.id],
        viewport: viewport_1.DEFAULT_VIEWPORT,
    });
    const code = (0, tikz_1.generateTikz)(objects, "academic").code;
    (0, assert_1.assert)(hasPathWithArc(rendered), "RegionRenderer emits curved SVG path data for boundary regions");
    (0, assert_1.assertIncludes)(code, "\\fill", "TikZ exports boundary region as a fill command");
    (0, assert_1.assertIncludes)(code, expectedTikz, "TikZ exports boundary region with expected curved command");
}
function assertRegionV2Serialization(region, sourceObjects) {
    const document = (0, ProjectSerializer_1.createProjectDocument)((0, project_1.createProjectMetadata)("Region v2"), {
        objects: { ...sourceObjects, [region.id]: region },
        selectedObjectIds: [region.id],
        settings: {
            gridSize: 1,
            showAxes: true,
            showGrid: true,
            snapEnabled: true,
        },
        theme: "dark-arctic",
        tikzOptions: (0, tikz_1.getTikzOptions)("academic"),
        viewport: viewport_1.DEFAULT_VIEWPORT,
    });
    const imported = (0, export_1.importProjectJson)((0, ProjectSerializer_1.serializeProjectDocument)(document));
    (0, assert_1.assertEqual)(imported.valid, true, "Region v2 project imports successfully");
    if (imported.valid) {
        (0, assert_1.assertEqual)(imported.objects[region.id]?.type, "region", "Region v2 survives project import");
        (0, assert_1.assertEqual)(imported.objects[region.id]?.regionKind, "boundary", "Region v2 kind survives project import");
    }
}
