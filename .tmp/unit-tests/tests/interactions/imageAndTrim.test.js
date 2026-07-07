"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runImageAndTrimTests = runImageAndTrimTests;
const geometry_1 = require("../../core/geometry");
const tikz_1 = require("../../core/tikz");
const viewport_1 = require("../../core/geometry/viewport");
const HitTest_1 = require("../../core/selection/HitTest");
const MoveTool_1 = require("../../core/tools/MoveTool");
const TrimTool_1 = require("../../core/tools/TrimTool");
const export_1 = require("../../core/export");
const ProjectSerializer_1 = require("../../core/project/ProjectSerializer");
const history_1 = require("../../core/history");
const assert_1 = require("../assert");
const viewport = {
    height: 400,
    offsetX: 0,
    offsetY: 0,
    scale: 50,
    width: 500,
};
function point(id, name, x, y) {
    return {
        createdAt: 1,
        dependencies: [],
        dependents: [],
        id,
        locked: false,
        name,
        pointKind: "free",
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "point",
        updatedAt: 1,
        visible: true,
        x,
        y,
    };
}
function segment(id, startPointId, endPointId) {
    return {
        createdAt: 1,
        dependencies: [startPointId, endPointId],
        dependents: [],
        endPointId,
        id,
        locked: false,
        name: "AB",
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "segment",
        updatedAt: 1,
        visible: true,
    };
}
function circle(id, centerPointId, radius) {
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
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "circle",
        updatedAt: 1,
        visible: true,
    };
}
function vector(id, startPointId, endPointId) {
    return {
        createdAt: 1,
        dependencies: [startPointId, endPointId],
        dependents: [],
        endPointId,
        id,
        locked: false,
        name: "Vector",
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "vector",
        updatedAt: 1,
        visible: true,
    };
}
function line(id, pointAId, pointBId) {
    return {
        createdAt: 1,
        dependencies: [pointAId, pointBId],
        dependents: [],
        id,
        locked: false,
        name: "Line",
        pointAId,
        pointBId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "line",
        updatedAt: 1,
        visible: true,
    };
}
function ray(id, startPointId, throughPointId) {
    return {
        createdAt: 1,
        dependencies: [startPointId, throughPointId],
        dependents: [],
        id,
        locked: false,
        name: "Ray",
        startPointId,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        throughPointId,
        type: "ray",
        updatedAt: 1,
        visible: true,
    };
}
function arc(id, centerPointId, startPointId, endPointId) {
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
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "arc",
        updatedAt: 1,
        visible: true,
    };
}
function polygon(id, pointIds) {
    return {
        closed: true,
        createdAt: 1,
        dependencies: [...pointIds],
        dependents: [],
        id,
        locked: false,
        name: "Polygon",
        pointIds,
        style: geometry_1.DEFAULT_GEOMETRY_STYLE,
        type: "polygon",
        updatedAt: 1,
        visible: true,
    };
}
function region(id, boundaryPointIds) {
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
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#7ddcff",
            fillOpacity: 0.2,
        },
        type: "region",
        updatedAt: 1,
        visible: true,
    };
}
function pointerEvent(worldPoint) {
    return {
        altKey: false,
        button: 0,
        buttons: 1,
        ctrlKey: false,
        metaKey: false,
        pointerId: 1,
        screenPoint: (0, viewport_1.worldToScreen)(worldPoint, viewport),
        shiftKey: false,
        snappedWorldPoint: worldPoint,
        worldPoint,
    };
}
function context(initialObjects) {
    let objects = initialObjects;
    let selectedObjectIds = [];
    let beforeObjects = null;
    const toolContext = {
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
        setActiveTool: () => { },
        setHoveredObject: () => { },
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
function runImageAndTrimTests() {
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
function assertReferenceImageMoveOpacityAndDelete() {
    const image = (0, geometry_1.createReferenceImageObject)({
        height: 2,
        mimeType: "image/png",
        position: { x: 0, y: 0 },
        src: "data:image/png;base64,abc",
        width: 3,
    });
    const move = new MoveTool_1.MoveTool();
    const tool = context({ [image.id]: image });
    move.activate(tool.context);
    move.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);
    move.pointerMove(pointerEvent({ x: 1, y: 1 }), tool.context);
    move.pointerUp(pointerEvent({ x: 1, y: 1 }), tool.context);
    const movedImage = tool.getObjects()[image.id];
    (0, assert_1.assertEqual)(movedImage?.type, "image", "moved reference image remains an image");
    (0, assert_1.assertEqual)(movedImage?.type === "image" ? movedImage.x : null, 1, "reference image moves on x");
    (0, assert_1.assertEqual)(movedImage?.type === "image" ? movedImage.y : null, 1, "reference image moves on y");
    tool.context.updateObject(image.id, (current) => current.type === "image"
        ? {
            ...current,
            opacity: 0.2,
            updatedAt: 2,
            width: 4,
        }
        : current);
    const updatedImage = tool.getObjects()[image.id];
    (0, assert_1.assertEqual)(updatedImage?.type === "image" ? updatedImage.opacity : null, 0.2, "reference image opacity updates");
    (0, assert_1.assertEqual)(updatedImage?.type === "image" ? updatedImage.width : null, 4, "reference image scale updates through dimensions");
    tool.context.deleteObject(image.id);
    (0, assert_1.assert)(!tool.getObjects()[image.id], "reference image deletes through geometry store actions");
}
function assertReferenceImageObjectCreation() {
    const image = (0, geometry_1.createReferenceImageObject)({
        mimeType: "image/png",
        position: { x: 2, y: 3 },
        src: "data:image/png;base64,abc",
    });
    (0, assert_1.assertEqual)(image.type, "image", "reference image is a geometry object");
    (0, assert_1.assertEqual)(image.opacity, 0.45, "reference image uses tracing opacity");
    (0, assert_1.assertEqual)(image.x, 2, "reference image stores x position");
    (0, assert_1.assertEqual)(image.y, 3, "reference image stores y position");
}
function assertReferenceImageHitTestAndSerialization() {
    const image = (0, geometry_1.createReferenceImageObject)({
        height: 2,
        mimeType: "image/svg+xml",
        position: { x: 0, y: 0 },
        src: "data:image/svg+xml;base64,PHN2Zy8+",
        width: 3,
    });
    const objects = { [image.id]: image };
    const hit = (0, HitTest_1.hitTest)((0, viewport_1.worldToScreen)({ x: 0.2, y: 0.2 }, viewport), { x: 0.2, y: 0.2 }, objects, viewport);
    (0, assert_1.assertEqual)(hit?.objectId, image.id, "reference image is selectable by hit testing");
    const document = (0, ProjectSerializer_1.createProjectDocument)({
        author: "NoadDVo",
        createdAt: "2026-01-01T00:00:00.000Z",
        description: "",
        id: "project-image-test",
        name: "Image Test",
        updatedAt: "2026-01-01T00:00:00.000Z",
    }, {
        objects,
        selectedObjectIds: [image.id],
        settings: {
            gridSize: 1,
            showAxes: true,
            showGrid: true,
            snapEnabled: true,
        },
        theme: "dark-arctic",
        tikzOptions: (0, tikz_1.getTikzOptions)("academic"),
        viewport,
    });
    const imported = (0, export_1.importProjectJson)((0, ProjectSerializer_1.serializeProjectDocument)(document));
    (0, assert_1.assert)(imported.valid, "project with embedded reference image imports");
    (0, assert_1.assertEqual)(imported.valid ? imported.objects[image.id]?.type : null, "image", "image object survives project import");
}
function assertTrimSegmentCreatesShorterSegment() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const ab = segment("ab", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, ab, b });
    trim.activate(tool.context);
    trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 3, y: 0 }), tool.context);
    const objects = Object.values(tool.getObjects());
    const trimmedSegment = objects.find((object) => object.type === "segment" && object.id !== "ab");
    (0, assert_1.assert)(!tool.getObjects().ab, "source segment is removed after trim");
    (0, assert_1.assert)(trimmedSegment, "trim creates a replacement segment");
}
function assertTrimCircleCreatesArc() {
    const o = point("o", "O", 0, 0);
    const c = circle("c", "o", 2);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ c, o });
    trim.activate(tool.context);
    trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);
    trim.pointerDown(pointerEvent({ x: -2, y: 0 }), tool.context);
    const objects = Object.values(tool.getObjects());
    const arc = objects.find((object) => object.type === "arc");
    (0, assert_1.assert)(!tool.getObjects().c, "source circle is removed after trim");
    (0, assert_1.assert)(arc, "trim creates an arc from a circle");
}
function assertTrimDeleteObject() {
    const a = point("a", "A", 0, 0);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a });
    trim.activate(tool.context);
    trim.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().a, "trim tool can delete a whole object");
}
function assertPreviewEraseWholeSegment() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const ab = segment("ab", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, ab, b });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
    (0, assert_1.assert)(trim.renderPreview(tool.context) !== null, "erase preview renders for segment");
    trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().ab, "preview click erases highlighted segment");
}
function assertPreviewEraseWholeVector() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const v = vector("v", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, b, v });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().v, "preview click erases highlighted vector");
}
function assertPreviewEraseLineAndRaySafely() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const l = line("l", "a", "b");
    const r = ray("r", "a", "b");
    const trimLine = new TrimTool_1.TrimTool();
    const lineTool = context({ a, b, l });
    trimLine.activate(lineTool.context);
    trimLine.pointerMove(pointerEvent({ x: 2, y: 0 }), lineTool.context);
    trimLine.pointerDown(pointerEvent({ x: 2, y: 0 }), lineTool.context);
    (0, assert_1.assert)(!lineTool.getObjects().l, "line erase removes infinite geometry safely");
    const trimRay = new TrimTool_1.TrimTool();
    const rayTool = context({ a, b, r });
    trimRay.activate(rayTool.context);
    trimRay.pointerMove(pointerEvent({ x: 2, y: 0 }), rayTool.context);
    trimRay.pointerDown(pointerEvent({ x: 2, y: 0 }), rayTool.context);
    (0, assert_1.assert)(!rayTool.getObjects().r, "ray erase removes infinite geometry safely");
}
function assertCircleArcCandidateSelection() {
    const o = point("o", "O", 0, 0);
    const p = point("p", "P", 2, 0);
    const q = point("q", "Q", -2, 0);
    const c = circle("c", "o", 2);
    const candidates = (0, TrimTool_1.getEraseCandidates)({ x: 0, y: 2 }, { c, o, p, q }, 0.2);
    const arcCandidate = candidates.find((candidate) => candidate.sourceObjectId === "c");
    (0, assert_1.assertEqual)(arcCandidate?.candidateType, "trim-piece", "circle with cut points offers local arc erase candidate");
}
function assertPreviewTrimCircleArc() {
    const o = point("o", "O", 0, 0);
    const p = point("p", "P", 2, 0);
    const q = point("q", "Q", -2, 0);
    const c = circle("c", "o", 2);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ c, o, p, q });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 0, y: 2 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 0, y: 2 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().c, "circle is removed after local arc erase");
    (0, assert_1.assert)(Object.values(tool.getObjects()).some((object) => object.type === "arc"), "remaining circle portion becomes an arc");
}
function assertPreviewEraseArc() {
    const o = point("o", "O", 0, 0);
    const a = point("a", "A", 2, 0);
    const b = point("b", "B", -2, 0);
    const upper = arc("arc", "o", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, arc: upper, b, o });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 0, y: 2 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 0, y: 2 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().arc, "arc candidate deletes highlighted arc");
}
function assertPreviewErasePolygonEdgeSafely() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 2, 0);
    const c = point("c", "C", 2, 2);
    const d = point("d", "D", 0, 2);
    const poly = polygon("poly", ["a", "b", "c", "d"]);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, b, c, d, poly });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 1, y: 0 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().poly, "polygon edge erase removes original polygon");
    (0, assert_1.assert)(Object.values(tool.getObjects()).filter((object) => object.type === "segment").length >= 2, "polygon edge erase preserves remaining edges as segments");
}
function assertPreviewDeleteRegion() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 2, 0);
    const c = point("c", "C", 0, 2);
    const fill = region("fill", ["a", "b", "c"]);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, b, c, fill });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 0.25, y: 0.25 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 0.25, y: 0.25 }), tool.context);
    (0, assert_1.assert)(!tool.getObjects().fill, "region candidate deletes whole region");
}
function assertLockedObjectIsNotErasable() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const ab = {
        ...segment("ab", "a", "b"),
        locked: true,
    };
    const candidates = (0, TrimTool_1.getEraseCandidates)({ x: 2, y: 0 }, { a, ab, b }, 0.2);
    (0, assert_1.assert)(!candidates.some((candidate) => candidate.sourceObjectId === "ab"), "locked object is not an erase candidate");
}
function assertCandidateCyclingCommitsSelectedCandidate() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const first = segment("first", "a", "b");
    const second = segment("second", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, b, first, second });
    trim.activate(tool.context);
    trim.pointerMove(pointerEvent({ x: 2, y: 0 }), tool.context);
    trim.keyDown({
        key: "Tab",
        preventDefault: () => { },
        shiftKey: false,
    }, tool.context);
    trim.pointerDown(pointerEvent({ x: 2, y: 0 }), tool.context);
    (0, assert_1.assert)(tool.getObjects().first, "candidate cycling preserves unselected overlapping candidate");
    (0, assert_1.assert)(!tool.getObjects().second, "candidate cycling commits selected overlapping candidate");
}
function assertTrimmedObjectsExportToTikz() {
    const a = point("a", "A", 0, 0);
    const b = point("b", "B", 4, 0);
    const ab = segment("ab", "a", "b");
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a, ab, b });
    trim.activate(tool.context);
    trim.pointerDown(pointerEvent({ x: 1, y: 0 }), tool.context);
    trim.pointerDown(pointerEvent({ x: 3, y: 0 }), tool.context);
    const output = (0, tikz_1.generateTikz)(tool.getObjects(), "academic");
    (0, assert_1.assert)(output.code.includes("\\draw"), "TikZ export still includes trimmed geometry");
}
function assertUndoRestoresPreviousObjects() {
    history_1.historyManager.clear();
    const a = point("a", "A", 0, 0);
    const trim = new TrimTool_1.TrimTool();
    const tool = context({ a });
    trim.activate(tool.context);
    trim.pointerDown(pointerEvent({ x: 0, y: 0 }), tool.context);
    tool.undo();
    (0, assert_1.assert)(tool.getObjects().a, "undo restores object deleted by trim tool");
}
