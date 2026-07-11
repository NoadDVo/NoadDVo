"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.segmentTool = exports.SegmentTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const PointTool_1 = require("./PointTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
let segmentIdCounter = 0;
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveSnapPoint(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function hasDuplicateSegment(startPointId, endPointId, objects) {
    return Object.values(objects).some((object) => {
        if (object.type !== "segment") {
            return false;
        }
        return ((object.startPointId === startPointId && object.endPointId === endPointId) ||
            (object.startPointId === endPointId && object.endPointId === startPointId));
    });
}
function createSegmentName(start, end) {
    if (start.name && end.name) {
        return `${start.name}${end.name}`;
    }
    return "Segment";
}
function createSegmentId(start, end) {
    segmentIdCounter += 1;
    return `segment-${start.id}-${end.id}-${Date.now().toString(36)}-${segmentIdCounter}`;
}
function createSegment(start, end) {
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [start.id, end.id],
        dependents: [],
        endPointId: end.id,
        id: createSegmentId(start, end),
        locked: false,
        name: createSegmentName(start, end),
        startPointId: start.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 2,
        },
        type: "segment",
        updatedAt: now,
        visible: true,
    };
}
class SegmentTool extends BaseTool_1.BaseTool {
    startEndpoint = null;
    previewEndPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create segment");
    constructor() {
        super({
            cursor: "crosshair",
            id: "segment",
            name: "Segment",
            shortcut: "S",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        if (!this.startEndpoint) {
            const endpoint = this.resolveEndpoint(event, context);
            if (!endpoint) {
                return;
            }
            this.startEndpoint = endpoint;
            this.previewEndPoint = this.startEndpoint.point;
            this.transitionState("preview", "preview");
            return;
        }
        const endPoint = getPointFromHit(event, context);
        const endWorldPoint = endPoint ?? event.snappedWorldPoint;
        if (this.startEndpoint.point.id === endPoint?.id ||
            (0, geometry_1.pointsAlmostEqual)(this.startEndpoint.point, endWorldPoint)) {
            return;
        }
        const finalEndPoint = endPoint ?? (0, PointTool_1.createNamedFreePoint)(endWorldPoint, context.objects);
        if (hasDuplicateSegment(this.startEndpoint.point.id, finalEndPoint.id, context.objects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        this.history.ensure(context);
        if (!endPoint && !context.addObject(finalEndPoint)) {
            this.history.commit(context);
            return;
        }
        const latestObjects = {
            ...context.objects,
            [finalEndPoint.id]: finalEndPoint,
        };
        const segment = createSegment(this.startEndpoint.point, finalEndPoint);
        if (hasDuplicateSegment(segment.startPointId, segment.endPointId, latestObjects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        if (context.addObject(segment)) {
            context.selectObject(segment.id);
            context.setHoveredObject(segment.id);
            this.history.commit(context);
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
        }
        else {
            this.history.commit(context);
        }
    }
    pointerMove(event, context) {
        if (!this.startEndpoint) {
            const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
            context.setHoveredObject(hit?.objectId ?? null);
            return;
        }
        this.previewEndPoint = resolveSnapPoint(event, context);
    }
    cancel(context) {
        this.history.commit(context);
        this.reset();
        this.transitionState("cancelled", "cancel");
        this.transitionState("waitingInput", "await-input");
    }
    deactivate(context) {
        this.history.commit(context);
        this.reset();
        this.transitionState("cancelled", "cancel");
        this.resetState("reset");
    }
    renderPreview(context) {
        if (!this.startEndpoint || !this.previewEndPoint) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(this.startEndpoint.point, context.viewport);
        const end = (0, viewport_1.worldToScreen)(this.previewEndPoint, context.viewport);
        return (0, react_1.createElement)("line", {
            x1: start.x,
            x2: end.x,
            y1: start.y,
            y2: end.y,
            stroke: "#7ddcff",
            strokeDasharray: "7 6",
            strokeLinecap: "round",
            strokeOpacity: 0.74,
            strokeWidth: 2,
        });
    }
    resolveEndpoint(event, context) {
        const existingPoint = getPointFromHit(event, context);
        if (existingPoint) {
            context.selectObject(existingPoint.id);
            context.setHoveredObject(existingPoint.id);
            return {
                point: existingPoint,
            };
        }
        const point = (0, PointTool_1.createNamedFreePoint)(event.snappedWorldPoint, context.objects);
        this.history.ensure(context);
        if (!context.addObject(point)) {
            this.history.cancel(context);
            return null;
        }
        context.selectObject(point.id);
        return {
            point,
        };
    }
    reset() {
        this.startEndpoint = null;
        this.previewEndPoint = null;
    }
}
exports.SegmentTool = SegmentTool;
exports.segmentTool = new SegmentTool();
