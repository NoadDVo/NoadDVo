"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.angleTool = exports.AngleTool = void 0;
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
const ConstructionToolUtils_1 = require("./ConstructionToolUtils");
const angleLabels = ["α", "β", "γ", "θ"];
function getNextAngleLabel(objects) {
    const usedLabels = new Set(Object.values(objects)
        .filter((object) => object.type === "angle")
        .map((object) => object.label ?? object.name)
        .filter((label) => Boolean(label)));
    for (const label of angleLabels) {
        if (!usedLabels.has(label)) {
            return label;
        }
    }
    return `θ${usedLabels.size - angleLabels.length + 1}`;
}
function hasDuplicateAngle(pointAId, vertexPointId, pointCId, objects) {
    return Object.values(objects).some((object) => object.type === "angle" &&
        object.pointAId === pointAId &&
        object.vertexPointId === vertexPointId &&
        object.pointCId === pointCId);
}
function createAngle(pointA, vertex, pointC, objects) {
    const now = Date.now();
    const label = getNextAngleLabel(objects);
    return {
        createdAt: now,
        dependencies: [pointA.id, vertex.id, pointC.id],
        dependents: [],
        id: (0, ConstructionToolUtils_1.createConstructionId)("angle"),
        label,
        locked: false,
        name: label,
        pointAId: pointA.id,
        pointCId: pointC.id,
        radius: 0.65,
        showRightAngleMarker: (0, geometry_1.isRightAngle)(pointA, vertex, pointC),
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "transparent",
            labelVisible: true,
            stroke: "#0b0f14",
            strokeOpacity: 0.92,
            strokeWidth: 2,
        },
        type: "angle",
        updatedAt: now,
        vertexPointId: vertex.id,
        visible: true,
    };
}
class AngleTool extends BaseTool_1.BaseTool {
    pointA = null;
    vertex = null;
    constructor() {
        super({
            cursor: "crosshair",
            id: "angle",
            name: "Angle",
            shortcut: "A",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const point = (0, ConstructionToolUtils_1.getHitPoint)(event, context);
        if (!point) {
            context.setHoveredObject(null);
            return;
        }
        if (!this.pointA) {
            this.pointA = point;
            context.selectObject(point.id);
            return;
        }
        if (!this.vertex) {
            if (this.pointA.id === point.id || (0, geometry_1.pointsAlmostEqual)(this.pointA, point)) {
                return;
            }
            this.vertex = point;
            context.selectObject(point.id);
            return;
        }
        if (point.id === this.pointA.id ||
            point.id === this.vertex.id ||
            (0, geometry_1.pointsAlmostEqual)(point, this.vertex) ||
            (0, geometry_1.pointsAlmostEqual)(point, this.pointA)) {
            return;
        }
        if (hasDuplicateAngle(this.pointA.id, this.vertex.id, point.id, context.objects)) {
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        const angle = createAngle(this.pointA, this.vertex, point, context.objects);
        if (context.addObject(angle)) {
            context.selectObject(angle.id);
            context.setHoveredObject(angle.id);
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
        }
    }
    pointerMove(event, context) {
        context.setHoveredObject((0, ConstructionToolUtils_1.getHitPoint)(event, context)?.id ?? null);
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
        this.pointA = null;
        this.vertex = null;
    }
}
exports.AngleTool = AngleTool;
exports.angleTool = new AngleTool();
