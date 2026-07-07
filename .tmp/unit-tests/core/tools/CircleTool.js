"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circleTool = exports.CircleTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const PointTool_1 = require("./PointTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
let circleIdCounter = 0;
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveSnapPoint(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function hasDuplicateCircle(centerPointId, radiusPointId, objects) {
    return Object.values(objects).some((object) => object.type === "circle" &&
        object.circleKind === "center-point" &&
        object.centerPointId === centerPointId &&
        object.radiusPointId === radiusPointId);
}
function createCircleName(center, radiusPoint) {
    if (center.name && radiusPoint.name) {
        return `Circle ${center.name}${radiusPoint.name}`;
    }
    return "Circle";
}
function createCircleId(center, radiusPoint) {
    circleIdCounter += 1;
    return `circle-${center.id}-${radiusPoint.id}-${Date.now().toString(36)}-${circleIdCounter}`;
}
function createCircle(center, radiusPoint) {
    const now = Date.now();
    return {
        centerPointId: center.id,
        circleKind: "center-point",
        createdAt: now,
        dependencies: [center.id, radiusPoint.id],
        dependents: [],
        id: createCircleId(center, radiusPoint),
        locked: false,
        name: createCircleName(center, radiusPoint),
        radiusPointId: radiusPoint.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 1.85,
        },
        type: "circle",
        updatedAt: now,
        visible: true,
    };
}
class CircleTool extends BaseTool_1.BaseTool {
    centerEndpoint = null;
    previewRadiusPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create circle");
    constructor() {
        super({
            cursor: "crosshair",
            id: "circle",
            name: "Circle",
            shortcut: "C",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        if (!this.centerEndpoint) {
            const endpoint = this.resolveEndpoint(event, context);
            if (!endpoint) {
                return;
            }
            this.centerEndpoint = endpoint;
            this.previewRadiusPoint = this.centerEndpoint.point;
            this.transitionState("preview", "preview");
            return;
        }
        const radiusPoint = getPointFromHit(event, context);
        const radiusWorldPoint = radiusPoint ?? event.snappedWorldPoint;
        if ((0, geometry_1.distance)(this.centerEndpoint.point, radiusWorldPoint) <= geometry_1.EPSILON) {
            return;
        }
        const finalRadiusPoint = radiusPoint ?? (0, PointTool_1.createNamedFreePoint)(radiusWorldPoint, context.objects);
        if (hasDuplicateCircle(this.centerEndpoint.point.id, finalRadiusPoint.id, context.objects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        this.history.ensure(context);
        if (!radiusPoint && !context.addObject(finalRadiusPoint)) {
            this.history.commit(context);
            return;
        }
        const latestObjects = {
            ...context.objects,
            [finalRadiusPoint.id]: finalRadiusPoint,
        };
        const circle = createCircle(this.centerEndpoint.point, finalRadiusPoint);
        if (hasDuplicateCircle(circle.centerPointId, circle.radiusPointId, latestObjects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        if (context.addObject(circle)) {
            context.selectObject(circle.id);
            context.setHoveredObject(circle.id);
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
        if (!this.centerEndpoint) {
            const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
            context.setHoveredObject(hit?.objectId ?? null);
            return;
        }
        this.previewRadiusPoint = resolveSnapPoint(event, context);
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
        if (!this.centerEndpoint || !this.previewRadiusPoint) {
            return null;
        }
        const radius = (0, geometry_1.distance)(this.centerEndpoint.point, this.previewRadiusPoint);
        if (radius <= geometry_1.EPSILON) {
            return null;
        }
        const center = (0, viewport_1.worldToScreen)(this.centerEndpoint.point, context.viewport);
        return (0, react_1.createElement)("circle", {
            cx: center.x,
            cy: center.y,
            fill: "transparent",
            r: radius * context.viewport.scale,
            stroke: "#7ddcff",
            strokeDasharray: "8 7",
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
        this.centerEndpoint = null;
        this.previewRadiusPoint = null;
    }
}
exports.CircleTool = CircleTool;
exports.circleTool = new CircleTool();
