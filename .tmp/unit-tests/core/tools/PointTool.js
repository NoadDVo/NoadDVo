"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pointTool = exports.PointTool = void 0;
exports.createNamedFreePoint = createNamedFreePoint;
exports.createNamedDerivedPoint = createNamedDerivedPoint;
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
let pointIdCounter = 0;
function getNextPointName(objects) {
    const usedNames = new Set(Object.values(objects)
        .filter((object) => object.type === "point" && object.name)
        .map((object) => object.name));
    for (let index = 0; index < Number.MAX_SAFE_INTEGER; index += 1) {
        const letter = String.fromCharCode(65 + (index % 26));
        const suffix = Math.floor(index / 26);
        const name = suffix === 0 ? letter : `${letter}${suffix}`;
        if (!usedNames.has(name)) {
            return name;
        }
    }
    return `P${Object.keys(objects).length + 1}`;
}
function createPointId(name) {
    pointIdCounter += 1;
    return `point-${name.toLowerCase()}-${Date.now().toString(36)}-${pointIdCounter}`;
}
function createNamedFreePoint(point, objects) {
    const name = getNextPointName(objects);
    const now = Date.now();
    return {
        createdAt: now,
        dependencies: [],
        dependents: [],
        id: createPointId(name),
        locked: false,
        name,
        pointKind: "free",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#0b0f14",
            pointSize: 5,
            stroke: "#0b0f14",
            strokeWidth: 2,
        },
        type: "point",
        updatedAt: now,
        visible: true,
        x: point.x,
        y: point.y,
    };
}
function createNamedDerivedPoint(point, objects, construction, options = {}) {
    const name = options.namePrefix ?? getNextPointName(objects);
    const now = Date.now();
    pointIdCounter += 1;
    return {
        construction,
        createdAt: now,
        dependencies: Object.values(construction).filter((value) => typeof value === "string" && value !== construction.type),
        dependents: [],
        id: `point-${name.toLowerCase()}-${Date.now().toString(36)}-${pointIdCounter}`,
        locked: false,
        name,
        pointKind: "derived",
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            fill: "#f8fafc",
            pointSize: 5,
            stroke: "#747b84",
            strokeWidth: 2,
        },
        type: "point",
        updatedAt: now,
        visible: options.visible ?? true,
        x: point.x,
        y: point.y,
    };
}
class PointTool extends BaseTool_1.BaseTool {
    constructor() {
        super({
            cursor: "crosshair",
            id: "point",
            name: "Point",
            shortcut: "P",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const point = createNamedFreePoint(event.snappedWorldPoint, context.objects);
        if (context.addObject(point)) {
            context.selectObject(point.id);
            this.transitionState("completed", "complete");
            this.transitionState("waitingInput", "await-input");
        }
    }
    cancel(context) {
        super.cancel(context);
    }
}
exports.PointTool = PointTool;
exports.pointTool = new PointTool();
