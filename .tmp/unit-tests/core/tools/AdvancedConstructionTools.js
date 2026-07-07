"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incircleTool = exports.circumcircleTool = exports.altitudeTool = exports.medianTool = exports.angleBisectorTool = exports.perpendicularBisectorTool = void 0;
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
const ConstructionToolUtils_1 = require("./ConstructionToolUtils");
const PointTool_1 = require("./PointTool");
const ToolPreviewPrimitives_1 = require("./ToolPreviewPrimitives");
function hiddenName(prefix) {
    return `${prefix}${Date.now().toString(36)}`;
}
function withObject(objects, point) {
    return {
        ...objects,
        [point.id]: point,
    };
}
class PointSequenceConstructionTool extends BaseTool_1.BaseTool {
    options;
    points = [];
    constructor(options) {
        super({
            cursor: "crosshair",
            id: options.id,
            name: options.name,
            shortcut: options.shortcut,
        });
        this.options = options;
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const point = (0, ConstructionToolUtils_1.getHitPoint)(event, context);
        if (!point || this.points.some((selected) => selected.id === point.id)) {
            return;
        }
        this.points = [...this.points, point];
        context.setSelectedObjects(this.points.map((selected) => selected.id));
        this.transitionState(this.points.length >= this.options.pointCount ? "completed" : "waitingInput", this.points.length >= this.options.pointCount ? "complete" : "await-input");
        if (this.points.length < this.options.pointCount) {
            return;
        }
        this.options.onComplete(this.points, context);
        this.reset();
        this.transitionState("waitingInput", "await-input");
    }
    pointerMove(event, context) {
        context.setHoveredObject((0, ConstructionToolUtils_1.getHitPoint)(event, context)?.id ?? null);
    }
    renderPreview(context) {
        return (0, ToolPreviewPrimitives_1.renderPointSequencePreview)({
            pointerWorld: context.pointerWorld,
            points: this.points,
            viewport: context.viewport,
        });
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
        this.points = [];
    }
}
function addConstructionObjects(context, description, createObjects) {
    const result = createObjects(context.objects);
    if (!result) {
        return;
    }
    const nextObjects = {
        ...context.objects,
        ...Object.fromEntries(result.objects.map((object) => [object.id, object])),
    };
    const validation = (0, geometry_1.validateGeometryObjects)(nextObjects);
    if (!validation.valid) {
        return;
    }
    context.beginHistoryTransaction("construction", description);
    for (const object of result.objects) {
        if (!context.addObject(object)) {
            context.cancelHistoryTransaction();
            return;
        }
    }
    context.selectObject(result.selectableId);
    context.setHoveredObject(result.selectableId);
    context.commitHistoryTransaction();
}
exports.perpendicularBisectorTool = new PointSequenceConstructionTool({
    description: "Create perpendicular bisector",
    id: "perpendicular-bisector",
    name: "Perpendicular Bisector",
    pointCount: 2,
    shortcut: "B",
    onComplete: ([pointA, pointB], context) => {
        if (!pointA || !pointB) {
            return;
        }
        addConstructionObjects(context, "Create perpendicular bisector", (objects) => {
            const middle = (0, geometry_1.midpoint)(pointA, pointB);
            const direction = (0, geometry_1.recomputeConstructedPoint)({
                pointAId: pointA.id,
                pointBId: pointB.id,
                type: "perpendicular-bisector-point",
            }, objects);
            if (!direction) {
                return null;
            }
            const midpointPoint = (0, PointTool_1.createNamedDerivedPoint)(middle, objects, {
                pointAId: pointA.id,
                pointBId: pointB.id,
                type: "midpoint",
            }, { namePrefix: hiddenName("M"), visible: false });
            const nextObjects = withObject(objects, midpointPoint);
            const directionPoint = (0, PointTool_1.createNamedDerivedPoint)(direction, nextObjects, {
                pointAId: pointA.id,
                pointBId: pointB.id,
                type: "perpendicular-bisector-point",
            }, { namePrefix: hiddenName("PB"), visible: false });
            const line = (0, ConstructionToolUtils_1.createConstructionLine)(midpointPoint, directionPoint, "Perpendicular Bisector");
            return {
                objects: [midpointPoint, directionPoint, line],
                selectableId: line.id,
            };
        });
    },
});
exports.angleBisectorTool = new PointSequenceConstructionTool({
    description: "Create angle bisector",
    id: "angle-bisector",
    name: "Angle Bisector",
    pointCount: 3,
    shortcut: "J",
    onComplete: ([pointA, vertex, pointC], context) => {
        if (!pointA || !vertex || !pointC) {
            return;
        }
        addConstructionObjects(context, "Create angle bisector", (objects) => {
            const direction = (0, geometry_1.angleBisectorDirectionPoint)(pointA, vertex, pointC);
            if (!direction) {
                return null;
            }
            const directionPoint = (0, PointTool_1.createNamedDerivedPoint)(direction, objects, {
                pointAId: pointA.id,
                pointCId: pointC.id,
                type: "angle-bisector-point",
                vertexPointId: vertex.id,
            }, { namePrefix: hiddenName("AB"), visible: false });
            if ((0, ConstructionToolUtils_1.hasLineWithEndpoints)(vertex.id, directionPoint.id, objects)) {
                return null;
            }
            const line = (0, ConstructionToolUtils_1.createConstructionLine)(vertex, directionPoint, "Angle Bisector");
            return {
                objects: [directionPoint, line],
                selectableId: line.id,
            };
        });
    },
});
exports.medianTool = new PointSequenceConstructionTool({
    description: "Create median",
    id: "median",
    name: "Median",
    pointCount: 3,
    shortcut: "D",
    onComplete: ([vertex, sideA, sideB], context) => {
        if (!vertex || !sideA || !sideB) {
            return;
        }
        addConstructionObjects(context, "Create median", (objects) => {
            const middle = (0, geometry_1.midpoint)(sideA, sideB);
            const midpointPoint = (0, PointTool_1.createNamedDerivedPoint)(middle, objects, {
                pointAId: sideA.id,
                pointBId: sideB.id,
                type: "midpoint",
            }, { namePrefix: hiddenName("MED"), visible: false });
            const line = (0, ConstructionToolUtils_1.createConstructionLine)(vertex, midpointPoint, "Median");
            return {
                objects: [midpointPoint, line],
                selectableId: line.id,
            };
        });
    },
});
exports.altitudeTool = new PointSequenceConstructionTool({
    description: "Create altitude",
    id: "altitude",
    name: "Altitude",
    pointCount: 3,
    shortcut: "H",
    onComplete: ([vertex, sideA, sideB], context) => {
        if (!vertex || !sideA || !sideB) {
            return;
        }
        addConstructionObjects(context, "Create altitude", (objects) => {
            const foot = (0, geometry_1.projectPointToLine)(vertex, sideA, sideB);
            if (!foot) {
                return null;
            }
            const footPoint = (0, PointTool_1.createNamedDerivedPoint)(foot, objects, {
                linePointAId: sideA.id,
                linePointBId: sideB.id,
                pointId: vertex.id,
                type: "projection-point",
            }, { namePrefix: hiddenName("ALT"), visible: false });
            const line = (0, ConstructionToolUtils_1.createConstructionLine)(vertex, footPoint, "Altitude");
            return {
                objects: [footPoint, line],
                selectableId: line.id,
            };
        });
    },
});
exports.circumcircleTool = new PointSequenceConstructionTool({
    description: "Create circumcircle",
    id: "circumcircle",
    name: "Circumcircle",
    pointCount: 3,
    shortcut: "U",
    onComplete: ([pointA, pointB, pointC], context) => {
        if (!pointA || !pointB || !pointC) {
            return;
        }
        addConstructionObjects(context, "Create circumcircle", () => {
            const circle = (0, ConstructionToolUtils_1.createThreePointConstructionCircle)(pointA, pointB, pointC, "Circumcircle");
            return {
                objects: [circle],
                selectableId: circle.id,
            };
        });
    },
});
exports.incircleTool = new PointSequenceConstructionTool({
    description: "Create incircle",
    id: "incircle",
    name: "Incircle",
    pointCount: 3,
    shortcut: "Q",
    onComplete: ([pointA, pointB, pointC], context) => {
        if (!pointA || !pointB || !pointC) {
            return;
        }
        addConstructionObjects(context, "Create incircle", (objects) => {
            const center = (0, geometry_1.incenterPoint)(pointA, pointB, pointC);
            if (!center) {
                return null;
            }
            const centerPoint = (0, PointTool_1.createNamedDerivedPoint)(center, objects, {
                pointAId: pointA.id,
                pointBId: pointB.id,
                pointCId: pointC.id,
                type: "incenter",
            }, { namePrefix: hiddenName("I"), visible: false });
            const nextObjects = withObject(objects, centerPoint);
            const radiusPoint = (0, PointTool_1.createNamedDerivedPoint)((0, geometry_1.projectPointToLine)(center, pointA, pointB) ?? center, nextObjects, {
                centerPointId: centerPoint.id,
                sidePointAId: pointA.id,
                sidePointBId: pointB.id,
                type: "inradius-point",
            }, { namePrefix: hiddenName("IR"), visible: false });
            const circle = (0, ConstructionToolUtils_1.createConstructionCircle)(centerPoint, radiusPoint, "Incircle");
            return {
                objects: [centerPoint, radiusPoint, circle],
                selectableId: circle.id,
            };
        });
    },
});
