"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTextCreationTests = runTextCreationTests;
const geometry_1 = require("../../core/geometry");
const viewport_1 = require("../../core/geometry/viewport");
const export_1 = require("../../core/export");
const HitTest_1 = require("../../core/selection/HitTest");
const TextCreationSession_1 = require("../../core/tools/TextCreationSession");
const TextTool_1 = require("../../core/tools/TextTool");
const project_1 = require("../../core/project");
const ProjectSerializer_1 = require("../../core/project/ProjectSerializer");
const TextRenderer_1 = require("../../core/renderer/TextRenderer");
const tikz_1 = require("../../core/tikz");
const assert_1 = require("../assert");
function runTextCreationTests() {
    assertTextToolStartsCreationSession();
    assertTextToolEscapeCancelsCreationSession();
    const text = (0, TextTool_1.createTextObject)({
        content: "Let $A$ be a point",
        mode: "plain",
        objects: {},
        point: { x: 1.5, y: -2 },
    });
    (0, assert_1.assertEqual)(text.type, "text", "text tool factory creates a text object");
    (0, assert_1.assertEqual)(text.x, 1.5, "created text stores x position");
    (0, assert_1.assertEqual)(text.y, -2, "created text stores y position");
    (0, assert_1.assertEqual)(text.content, "Let $A$ be a point", "created text stores content");
    (0, assert_1.assertEqual)((0, TextTool_1.normalizeTextContent)("   "), "Text", "empty text content becomes a sensible default");
    assertTextRenderingData(text);
    assertTextSelection(text);
    assertTextSerialization(text);
    assertTextTikzExport(text);
    assertAttachedTextOnPoint();
    assertAttachedTextAtSegmentMidpointFollowsParents();
    assertAttachedTextSerialization();
    assertAttachedTextTikzExport();
    assertInspectorStyleAttachmentUpdate();
}
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
function fakeContext(objects = {}) {
    let selectedObjectIds = [];
    let hoveredObjectId = null;
    const viewport = {
        height: 200,
        offsetX: 0,
        offsetY: 0,
        scale: 10,
        width: 200,
    };
    return {
        activeTool: "text",
        addObject: () => true,
        beginHistoryTransaction: () => { },
        cancelHistoryTransaction: () => { },
        clearSelection: () => {
            selectedObjectIds = [];
        },
        commitHistoryTransaction: () => { },
        deleteObject: () => { },
        gridSize: 1,
        get hoveredObjectId() {
            return hoveredObjectId;
        },
        objects,
        pointerWorld: { x: 0, y: 0 },
        selectObject: (objectId) => {
            selectedObjectIds = [objectId];
        },
        get selectedObjectIds() {
            return selectedObjectIds;
        },
        setActiveTool: () => { },
        setHoveredObject: (objectId) => {
            hoveredObjectId = objectId;
        },
        setObjects: () => true,
        setSelectedObjects: (objectIds) => {
            selectedObjectIds = objectIds;
        },
        snapEnabled: false,
        snapPoint: (point) => point,
        updateObject: () => true,
        viewport,
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
        screenPoint: (0, viewport_1.worldToScreen)(worldPoint, fakeContext().viewport),
        shiftKey: false,
        snappedWorldPoint: worldPoint,
        worldPoint,
    };
}
function assertTextToolStartsCreationSession() {
    TextCreationSession_1.textCreationSession.cancel();
    TextTool_1.textTool.pointerDown(pointerEvent({ x: 2, y: 3 }), fakeContext());
    const pending = TextCreationSession_1.textCreationSession.getSnapshot();
    (0, assert_1.assert)(pending !== null, "text tool starts a text creation session");
    (0, assert_1.assertEqual)(pending?.point.x, 2, "text session stores clicked x coordinate");
    (0, assert_1.assertEqual)(pending?.point.y, 3, "text session stores clicked y coordinate");
    TextCreationSession_1.textCreationSession.cancel();
}
function assertAttachedTextOnPoint() {
    const target = point("a", "A", 2, 3);
    const objects = { a: target };
    TextCreationSession_1.textCreationSession.cancel();
    TextTool_1.textTool.pointerDown(pointerEvent(target), fakeContext(objects));
    const pending = TextCreationSession_1.textCreationSession.getSnapshot();
    (0, assert_1.assertEqual)(pending?.targetObjectId, "a", "text tool detects point target for annotation");
    (0, assert_1.assertEqual)(pending?.placement, "above", "point annotation starts with above placement");
    TextCreationSession_1.textCreationSession.cancel();
    const text = (0, TextTool_1.createTextObject)({
        content: "Point A",
        mode: "plain",
        objects,
        placement: "above-right",
        point: target,
        targetObjectId: "a",
    });
    const position = (0, geometry_1.getTextPosition)(text, { ...objects, [text.id]: text });
    (0, assert_1.assertEqual)(text.dependencies[0], "a", "attached text stores target dependency");
    (0, assert_1.assertEqual)((0, geometry_1.getTextAttachment)(text)?.targetObjectId, "a", "attached text stores target metadata");
    (0, assert_1.assert)(position.x > target.x, "above-right point annotation moves right of target");
    (0, assert_1.assert)(position.y > target.y, "above-right point annotation moves above target");
}
function assertTextToolEscapeCancelsCreationSession() {
    TextCreationSession_1.textCreationSession.start({ point: { x: 1, y: 1 } });
    TextTool_1.textTool.keyDown({ key: "Escape" }, fakeContext());
    (0, assert_1.assertEqual)(TextCreationSession_1.textCreationSession.getSnapshot(), null, "Escape cancels pending text creation");
}
function assertAttachedTextAtSegmentMidpointFollowsParents() {
    const pointA = point("a", "A", 0, 0);
    const pointB = point("b", "B", 4, 0);
    const segmentAB = segment("ab", "a", "b");
    const text = (0, TextTool_1.createTextObject)({
        content: "mid",
        mode: "plain",
        objects: { a: pointA, ab: segmentAB, b: pointB },
        placement: "midpoint",
        point: { x: 0, y: 0 },
        targetObjectId: "ab",
    });
    const initial = (0, geometry_1.getTextPosition)(text, { a: pointA, ab: segmentAB, b: pointB, [text.id]: text });
    const moved = (0, geometry_1.getTextPosition)(text, {
        a: { ...pointA, x: 2 },
        ab: segmentAB,
        b: pointB,
        [text.id]: text,
    });
    (0, assert_1.assertEqual)(initial.x, 2, "segment midpoint annotation starts at midpoint x");
    (0, assert_1.assertEqual)(initial.y, 0, "segment midpoint annotation starts at midpoint y");
    (0, assert_1.assertEqual)(moved.x, 3, "segment midpoint annotation follows moved parent point");
}
function hasPropValue(node, propName, expected) {
    if (Array.isArray(node)) {
        return node.some((child) => hasPropValue(child, propName, expected));
    }
    if (typeof node !== "object" || node === null) {
        return false;
    }
    const props = node.props;
    return props?.[propName] === expected ||
        hasPropValue(props?.children, propName, expected);
}
function assertTextRenderingData(text) {
    const rendered = TextRenderer_1.TextRenderer.render(text, {
        hoveredObjectId: null,
        objects: { [text.id]: text },
        selectedObjectIds: [text.id],
        viewport: viewport_1.DEFAULT_VIEWPORT,
    });
    (0, assert_1.assert)(hasPropValue(rendered, "data-object-type", "text"), "text renderer emits text object metadata");
    (0, assert_1.assert)(hasPropValue(rendered, "fontSize", 14), "text renderer uses text font size metadata");
}
function assertTextSelection(text) {
    const viewport = {
        height: 200,
        offsetX: 0,
        offsetY: 0,
        scale: 10,
        width: 200,
    };
    const screen = (0, viewport_1.worldToScreen)(text, viewport);
    const hit = (0, HitTest_1.hitTest)({ x: screen.x + 4, y: screen.y - 4 }, text, { [text.id]: text }, viewport);
    (0, assert_1.assertEqual)(hit?.objectId, text.id, "text objects are selectable by hit test");
}
function assertTextSerialization(text) {
    const document = (0, ProjectSerializer_1.createProjectDocument)((0, project_1.createProjectMetadata)("Text"), {
        objects: { [text.id]: text },
        selectedObjectIds: [text.id],
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
    (0, assert_1.assertEqual)(imported.valid, true, "text project imports successfully");
    if (imported.valid) {
        (0, assert_1.assertEqual)(imported.objects[text.id]?.type, "text", "text object survives project import");
        (0, assert_1.assertEqual)(imported.objects[text.id]?.content, text.content, "text content survives project import");
    }
}
function assertAttachedTextSerialization() {
    const target = point("a", "A", 1, 1);
    const text = (0, TextTool_1.createTextObject)({
        content: "attached",
        mode: "latex",
        objects: { a: target },
        offset: { x: 0.1, y: 0.2 },
        placement: "below-left",
        point: target,
        targetObjectId: "a",
    });
    const document = (0, ProjectSerializer_1.createProjectDocument)((0, project_1.createProjectMetadata)("Attached Text"), {
        objects: { a: target, [text.id]: text },
        selectedObjectIds: [text.id],
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
    (0, assert_1.assertEqual)(imported.valid, true, "attached text project imports successfully");
    if (imported.valid) {
        const importedText = imported.objects[text.id];
        (0, assert_1.assertEqual)(importedText?.dependencies[0], "a", "attached text dependency survives project import");
        (0, assert_1.assertEqual)((0, geometry_1.getTextAttachment)(importedText)?.placement, "below-left", "attached text placement survives project import");
    }
}
function assertTextTikzExport(text) {
    const code = (0, tikz_1.generateTikz)({ [text.id]: text }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\node", "text TikZ export emits a node");
    (0, assert_1.assertIncludes)(code, "Let \\$A\\$ be a point", "plain text TikZ export escapes special characters");
}
function assertAttachedTextTikzExport() {
    const target = point("a", "A", 0, 0);
    const text = (0, TextTool_1.createTextObject)({
        content: "\\alpha",
        mode: "latex",
        objects: { a: target },
        placement: "above",
        point: target,
        targetObjectId: "a",
    });
    const code = (0, tikz_1.generateTikz)({ a: target, [text.id]: text }, "academic").code;
    (0, assert_1.assertIncludes)(code, "\\node", "attached text TikZ export emits a node");
    (0, assert_1.assertIncludes)(code, "anchor=south", "attached text TikZ export uses placement-aware anchor");
    (0, assert_1.assertIncludes)(code, "{\\alpha};", "attached LaTeX text is preserved");
}
function assertInspectorStyleAttachmentUpdate() {
    const target = point("a", "A", 0, 0);
    const text = (0, TextTool_1.createTextObject)({
        content: "edit",
        mode: "plain",
        objects: { a: target },
        placement: "above",
        point: target,
        targetObjectId: "a",
    });
    const updated = {
        ...text,
        metadata: {
            ...text.metadata,
            offset: { x: 0.4, y: -0.2 },
            placement: "below",
            targetObjectId: "a",
        },
        updatedAt: Date.now(),
    };
    (0, assert_1.assertEqual)((0, geometry_1.getTextAttachment)(updated)?.placement, "below", "inspector-style update changes placement metadata");
    (0, assert_1.assertEqual)((0, geometry_1.getTextAttachment)(updated)?.offset?.x, 0.4, "inspector-style update changes offset metadata");
}
