"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parallelLineTool = exports.ParallelLineTool = void 0;
const geometry_1 = require("../geometry");
const BaseTool_1 = require("./BaseTool");
const ConstructionToolUtils_1 = require("./ConstructionToolUtils");
const PointTool_1 = require("./PointTool");
const ToolPreviewPrimitives_1 = require("./ToolPreviewPrimitives");
class ParallelLineTool extends BaseTool_1.BaseTool {
    anchorPoint = null;
    constructor() {
        super({
            cursor: "crosshair",
            id: "parallel",
            name: "Parallel Line",
            shortcut: "K",
        });
    }
    pointerDown(event, context) {
        if (event.button !== 0) {
            return;
        }
        if (!this.anchorPoint) {
            const point = (0, ConstructionToolUtils_1.getHitPoint)(event, context);
            if (!point) {
                return;
            }
            this.anchorPoint = point;
            context.selectObject(point.id);
            return;
        }
        const sourceLine = (0, ConstructionToolUtils_1.getHitLine)(event, context);
        if (!sourceLine) {
            return;
        }
        this.createLine(this.anchorPoint, sourceLine, context);
    }
    pointerMove(event, context) {
        const hovered = this.anchorPoint
            ? (0, ConstructionToolUtils_1.getHitLine)(event, context)
            : (0, ConstructionToolUtils_1.getHitPoint)(event, context);
        context.setHoveredObject(hovered?.id ?? null);
    }
    renderPreview(context) {
        if (!this.anchorPoint) {
            return null;
        }
        return (0, ToolPreviewPrimitives_1.renderPreviewPolyline)({
            points: [this.anchorPoint, context.pointerWorld],
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
    createLine(anchorPoint, sourceLine, context) {
        const construction = {
            lineId: sourceLine.id,
            pointId: anchorPoint.id,
            type: "parallel-line-point",
        };
        const directionPoint = (0, geometry_1.recomputeConstructedPoint)(construction, context.objects);
        if (!directionPoint) {
            return;
        }
        const helperPoint = (0, PointTool_1.createNamedDerivedPoint)(directionPoint, context.objects, construction, {
            namePrefix: `H${Date.now().toString(36)}`,
            visible: false,
        });
        if ((0, ConstructionToolUtils_1.hasLineWithEndpoints)(anchorPoint.id, helperPoint.id, context.objects)) {
            return;
        }
        context.beginHistoryTransaction("construction", "Create parallel line");
        if (!context.addObject(helperPoint)) {
            context.cancelHistoryTransaction();
            return;
        }
        const line = (0, ConstructionToolUtils_1.createConstructionLine)(anchorPoint, helperPoint, "Parallel Line");
        if (context.addObject(line)) {
            context.selectObject(line.id);
            context.setHoveredObject(line.id);
            context.commitHistoryTransaction();
            this.transitionState("completed", "complete");
            this.reset();
            this.transitionState("waitingInput", "await-input");
            return;
        }
        context.commitHistoryTransaction();
    }
    reset() {
        this.anchorPoint = null;
    }
}
exports.ParallelLineTool = ParallelLineTool;
exports.parallelLineTool = new ParallelLineTool();
