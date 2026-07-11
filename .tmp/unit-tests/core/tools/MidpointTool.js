"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.midpointTool = exports.MidpointTool = void 0;
const react_1 = require("react");
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
const ConstructionToolUtils_1 = require("./ConstructionToolUtils");
const PointTool_1 = require("./PointTool");
const ToolPreviewPrimitives_1 = require("./ToolPreviewPrimitives");
class MidpointTool extends BaseTool_1.BaseTool {
    firstPoint = null;
    constructor() {
        super({
            cursor: "crosshair",
            id: "midpoint",
            name: "Midpoint",
            shortcut: "M",
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
        if (!this.firstPoint) {
            this.firstPoint = point;
            context.selectObject(point.id);
            this.transitionState("waitingInput", "await-input");
            return;
        }
        if (this.firstPoint.id === point.id || (0, geometry_1.pointsAlmostEqual)(this.firstPoint, point)) {
            return;
        }
        const constructedPoint = (0, PointTool_1.createNamedDerivedPoint)((0, geometry_1.midpoint)(this.firstPoint, point), context.objects, {
            pointAId: this.firstPoint.id,
            pointBId: point.id,
            type: "midpoint",
        });
        if (context.addObject(constructedPoint)) {
            context.selectObject(constructedPoint.id);
            context.setHoveredObject(constructedPoint.id);
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
        }
    }
    pointerMove(event, context) {
        context.setHoveredObject((0, ConstructionToolUtils_1.getHitPoint)(event, context)?.id ?? null);
    }
    renderPreview(context) {
        if (!this.firstPoint) {
            return null;
        }
        return (0, react_1.createElement)("g", null, (0, ToolPreviewPrimitives_1.renderPreviewPolyline)({
            points: [this.firstPoint, context.pointerWorld],
            viewport: context.viewport,
        }), (0, ToolPreviewPrimitives_1.renderPreviewPoint)({
            point: (0, geometry_1.midpoint)(this.firstPoint, context.pointerWorld),
            r: 4,
            viewport: context.viewport,
        }));
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
        this.firstPoint = null;
    }
}
exports.MidpointTool = MidpointTool;
exports.midpointTool = new MidpointTool();
