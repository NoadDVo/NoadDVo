"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.polygonTool = exports.PolygonTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const viewport_1 = require("../geometry/viewport");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
const PointTool_1 = require("./PointTool");
const ToolHistorySession_1 = require("./ToolHistorySession");
let polygonIdCounter = 0;
function getPointFromHit(event, context) {
    const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
    return hit?.object.type === "point" ? hit.object : null;
}
function resolveSnapPoint(event, context) {
    return getPointFromHit(event, context) ?? event.snappedWorldPoint;
}
function createPolygonName(vertices) {
    const names = vertices.map((vertex) => vertex.name).filter(Boolean);
    return names.length === vertices.length ? `Polygon ${names.join("")}` : "Polygon";
}
function createPolygonId(vertices) {
    polygonIdCounter += 1;
    return `polygon-${vertices.map((vertex) => vertex.id).join("-")}-${Date.now().toString(36)}-${polygonIdCounter}`;
}
function createPolygon(vertices) {
    const now = Date.now();
    const pointIds = vertices.map((vertex) => vertex.id);
    return {
        closed: true,
        createdAt: now,
        dependencies: pointIds,
        dependents: [],
        id: createPolygonId(vertices),
        locked: false,
        name: createPolygonName(vertices),
        pointIds,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "transparent",
            fillOpacity: 0,
            stroke: "#0b0f14",
            strokeOpacity: 1,
            strokeWidth: 2,
        },
        type: "polygon",
        updatedAt: now,
        visible: true,
    };
}
function hasDuplicateConsecutiveVertices(vertices) {
    for (let index = 0; index < vertices.length; index += 1) {
        const current = vertices[index];
        const next = vertices[(index + 1) % vertices.length];
        if (current && next && current.id === next.id) {
            return true;
        }
    }
    return false;
}
class PolygonTool extends BaseTool_1.BaseTool {
    vertices = [];
    previewPoint = null;
    history = new ToolHistorySession_1.ToolHistorySession("create", "Create polygon");
    constructor() {
        super({
            cursor: "crosshair",
            id: "polygon",
            name: "Polygon",
            shortcut: "G",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const existingPoint = getPointFromHit(event, context);
        const firstVertex = this.vertices[0];
        if (existingPoint &&
            firstVertex &&
            existingPoint.id === firstVertex.id &&
            this.vertices.length >= 3) {
            this.finish(context);
            return;
        }
        const candidateWorldPoint = existingPoint ?? event.snappedWorldPoint;
        const lastVertex = this.vertices.at(-1);
        if (lastVertex && (0, geometry_1.pointsAlmostEqual)(lastVertex, candidateWorldPoint)) {
            return;
        }
        const point = existingPoint ?? (0, PointTool_1.createNamedFreePoint)(candidateWorldPoint, context.objects);
        if (!existingPoint) {
            this.history.ensure(context);
        }
        if (!existingPoint && !context.addObject(point)) {
            this.history.cancel(context);
            return;
        }
        this.vertices = [...this.vertices, point];
        this.previewPoint = point;
        context.selectObject(point.id);
        context.setHoveredObject(point.id);
        this.transitionState("preview", "preview");
    }
    pointerMove(event, context) {
        if (this.vertices.length === 0) {
            const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
            context.setHoveredObject(hit?.objectId ?? null);
            return;
        }
        this.previewPoint = resolveSnapPoint(event, context);
    }
    keyDown(event, context) {
        if (event.key !== "Enter") {
            return;
        }
        event.preventDefault();
        this.finish(context);
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
        if (this.vertices.length === 0) {
            return null;
        }
        const previewPoints = [
            ...this.vertices,
            ...(this.previewPoint ? [this.previewPoint] : []),
        ].map((point) => (0, viewport_1.worldToScreen)(point, context.viewport));
        const path = previewPoints
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");
        const first = previewPoints[0];
        const last = previewPoints.at(-1);
        return (0, react_1.createElement)("g", null, previewPoints.length >= 3
            ? (0, react_1.createElement)("path", {
                d: `${path} Z`,
                fill: "#7ddcff",
                fillOpacity: 0.08,
                stroke: "none",
            })
            : null, (0, react_1.createElement)("path", {
            d: path,
            fill: "none",
            stroke: "#7ddcff",
            strokeDasharray: "7 6",
            strokeLinejoin: "round",
            strokeOpacity: 0.76,
            strokeWidth: 2,
        }), first && last && this.vertices.length >= 2
            ? (0, react_1.createElement)("line", {
                x1: last.x,
                x2: first.x,
                y1: last.y,
                y2: first.y,
                stroke: "#7ddcff",
                strokeDasharray: "3 7",
                strokeOpacity: 0.42,
                strokeWidth: 1.5,
            })
            : null);
    }
    finish(context) {
        if (this.vertices.length < 3) {
            return;
        }
        if (hasDuplicateConsecutiveVertices(this.vertices) ||
            Math.abs((0, geometry_1.polygonArea)(this.vertices)) <= geometry_1.EPSILON) {
            this.history.commit(context);
            return;
        }
        const polygon = createPolygon(this.vertices);
        if (context.addObject(polygon)) {
            context.selectObject(polygon.id);
            context.setHoveredObject(polygon.id);
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
        this.vertices = [];
        this.previewPoint = null;
    }
}
exports.PolygonTool = PolygonTool;
exports.polygonTool = new PolygonTool();
