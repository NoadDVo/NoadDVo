import type { GeometryToolId } from "../geometry";
import { angleTool } from "./AngleTool";
import { BaseTool } from "./BaseTool";
import { circleTool } from "./CircleTool";
import { intersectionTool } from "./IntersectionTool";
import { lineTool } from "./LineTool";
import { midpointTool } from "./MidpointTool";
import { moveTool } from "./MoveTool";
import { parallelLineTool } from "./ParallelLineTool";
import { perpendicularLineTool } from "./PerpendicularLineTool";
import { pointTool } from "./PointTool";
import { polygonTool } from "./PolygonTool";
import { segmentTool } from "./SegmentTool";
import { selectTool } from "./SelectTool";
import type { Tool } from "./Tool";
import {
  createToolContext,
  type ToolContext,
  type ToolPointerEvent,
} from "./ToolContext";

const defaultTools = [
  selectTool,
  moveTool,
  pointTool,
  segmentTool,
  lineTool,
  new BaseTool({ id: "ray", name: "Ray", shortcut: "R" }),
  new BaseTool({ id: "vector", name: "Vector", shortcut: "X" }),
  circleTool,
  polygonTool,
  angleTool,
  midpointTool,
  intersectionTool,
  parallelLineTool,
  perpendicularLineTool,
] satisfies readonly Tool[];

export class ToolManager {
  private readonly tools = new Map<GeometryToolId, Tool>();

  constructor(tools: readonly Tool[] = defaultTools) {
    tools.forEach((tool) => {
      this.registerTool(tool);
    });
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  getActiveTool(context: ToolContext = createToolContext()): Tool {
    return this.getTool(context.activeTool);
  }

  getTool(toolId: GeometryToolId): Tool {
    const fallbackTool = defaultTools[0];

    if (!fallbackTool) {
      throw new Error("ToolManager requires at least one fallback tool.");
    }

    return this.tools.get(toolId) ?? this.tools.get("select") ?? fallbackTool;
  }

  activateTool(toolId: GeometryToolId): void {
    const currentContext = createToolContext();
    const currentTool = this.getActiveTool(currentContext);

    if (currentTool.id === toolId) {
      return;
    }

    currentTool.deactivate(currentContext);
    currentContext.setActiveTool(toolId);

    const nextContext = createToolContext();
    this.getTool(toolId).activate(nextContext);
  }

  pointerDown(event: ToolPointerEvent): void {
    const context = createToolContext();

    this.getActiveTool(context).pointerDown(event, context);
  }

  pointerMove(event: ToolPointerEvent): void {
    const context = createToolContext();

    this.getActiveTool(context).pointerMove(event, context);
  }

  pointerUp(event: ToolPointerEvent): void {
    const context = createToolContext();

    this.getActiveTool(context).pointerUp(event, context);
  }

  keyDown(event: KeyboardEvent): void {
    const context = createToolContext();

    this.getActiveTool(context).keyDown(event, context);
  }

  cancel(): void {
    const context = createToolContext();

    this.getActiveTool(context).cancel(context);
  }

  renderPreview(context: ToolContext = createToolContext()) {
    return this.getActiveTool(context).renderPreview(context);
  }
}

export const toolManager = new ToolManager();
