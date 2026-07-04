import type { GeometryToolId } from "../geometry";
import { BaseTool } from "./BaseTool";
import { pointTool } from "./PointTool";
import type { Tool } from "./Tool";
import {
  createToolContext,
  type ToolContext,
  type ToolPointerEvent,
} from "./ToolContext";

const defaultTools = [
  new BaseTool({ cursor: "default", id: "select", name: "Select", shortcut: "V" }),
  new BaseTool({ cursor: "grab", id: "move", name: "Move", shortcut: "M" }),
  pointTool,
  new BaseTool({ id: "segment", name: "Segment", shortcut: "S" }),
  new BaseTool({ id: "line", name: "Line", shortcut: "L" }),
  new BaseTool({ id: "ray", name: "Ray", shortcut: "R" }),
  new BaseTool({ id: "vector", name: "Vector", shortcut: "X" }),
  new BaseTool({ id: "circle", name: "Circle", shortcut: "C" }),
  new BaseTool({ id: "polygon", name: "Polygon", shortcut: "G" }),
  new BaseTool({ id: "angle", name: "Angle", shortcut: "A" }),
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

  cancel(): void {
    const context = createToolContext();

    this.getActiveTool(context).cancel(context);
  }

  renderPreview(context: ToolContext = createToolContext()) {
    return this.getActiveTool(context).renderPreview(context);
  }
}

export const toolManager = new ToolManager();
