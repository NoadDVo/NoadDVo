import {
  DEFAULT_GEOMETRY_STYLE,
  getTextAttachment,
  getTextPosition,
  type GeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type SegmentObject,
  type TextObject,
} from "../../core/geometry";
import { DEFAULT_VIEWPORT, worldToScreen, type Viewport } from "../../core/geometry/viewport";
import { importProjectJson } from "../../core/export";
import { hitTest } from "../../core/selection/HitTest";
import { textCreationSession } from "../../core/tools/TextCreationSession";
import { createTextObject, normalizeTextContent, textTool } from "../../core/tools/TextTool";
import type { ToolContext, ToolPointerEvent } from "../../core/tools/ToolContext";
import { createProjectMetadata } from "../../core/project";
import {
  createProjectDocument,
  serializeProjectDocument,
} from "../../core/project/ProjectSerializer";
import { TextRenderer } from "../../core/renderer/TextRenderer";
import { generateTikz, getTikzOptions } from "../../core/tikz";
import { assert, assertEqual, assertIncludes } from "../assert";

export function runTextCreationTests(): void {
  assertTextToolStartsCreationSession();
  assertTextToolEscapeCancelsCreationSession();
  const text = createTextObject({
    content: "Let $A$ be a point",
    mode: "plain",
    objects: {},
    point: { x: 1.5, y: -2 },
  });

  assertEqual(text.type, "text", "text tool factory creates a text object");
  assertEqual(text.x, 1.5, "created text stores x position");
  assertEqual(text.y, -2, "created text stores y position");
  assertEqual(text.content, "Let $A$ be a point", "created text stores content");
  assertEqual(normalizeTextContent("   "), "Text", "empty text content becomes a sensible default");
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

function fakeContext(objects: GeometryObjectRecord = {}): ToolContext {
  let selectedObjectIds: readonly string[] = [];
  let hoveredObjectId: string | null = null;
  const viewport: Viewport = {
    height: 200,
    offsetX: 0,
    offsetY: 0,
    scale: 10,
    width: 200,
  };

  return {
    activeTool: "text",
    addObject: () => true,
    beginHistoryTransaction: () => {},
    cancelHistoryTransaction: () => {},
    clearSelection: () => {
      selectedObjectIds = [];
    },
    commitHistoryTransaction: () => {},
    deleteObject: () => {},
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
    setActiveTool: () => {},
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

function pointerEvent(worldPoint: { readonly x: number; readonly y: number }): ToolPointerEvent {
  return {
    altKey: false,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    metaKey: false,
    pointerId: 1,
    screenPoint: worldToScreen(worldPoint, fakeContext().viewport),
    shiftKey: false,
    snappedWorldPoint: worldPoint,
    worldPoint,
  };
}

function assertTextToolStartsCreationSession(): void {
  textCreationSession.cancel();
  textTool.pointerDown(pointerEvent({ x: 2, y: 3 }), fakeContext());

  const pending = textCreationSession.getSnapshot();

  assert(pending !== null, "text tool starts a text creation session");
  assertEqual(pending?.point.x, 2, "text session stores clicked x coordinate");
  assertEqual(pending?.point.y, 3, "text session stores clicked y coordinate");
  textCreationSession.cancel();
}

function assertAttachedTextOnPoint(): void {
  const target = point("a", "A", 2, 3);
  const objects = { a: target };

  textCreationSession.cancel();
  textTool.pointerDown(pointerEvent(target), fakeContext(objects));

  const pending = textCreationSession.getSnapshot();

  assertEqual(pending?.targetObjectId, "a", "text tool detects point target for annotation");
  assertEqual(pending?.placement, "above", "point annotation starts with above placement");
  textCreationSession.cancel();

  const text = createTextObject({
    content: "Point A",
    mode: "plain",
    objects,
    placement: "above-right",
    point: target,
    targetObjectId: "a",
  });
  const position = getTextPosition(text, { ...objects, [text.id]: text });

  assertEqual(text.dependencies[0], "a", "attached text stores target dependency");
  assertEqual(getTextAttachment(text)?.targetObjectId, "a", "attached text stores target metadata");
  assert(position.x > target.x, "above-right point annotation moves right of target");
  assert(position.y > target.y, "above-right point annotation moves above target");
}

function assertTextToolEscapeCancelsCreationSession(): void {
  textCreationSession.start({ point: { x: 1, y: 1 } });
  textTool.keyDown({ key: "Escape" } as KeyboardEvent, fakeContext());

  assertEqual(textCreationSession.getSnapshot(), null, "Escape cancels pending text creation");
}

function assertAttachedTextAtSegmentMidpointFollowsParents(): void {
  const pointA = point("a", "A", 0, 0);
  const pointB = point("b", "B", 4, 0);
  const segmentAB = segment("ab", "a", "b");
  const text = createTextObject({
    content: "mid",
    mode: "plain",
    objects: { a: pointA, ab: segmentAB, b: pointB },
    placement: "midpoint",
    point: { x: 0, y: 0 },
    targetObjectId: "ab",
  });
  const initial = getTextPosition(text, { a: pointA, ab: segmentAB, b: pointB, [text.id]: text });
  const moved = getTextPosition(text, {
    a: { ...pointA, x: 2 },
    ab: segmentAB,
    b: pointB,
    [text.id]: text,
  });

  assertEqual(initial.x, 2, "segment midpoint annotation starts at midpoint x");
  assertEqual(initial.y, 0, "segment midpoint annotation starts at midpoint y");
  assertEqual(moved.x, 3, "segment midpoint annotation follows moved parent point");
}

function hasPropValue(node: unknown, propName: string, expected: unknown): boolean {
  if (Array.isArray(node)) {
    return node.some((child) => hasPropValue(child, propName, expected));
  }

  if (typeof node !== "object" || node === null) {
    return false;
  }

  const props = (node as { readonly props?: Record<string, unknown> }).props;

  return props?.[propName] === expected ||
    hasPropValue(props?.children, propName, expected);
}

function assertTextRenderingData(text: TextObject): void {
  const rendered = TextRenderer.render(text, {
    hoveredObjectId: null,
    objects: { [text.id]: text },
    selectedObjectIds: [text.id],
    viewport: DEFAULT_VIEWPORT,
  });

  assert(hasPropValue(rendered, "data-object-type", "text"), "text renderer emits text object metadata");
  assert(hasPropValue(rendered, "fontSize", 14), "text renderer uses text font size metadata");
}

function assertTextSelection(text: TextObject): void {
  const viewport: Viewport = {
    height: 200,
    offsetX: 0,
    offsetY: 0,
    scale: 10,
    width: 200,
  };
  const screen = worldToScreen(text, viewport);
  const hit = hitTest(
    { x: screen.x + 4, y: screen.y - 4 },
    text,
    { [text.id]: text },
    viewport,
  );

  assertEqual(hit?.objectId, text.id, "text objects are selectable by hit test");
}

function assertTextSerialization(text: TextObject): void {
  const document = createProjectDocument(createProjectMetadata("Text"), {
    objects: { [text.id]: text },
    selectedObjectIds: [text.id],
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

  assertEqual(imported.valid, true, "text project imports successfully");
  if (imported.valid) {
    assertEqual(imported.objects[text.id]?.type, "text", "text object survives project import");
    assertEqual(
      (imported.objects[text.id] as Extract<GeometryObject, { readonly type: "text" }> | undefined)?.content,
      text.content,
      "text content survives project import",
    );
  }
}

function assertAttachedTextSerialization(): void {
  const target = point("a", "A", 1, 1);
  const text = createTextObject({
    content: "attached",
    mode: "latex",
    objects: { a: target },
    offset: { x: 0.1, y: 0.2 },
    placement: "below-left",
    point: target,
    targetObjectId: "a",
  });
  const document = createProjectDocument(createProjectMetadata("Attached Text"), {
    objects: { a: target, [text.id]: text },
    selectedObjectIds: [text.id],
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

  assertEqual(imported.valid, true, "attached text project imports successfully");
  if (imported.valid) {
    const importedText = imported.objects[text.id] as TextObject | undefined;

    assertEqual(importedText?.dependencies[0], "a", "attached text dependency survives project import");
    assertEqual(getTextAttachment(importedText as TextObject)?.placement, "below-left", "attached text placement survives project import");
  }
}

function assertTextTikzExport(text: TextObject): void {
  const code = generateTikz({ [text.id]: text }, "academic").code;

  assertIncludes(code, "\\node", "text TikZ export emits a node");
  assertIncludes(code, "Let \\$A\\$ be a point", "plain text TikZ export escapes special characters");
}

function assertAttachedTextTikzExport(): void {
  const target = point("a", "A", 0, 0);
  const text = createTextObject({
    content: "\\alpha",
    mode: "latex",
    objects: { a: target },
    placement: "above",
    point: target,
    targetObjectId: "a",
  });
  const code = generateTikz({ a: target, [text.id]: text }, "academic").code;

  assertIncludes(code, "\\node", "attached text TikZ export emits a node");
  assertIncludes(code, "anchor=south", "attached text TikZ export uses placement-aware anchor");
  assertIncludes(code, "{\\alpha};", "attached LaTeX text is preserved");
}

function assertInspectorStyleAttachmentUpdate(): void {
  const target = point("a", "A", 0, 0);
  const text = createTextObject({
    content: "edit",
    mode: "plain",
    objects: { a: target },
    placement: "above",
    point: target,
    targetObjectId: "a",
  });
  const updated: TextObject = {
    ...text,
    metadata: {
      ...text.metadata,
      offset: { x: 0.4, y: -0.2 },
      placement: "below",
      targetObjectId: "a",
    },
    updatedAt: Date.now(),
  };

  assertEqual(getTextAttachment(updated)?.placement, "below", "inspector-style update changes placement metadata");
  assertEqual(getTextAttachment(updated)?.offset?.x, 0.4, "inspector-style update changes offset metadata");
}
