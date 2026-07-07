"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.intersectionTool = exports.IntersectionTool = void 0;
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
const ConstructionToolUtils_1 = require("./ConstructionToolUtils");
const PointTool_1 = require("./PointTool");
function supportsIntersection(first, second) {
    return ((first.type === "line" && second.type === "line") ||
        (first.type === "segment" && second.type === "segment") ||
        (first.type === "line" && second.type === "circle") ||
        (first.type === "circle" && second.type === "line") ||
        (first.type === "circle" && second.type === "circle"));
}
function createIntersectionPoint(point, sourceA, sourceB, index, context) {
    return (0, PointTool_1.createNamedDerivedPoint)(point, context.objects, {
        index,
        sourceAId: sourceA.id,
        sourceBId: sourceB.id,
        type: "intersection",
    });
}
class IntersectionTool extends BaseTool_1.BaseTool {
    firstSource = null;
    constructor() {
        super({
            cursor: "crosshair",
            id: "intersection",
            name: "Intersection",
            shortcut: "I",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const source = (0, ConstructionToolUtils_1.getHitIntersectionSource)(event, context);
        if (!source) {
            context.setHoveredObject(null);
            return;
        }
        if (!this.firstSource) {
            this.firstSource = source;
            context.selectObject(source.id);
            return;
        }
        if (this.firstSource.id === source.id || !supportsIntersection(this.firstSource, source)) {
            return;
        }
        const intersections = (0, geometry_1.getIntersectionPoints)(this.firstSource, source, context.objects);
        if (intersections.length === 0) {
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        const createdIds = [];
        let nextObjects = context.objects;
        context.beginHistoryTransaction("construction", "Create intersection");
        intersections.forEach((point, index) => {
            const constructedPoint = createIntersectionPoint(point, this.firstSource, source, index, { ...context, objects: nextObjects });
            if (context.addObject(constructedPoint)) {
                createdIds.push(constructedPoint.id);
                nextObjects = {
                    ...nextObjects,
                    [constructedPoint.id]: constructedPoint,
                };
            }
        });
        if (createdIds.length > 0) {
            context.setSelectedObjects(createdIds);
            context.setHoveredObject(createdIds[0] ?? null);
            context.commitHistoryTransaction();
        }
        else {
            context.cancelHistoryTransaction();
        }
        this.transitionState("completed", "complete");
        this.reset();
        this.transitionState("waitingInput", "await-input");
    }
    pointerMove(event, context) {
        context.setHoveredObject((0, ConstructionToolUtils_1.getHitIntersectionSource)(event, context)?.id ?? null);
    }
    cancel(_context) {
        this.reset();
        this.transitionState("cancelled", "cancel");
        this.transitionState("waitingInput", "await-input");
    }
    deactivate(_context) {
        this.reset();
        this.transitionState("cancelled", "cancel");
        this.resetState("reset");
    }
    reset() {
        this.firstSource = null;
    }
}
exports.IntersectionTool = IntersectionTool;
exports.intersectionTool = new IntersectionTool();
