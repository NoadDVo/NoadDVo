import {
  DEFAULT_GEOMETRY_STYLE,
  type AreaObject,
} from "../geometry";
import { hitTest } from "../selection/HitTest";
import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let areaIdCounter = 0;

function createAreaId(): string {
  areaIdCounter += 1;
  return `area-${Date.now().toString(36)}-${areaIdCounter}`;
}

export class AreaTool extends BaseTool {
  constructor() {
    super({
      cursor: "crosshair",
      id: "area",
      name: "Area",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );

    const target = hit?.object;

    if (!target || target.type !== "polygon") {
      this.transitionState("cancelled", "cancel");
      return;
    }

    const now = Date.now();
    const area: AreaObject = {
      createdAt: now,
      dependencies: [target.id],
      dependents: [],
      id: createAreaId(),
      labelPosition: "above",
      locked: false,
      polygonId: target.id,
      precision: 2,
      style: {
        ...DEFAULT_GEOMETRY_STYLE,
        labelSize: 13,
        stroke: "#0b0f14",
        strokeOpacity: 1,
      },
      type: "area",
      updatedAt: now,
      visible: true,
    };

    if (context.addObject(area)) {
      context.selectObject(area.id);
      context.setHoveredObject(area.id);
      this.transitionState("completed", "complete");
      this.transitionState("waitingInput", "await-input");
    }
  }

  pointerMove(event: ToolPointerEvent, context: ToolContext): void {
    const hit = hitTest(
      event.screenPoint,
      event.worldPoint,
      context.objects,
      context.viewport,
    );
    context.setHoveredObject(hit?.object.id ?? null);
  }
}

export const areaTool = new AreaTool();
