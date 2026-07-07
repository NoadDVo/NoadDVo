"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.measurementTool = exports.MeasurementTool = void 0;
exports.createMeasurementObject = createMeasurementObject;
const geometry_1 = require("../geometry");
const HitTest_1 = require("../selection/HitTest");
const BaseTool_1 = require("./BaseTool");
let measurementIdCounter = 0;
const targetMeasurementTypes = {
    angle: ["angle-value"],
    arc: ["arc-length"],
    circle: [
        "circle-radius",
        "circle-diameter",
        "circle-circumference",
        "circle-area",
    ],
    polygon: ["polygon-area", "polygon-perimeter"],
    region: ["region-area"],
    segment: ["segment-length"],
};
function createMeasurementId() {
    measurementIdCounter += 1;
    return `measurement-${Date.now().toString(36)}-${measurementIdCounter}`;
}
function getSupportedTypes(target) {
    const map = targetMeasurementTypes;
    return map[target.type] ?? [];
}
function chooseMeasurementType(target) {
    const supportedTypes = getSupportedTypes(target);
    if (supportedTypes.length === 0) {
        return null;
    }
    const fallback = supportedTypes[0];
    if (supportedTypes.length === 1 || !fallback) {
        return fallback ?? null;
    }
    const requested = window.prompt(`Measurement type: ${supportedTypes.join(", ")}`, fallback);
    return requested && supportedTypes.includes(requested) ? requested : null;
}
function createMeasurementObject({ measurementType, objects, target, }) {
    const now = Date.now();
    const sameTypeCount = Object.values(objects).filter((object) => object.type === "measurement").length;
    return {
        createdAt: now,
        dependencies: [target.id],
        dependents: [],
        id: createMeasurementId(),
        labelPosition: "above",
        locked: false,
        measurementType,
        name: `m${sameTypeCount + 1}`,
        precision: 2,
        style: {
            ...geometry_1.DEFAULT_GEOMETRY_STYLE,
            labelSize: 13,
            stroke: "#0b0f14",
            strokeOpacity: 1,
        },
        targetObjectId: target.id,
        type: "measurement",
        updatedAt: now,
        visible: true,
    };
}
class MeasurementTool extends BaseTool_1.BaseTool {
    constructor() {
        super({
            cursor: "crosshair",
            id: "measure",
            name: "Measure",
            shortcut: "M",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        const hit = (0, HitTest_1.hitTest)(event.screenPoint, event.worldPoint, context.objects, context.viewport);
        const target = hit?.object ?? null;
        const measurementType = target ? chooseMeasurementType(target) : null;
        if (!target || !measurementType || !(0, geometry_1.isMeasurementTypeSupported)(target, measurementType)) {
            this.transitionState("cancelled", "cancel");
            return;
        }
        const measurement = createMeasurementObject({
            measurementType,
            objects: context.objects,
            target,
        });
        if (context.addObject(measurement)) {
            context.selectObject(measurement.id);
            context.setHoveredObject(measurement.id);
            this.transitionState("completed", "complete");
            this.transitionState("waitingInput", "await-input");
        }
    }
}
exports.MeasurementTool = MeasurementTool;
exports.measurementTool = new MeasurementTool();
