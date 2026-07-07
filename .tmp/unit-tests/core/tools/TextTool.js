"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textTool = exports.TextTool = void 0;
exports.inferTextMode = inferTextMode;
exports.normalizeTextContent = normalizeTextContent;
exports.createTextObject = createTextObject;
const geometry_1 = require("../geometry");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const TextCreationSession_1 = require("./TextCreationSession");
let textIdCounter = 0;
function createTextId() {
    textIdCounter += 1;
    return `text-${Date.now().toString(36)}-${textIdCounter}`;
}
function getNextTextName(objects) {
    const count = Object.values(objects).filter((object) => object.type === "text").length;
    return `Text ${count + 1}`;
}
function inferTextMode(content) {
    const trimmed = content.trim();
    if (trimmed.startsWith("$") && trimmed.endsWith("$")) {
        return "math";
    }
    if (trimmed.includes("\\") || trimmed.includes("{") || trimmed.includes("}")) {
        return "latex";
    }
    return "plain";
}
function normalizeTextContent(content) {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : "Text";
}
function createTextObject({ content, mode, objects, offset, placement, point, targetObjectId, }) {
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
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
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
class TextTool extends BaseTool_1.BaseTool {
    constructor() {
        super({
            cursor: "text",
            id: "text",
            name: "Text",
            shortcut: "T",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
        const target = hit?.object ?? null;
        const attachedTarget = (0, geometry_1.isTextAttachmentTarget)(target) ? target : null;
        TextCreationSession_1.textCreationSession.start({
            point: event.snappedWorldPoint,
            ...(attachedTarget
                ? {
                    placement: (0, geometry_1.getDefaultTextPlacementForTarget)(attachedTarget),
                    targetObjectId: attachedTarget.id,
                    targetObjectType: attachedTarget.type,
                }
                : {}),
        });
        context.setHoveredObject(null);
        this.transitionState("waitingInput", "await-input");
    }
    keyDown(event, _context) {
        if (event.key !== "Escape") {
            return;
        }
        TextCreationSession_1.textCreationSession.cancel();
        this.transitionState("cancelled", "cancel");
        this.transitionState("waitingInput", "await-input");
    }
    cancel(context) {
        TextCreationSession_1.textCreationSession.cancel();
        super.cancel(context);
        this.transitionState("waitingInput", "await-input");
    }
    deactivate(context) {
        TextCreationSession_1.textCreationSession.cancel();
        super.deactivate(context);
    }
}
exports.TextTool = TextTool;
exports.textTool = new TextTool();
