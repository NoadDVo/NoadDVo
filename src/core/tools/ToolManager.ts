import type { GeometryToolId } from "../geometry";
import {
  circumcircleTool,
  incircleTool,
} from "./AdvancedConstructionTools";
import { altitudeTool, medianTool } from "./SpecialLineTool";
import { angleBisectorTool } from "./AngleBisectorTool";
import { perpendicularBisectorTool } from "./PerpendicularBisectorTool";
import { angleTool } from "./AngleTool";
import { circleTool } from "./CircleTool";
import { arcTool } from "./ArcTool";
import { ellipticalArcTool } from "./EllipticalArcTool";
import { fillTool } from "./FillTool";
import { distanceTool } from "./DistanceTool";
import { areaTool } from "./AreaTool";
import { intersectionTool } from "./IntersectionTool";
import { lineTool } from "./LineTool";
import { midpointTool } from "./MidpointTool";
import { moveTool } from "./MoveTool";
import { panTool } from "./PanTool";
import { parallelLineTool } from "./ParallelLineTool";
import { perpendicularLineTool } from "./PerpendicularLineTool";
import { pointTool } from "./PointTool";
import { polygonTool } from "./PolygonTool";
import { rayTool } from "./RayTool";
import { segmentTool } from "./SegmentTool";
import { selectTool } from "./SelectTool";
import { textTool } from "./TextTool";
import { trimTool } from "./TrimTool";
import type { Tool } from "./Tool";
import { vectorTool } from "./VectorTool";
import { reflectLineTool } from "./ReflectLineTool";
import { reflectPointTool } from "./ReflectPointTool";
import { rotatePointTool } from "./RotatePointTool";
import { translateVectorTool } from "./TranslateVectorTool";
import { dilatePointTool } from "./DilatePointTool";
import { ellipseTool } from "./EllipseTool";
import { hyperbolaTool } from "./HyperbolaTool";
import { polynomialTool } from "./PolynomialTool";
import { sliderTool } from "./SliderTool";
import {
  createToolContext,
  type ToolContext,
  type ToolPointerEvent,
} from "./ToolContext";

const defaultTools = [
  selectTool,
  moveTool,
  panTool,
  pointTool,
  segmentTool,
  lineTool,
  rayTool,
  vectorTool,
  circleTool,
  arcTool,
  ellipticalArcTool,
  polygonTool,
  angleTool,
  textTool,
  trimTool,
  fillTool,
  midpointTool,
  distanceTool,
  areaTool,
  intersectionTool,
  parallelLineTool,
  perpendicularLineTool,
  perpendicularBisectorTool,
  angleBisectorTool,
  medianTool,
  altitudeTool,
  circumcircleTool,
  incircleTool,
  reflectLineTool,
  reflectPointTool,
  rotatePointTool,
  translateVectorTool,
  dilatePointTool,
  ellipseTool,
  hyperbolaTool,
  polynomialTool,
  sliderTool,
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
