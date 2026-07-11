"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rayTool = exports.RayTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const PointTool_1 = require("./PointTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
let rayIdCounter = 0;
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveSnapPoint(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function hasDuplicateRay(startPointId, throughPointId, objects) {
    return Object.values(objects).some((object) => object.type === "ray" &&
        object.startPointId === startPointId &&
        object.throughPointId === throughPointId);
}
function createRayName(start, through) {
    if (start.name && through.name) {
        return `${start.name}${through.name}`;
    }
    return "Ray";
}
function createRayId(start, through) {
    rayIdCounter += 1;
    return `ray-${start.id}-${through.id}-${Date.now().toString(36)}-${rayIdCounter}`;
}
function createRay(start, through) {
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [start.id, through.id],
        dependents: [],
        id: createRayId(start, through),
        locked: false,
        name: createRayName(start, through),
        startPointId: start.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 1.85,
        },
        throughPointId: through.id,
        type: "ray",
        updatedAt: now,
        visible: true,
    };
}
class RayTool extends BaseTool_1.BaseTool {
    startEndpoint = null;
    previewThroughPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create ray");
    constructor() {
        super({
            cursor: "crosshair",
            id: "ray",
            name: "Ray",
            shortcut: "R",
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
            this.previewThroughPoint = this.startEndpoint.point;
            this.transitionState("preview", "preview");
            return;
        }
        this.completeRay(event, context);
    }
    pointerMove(event, context) {
        if (!this.startEndpoint) {
            const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
            context.setHoveredObject(hit?.objectId ?? null);
            return;
        }
        this.previewThroughPoint = resolveSnapPoint(event, context);
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
        if (!this.startEndpoint || !this.previewThroughPoint) {
            return null;
        }
        const clippedRay = (0, viewport_1.clipRayToBounds)(this.startEndpoint.point, this.previewThroughPoint, (0, viewport_1.getViewportWorldBounds)(context.viewport));
        if (!clippedRay) {
            return null;
        }
        const start = (0, viewport_1.worldToScreen)(clippedRay[0], context.viewport);
        const end = (0, viewport_1.worldToScreen)(clippedRay[1], context.viewport);
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
    completeRay(event, context) {
        if (!this.startEndpoint) {
            return;
        }
        const throughPoint = getPointFromHit(event, context);
        const throughWorldPoint = throughPoint ?? event.snappedWorldPoint;
        if (this.startEndpoint.point.id === throughPoint?.id ||
            (0, geometry_1.pointsAlmostEqual)(this.startEndpoint.point, throughWorldPoint)) {
            return;
        }
        const finalThroughPoint = throughPoint ?? (0, PointTool_1.createNamedFreePoint)(throughWorldPoint, context.objects);
        if (hasDuplicateRay(this.startEndpoint.point.id, finalThroughPoint.id, context.objects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        this.history.ensure(context);
        if (!throughPoint && !context.addObject(finalThroughPoint)) {
            this.history.commit(context);
            return;
        }
        this.createAndSelectRay(finalThroughPoint, context);
    }
    createAndSelectRay(throughPoint, context) {
        if (!this.startEndpoint) {
            return;
        }
        const latestObjects = {
            ...context.objects,
            [throughPoint.id]: throughPoint,
        };
        const ray = createRay(this.startEndpoint.point, throughPoint);
        if (hasDuplicateRay(ray.startPointId, ray.throughPointId, latestObjects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        if (context.addObject(ray)) {
            context.selectObject(ray.id);
            context.setHoveredObject(ray.id);
            this.history.commit(context);
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
        }
        else {
            this.history.commit(context);
        }
    }
    resolveEndpoint(event, context) {
        const existingPoint = getPointFromHit(event, context);
        if (existingPoint) {
            context.selectObject(existingPoint.id);
            context.setHoveredObject(existingPoint.id);
            return { point: existingPoint };
        }
        const point = (0, PointTool_1.createNamedFreePoint)(event.snappedWorldPoint, context.objects);
        this.history.ensure(context);
        if (!context.addObject(point)) {
            this.history.cancel(context);
            return null;
        }
        context.selectObject(point.id);
        return { point };
    }
    reset() {
        this.startEndpoint = null;
        this.previewThroughPoint = null;
    }
}
exports.RayTool = RayTool;
exports.rayTool = new RayTool();
