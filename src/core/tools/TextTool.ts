import {
  DEFAULT_GEOMETRY_STYLE,
  getDefaultTextPlacementForTarget,
  isTextAttachmentTarget,
  type GeometryObjectRecord,
  type Point2D,
  type TextAttachmentPlacement,
  type TextMode,
  type TextObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import { textCreationSession } from "./TextCreationSession";
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

export function inferTextMode(content: string): TextMode {
  const trimmed = content.trim();

  if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
    return "math";
  }

  if (trimmed.includes("\\") || trimmed.includes("{") || trimmed.includes("}")) {
    return "latex";
  }

  return "plain";
}

export function normalizeTextContent(content: string): string {
  const trimmed = content.trim();

  return trimmed.length > 0 ? trimmed : "Text";
}

export function createTextObject({
  content,
  mode,
  objects,
  offset,
  placement,
  point,
  targetObjectId,
}: {
  readonly content: string;
  readonly mode: TextMode;
  readonly objects: GeometryObjectRecord;
  readonly offset?: Point2D;
  readonly placement?: TextAttachmentPlacement;
  readonly point: Point2D;
  readonly targetObjectId?: string;
}): TextObject {
  const now = Date.now();
  const attached = Boolean(targetObjectId && placement);

  return {
    content,
    createdAt: now,
    dependencies: targetObjectId ? [targetObjectId] : [],
    dependents: [],
    id: createTextId(),
    locked: false,
    metadata: {
      alignment: "left",
      fontSize: 14,
      opacity: 1,
      rotation: 0,
      ...(attached
        ? {
            offset: offset ?? { x: 0, y: 0 },
            placement,
            targetObjectId,
          }
        : {}),
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

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );
    const target = hit?.object ?? null;
    const attachedTarget = isTextAttachmentTarget(target) ? target : null;

    textCreationSession.start({
      point: event.snappedWorldPoint,
      ...(attachedTarget
        ? {
            placement: getDefaultTextPlacementForTarget(attachedTarget),
            targetObjectId: attachedTarget.id,
            targetObjectType: attachedTarget.type,
          }
        : {}),
    });
    context.setHoveredObject(null);
    this.transitionState("waitingInput", "await-input");
  }

  keyDown(event: KeyboardEvent, _context: ToolContext): void {
    if (event.key !== "Escape") {
      return;
    }

    textCreationSession.cancel();
    this.transitionState("cancelled", "cancel");
    this.transitionState("waitingInput", "await-input");
  }

  cancel(context: ToolContext): void {
    textCreationSession.cancel();
    super.cancel(context);
    this.transitionState("waitingInput", "await-input");
  }

  deactivate(context: ToolContext): void {
    textCreationSession.cancel();
    super.deactivate(context);
  }
}

export const textTool = new TextTool();
