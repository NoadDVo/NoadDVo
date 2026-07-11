"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lineTool = exports.LineTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const LineToolPreview_1 = require("./LineToolPreview");
const PointTool_1 = require("./PointTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
let lineIdCounter = 0;
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveSnapPoint(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function hasDuplicateLine(pointAId, pointBId, objects) {
    return Object.values(objects).some((object) => {
        if (object.type !== "line") {
            return false;
        }
        return ((object.pointAId === pointAId && object.pointBId === pointBId) ||
            (object.pointAId === pointBId && object.pointBId === pointAId));
    });
}
function createLineName(pointA, pointB) {
    if (pointA.name && pointB.name) {
        return `${pointA.name}${pointB.name}`;
    }
    return "Line";
}
function createLineId(pointA, pointB) {
    lineIdCounter += 1;
    return `line-${pointA.id}-${pointB.id}-${Date.now().toString(36)}-${lineIdCounter}`;
}
function createLine(pointA, pointB) {
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [pointA.id, pointB.id],
        dependents: [],
        id: createLineId(pointA, pointB),
        locked: false,
        name: createLineName(pointA, pointB),
        pointAId: pointA.id,
        pointBId: pointB.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 1.85,
        },
        type: "line",
        updatedAt: now,
        visible: true,
    };
}
class LineTool extends BaseTool_1.BaseTool {
    startEndpoint = null;
    previewEndPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create line");
    constructor() {
        super({
            cursor: "crosshair",
            id: "line",
            name: "Line",
            shortcut: "L",
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
        if (hasDuplicateLine(this.startEndpoint.point.id, finalEndPoint.id, context.objects)) {
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
        const line = createLine(this.startEndpoint.point, finalEndPoint);
        if (hasDuplicateLine(line.pointAId, line.pointBId, latestObjects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        if (context.addObject(line)) {
            context.selectObject(line.id);
            context.setHoveredObject(line.id);
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
        const clippedLine = (0, LineToolPreview_1.clipLineToBounds)(this.startEndpoint.point, this.previewEndPoint, (0, viewport_1.getViewportWorldBounds)(context.viewport));
        if (!clippedLine) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(clippedLine[0], context.viewport);
        const end = (0, viewport_1.worldToScreen)(clippedLine[1], context.viewport);
        return (0, react_1.createElement)("line", {
            x1: start.x,
            x2: end.x,
            y1: start.y,
            y2: end.y,
            stroke: "#7ddcff",
            strokeDasharray: "10 8",
            strokeLinecap: "round",
            strokeOpacity: 0.72,
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
exports.LineTool = LineTool;
exports.lineTool = new LineTool();
