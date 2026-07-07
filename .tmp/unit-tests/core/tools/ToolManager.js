"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolManager = exports.ToolManager = void 0;
const AdvancedConstructionTools_1 = require("./AdvancedConstructionTools");
const AngleTool_1 = require("./AngleTool");
const CircleTool_1 = require("./CircleTool");
const FillTool_1 = require("./FillTool");
const IntersectionTool_1 = require("./IntersectionTool");
const LineTool_1 = require("./LineTool");
const MeasurementTool_1 = require("./MeasurementTool");
const MidpointTool_1 = require("./MidpointTool");
const MoveTool_1 = require("./MoveTool");
const ParallelLineTool_1 = require("./ParallelLineTool");
const PerpendicularLineTool_1 = require("./PerpendicularLineTool");
const PointTool_1 = require("./PointTool");
const PolygonTool_1 = require("./PolygonTool");
const RayTool_1 = require("./RayTool");
const SegmentTool_1 = require("./SegmentTool");
const SelectTool_1 = require("./SelectTool");
const TextTool_1 = require("./TextTool");
const TrimTool_1 = require("./TrimTool");
const VectorTool_1 = require("./VectorTool");
const ToolContext_1 = require("./ToolContext");
const defaultTools = [
    SelectTool_1.selectTool,
    MoveTool_1.moveTool,
    PointTool_1.pointTool,
    SegmentTool_1.segmentTool,
    LineTool_1.lineTool,
    RayTool_1.rayTool,
    VectorTool_1.vectorTool,
    CircleTool_1.circleTool,
    PolygonTool_1.polygonTool,
    AngleTool_1.angleTool,
    TextTool_1.textTool,
    TrimTool_1.trimTool,
    FillTool_1.fillTool,
    MeasurementTool_1.measurementTool,
    MidpointTool_1.midpointTool,
    IntersectionTool_1.intersectionTool,
    ParallelLineTool_1.parallelLineTool,
    PerpendicularLineTool_1.perpendicularLineTool,
    AdvancedConstructionTools_1.perpendicularBisectorTool,
    AdvancedConstructionTools_1.angleBisectorTool,
    AdvancedConstructionTools_1.medianTool,
    AdvancedConstructionTools_1.altitudeTool,
    AdvancedConstructionTools_1.circumcircleTool,
    AdvancedConstructionTools_1.incircleTool,
];
class ToolManager {
    tools = new Map();
    constructor(tools = defaultTools) {
        tools.forEach((tool) => {
            this.registerTool(tool);
        });
    }
    registerTool(tool) {
        this.tools.set(tool.id, tool);
    }
    getActiveTool(context = (0, ToolContext_1.createToolContext)()) {
        return this.getTool(context.activeTool);
    }
    getTool(toolId) {
        const fallbackTool = defaultTools[0];
        if (!fallbackTool) {
            throw new Error("ToolManager requires at least one fallback tool.");
        }
        return this.tools.get(toolId) ?? this.tools.get("select") ?? fallbackTool;
    }
    activateTool(toolId) {
        const currentContext = (0, ToolContext_1.createToolContext)();
        const currentTool = this.getActiveTool(currentContext);
        if (currentTool.id === toolId) {
            return;
        }
        currentTool.deactivate(currentContext);
        currentContext.setActiveTool(toolId);
        const nextContext = (0, ToolContext_1.createToolContext)();
        this.getTool(toolId).activate(nextContext);
    }
    pointerDown(event) {
        const context = (0, ToolContext_1.createToolContext)();
        this.getActiveTool(context).pointerDown(event, context);
    }
    pointerMove(event) {
        const context = (0, ToolContext_1.createToolContext)();
        this.getActiveTool(context).pointerMove(event, context);
    }
    pointerUp(event) {
        const context = (0, ToolContext_1.createToolContext)();
        this.getActiveTool(context).pointerUp(event, context);
    }
    keyDown(event) {
        const context = (0, ToolContext_1.createToolContext)();
        this.getActiveTool(context).keyDown(event, context);
    }
    cancel() {
        const context = (0, ToolContext_1.createToolContext)();
        this.getActiveTool(context).cancel(context);
    }
    renderPreview(context = (0, ToolContext_1.createToolContext)()) {
        return this.getActiveTool(context).renderPreview(context);
    }
}
exports.ToolManager = ToolManager;
exports.toolManager = new ToolManager();
