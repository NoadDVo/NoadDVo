import {
  DEFAULT_GEOMETRY_STYLE,
  normalizeTextMode,
  type GeometryObjectRecord,
  type Point2D,
  type TextMode,
  type TextObject,
} from "../geometry";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let textIdCounter = 0;

function createTextId(): string {
  textIdCounter += 1;

  return `text-${Date.now().toString(36)}-${textIdCounter}`;
}

function getNextTextName(objects: GeometryObjectRecord): string {
  const count = Object.values(objects).filter((object) => object.type === "text").length;

  return `Text ${count + 1}`;
}

function inferTextMode(content: string): TextMode {
  const trimmed = content.trim();

  if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
    return "math";
  }

  if (trimmed.includes("\\") || trimmed.includes("{") || trimmed.includes("}")) {
    return "latex";
  }

  return "plain";
}

export function createTextObject({
  content,
  mode,
  objects,
  point,
}: {
  readonly content: string;
  readonly mode: TextMode;
  readonly objects: GeometryObjectRecord;
  readonly point: Point2D;
}): TextObject {
  const now = Date.now();

  return {
    content,
    createdAt: now,
    dependencies: [],
    dependents: [],
    id: createTextId(),
    locked: false,
    metadata: {
      alignment: "left",
      fontSize: 14,
      opacity: 1,
      rotation: 0,
    },
    name: getNextTextName(objects),
    style: {
      ...DEFAULT_GEOMETRY_STYLE,
      labelSize: 14,
      stroke: "#0b0f14",
      strokeOpacity: 1,
    },
    textMode: mode,
    type: "text",
    updatedAt: now,
    visible: true,
    x: point.x,
    y: point.y,
  };
}

function requestTextContent(): { readonly content: string; readonly mode: TextMode } | null {
  const content = window.prompt("Text content", "");

  if (content === null || content.trim().length === 0) {
    return null;
  }

  const modeInput = window.prompt(
    "Text mode: plain, math, latex, coordinate-label, object-label, measurement-label",
    inferTextMode(content),
  );

  return {
    content,
    mode: normalizeTextMode(modeInput),
  };
}

export class TextTool extends BaseTool {
  constructor() {
    super({
      cursor: "text",
      id: "text",
      name: "Text",
      shortcut: "T",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const requested = requestTextContent();

    if (!requested) {
      this.transitionState("cancelled", "cancel");

      return;
    }

    const text = createTextObject({
      content: requested.content,
      mode: requested.mode,
      objects: context.objects,
      point: event.snappedWorldPoint,
    });

    if (context.addObject(text)) {
      context.selectObject(text.id);
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
    }
  }
}

export const textTool = new TextTool();
