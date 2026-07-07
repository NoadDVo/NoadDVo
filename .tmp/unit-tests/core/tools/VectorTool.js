"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorTool = exports.VectorTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const BaseTool_1 = require("./BaseTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
const TwoPointToolHelpers_1 = require("./TwoPointToolHelpers");
let vectorIdCounter = 0;
function hasDuplicateVector(startPointId, endPointId, objects) {
    return Object.values(objects).some((object) => object.type === "vector" &&
        object.startPointId === startPointId &&
        object.endPointId === endPointId);
}
function createVectorName(start, end) {
    if (start.name && end.name) {
        return `${start.name}${end.name}`;
    }
    return "Vector";
}
function createVectorId(start, end) {
    vectorIdCounter += 1;
    return `vector-${start.id}-${end.id}-${Date.now().toString(36)}-${vectorIdCounter}`;
}
function createVector(start, end) {
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [start.id, end.id],
        dependents: [],
        endPointId: end.id,
        id: createVectorId(start, end),
        locked: false,
        metadata: {
            arrowSize: 8,
            arrowStyle: "latex",
        },
        name: createVectorName(start, end),
        startPointId: start.id,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 2,
        },
        type: "vector",
        updatedAt: now,
        visible: true,
    };
}
class VectorTool extends BaseTool_1.BaseTool {
    startEndpoint = null;
    previewEndPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create vector");
    constructor() {
        super({
            cursor: "crosshair",
            id: "vector",
            name: "Vector",
            shortcut: "X",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        if (!this.startEndpoint) {
            const endpoint = (0, TwoPointToolHelpers_1.resolveFirstEndpoint)(event, context, this.history);
            if (!endpoint) {
                return;
            }
            this.startEndpoint = endpoint;
            this.previewEndPoint = endpoint.point;
            this.transitionState("preview", "preview");
            return;
        }
        this.completeVector(event, context);
    }
    pointerMove(event, context) {
        if (!this.startEndpoint) {
            (0, TwoPointToolHelpers_1.hoverHitObject)(event, context);
            return;
        }
        this.previewEndPoint = (0, TwoPointToolHelpers_1.resolveTwoPointSnap)(event, context);
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
        return (0, react_1.createElement)("g", {}, [
            (0, react_1.createElement)("defs", { key: "defs" }, [
                (0, react_1.createElement)("marker", {
                    id: "ndv-vector-preview-arrow",
                    key: "marker",
                    markerHeight: 8,
                    markerWidth: 8,
                    orient: "auto",
                    refX: 7,
                    refY: 4,
                    viewBox: "0 0 8 8",
                }, (0, react_1.createElement)("path", {
                    d: "M 0 0 L 8 4 L 0 8 L 2.6 4 z",
                    fill: "#7ddcff",
                })),
            ]),
            (0, react_1.createElement)("line", {
                key: "line",
                markerEnd: "url(#ndv-vector-preview-arrow)",
                stroke: "#7ddcff",
                strokeDasharray: "7 6",
                strokeLinecap: "round",
                strokeOpacity: 0.78,
                strokeWidth: 2,
                x1: start.x,
                x2: end.x,
                y1: start.y,
                y2: end.y,
            }),
        ]);
    }
    completeVector(event, context) {
        if (!this.startEndpoint) {
            return;
        }
        const endPoint = (0, TwoPointToolHelpers_1.resolveFinalEndpoint)({
            context,
            event,
            history: this.history,
            objects: context.objects,
            startPoint: this.startEndpoint.point,
        });
        if (!endPoint) {
            return;
        }
        const latestObjects = {
            ...context.objects,
            [endPoint.id]: endPoint,
        };
        if (hasDuplicateVector(this.startEndpoint.point.id, endPoint.id, latestObjects)) {
            this.history.commit(context);
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        const vector = createVector(this.startEndpoint.point, endPoint);
        if (context.addObject(vector)) {
            context.selectObject(vector.id);
            context.setHoveredObject(vector.id);
            this.history.commit(context);
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
        }
        else {
            this.history.commit(context);
        }
    }
    reset() {
        this.startEndpoint = null;
        this.previewEndPoint = null;
    }
}
exports.VectorTool = VectorTool;
exports.vectorTool = new VectorTool();
