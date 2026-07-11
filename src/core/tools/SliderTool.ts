import { BaseTool } from "./BaseTool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

let sliderIdCounter = 0;

function createSliderId(name: string): string {
  sliderIdCounter += 1;
  return `slider-${name.toLowerCase()}-${Date.now().toString(36)}-${sliderIdCounter}`;
}

export class SliderTool extends BaseTool {
  constructor() {
    super({
      cursor: "crosshair",
      id: "slider",
      name: "Slider",
    });
  }

  pointerDown(event: ToolPointerEvent, context: ToolContext): void {
    if (event.button !== 0) {
      return;
    }

    const variableName = window.prompt("Tên biến (VD: a, alpha):", "a");
    if (!variableName) return;

    const minStr = window.prompt("Giá trị nhỏ nhất (Min):", "-5");
    if (!minStr) return;
    const min = parseFloat(minStr);

    const maxStr = window.prompt("Giá trị lớn nhất (Max):", "5");
    if (!maxStr) return;
    const max = parseFloat(maxStr);

    const stepStr = window.prompt("Bước nhảy (Step):", "0.1");
    if (!stepStr) return;
    const step = parseFloat(stepStr);

    const valueStr = window.prompt("Giá trị hiện tại (Value):", "1");
    if (!valueStr) return;
    const value = parseFloat(valueStr);

    if (isNaN(min) || isNaN(max) || isNaN(step) || isNaN(value)) {
      window.alert("Giá trị nhập vào không hợp lệ!");
      return;
    }

    context.beginHistoryTransaction("create" as any, "Create slider");
    context.addObject({
      id: createSliderId(variableName),
      type: "slider",
      x: event.worldPoint.x,
      y: event.worldPoint.y,
      widthPx: 200,
      min,
      max,
      step,
      value,
      variableName,
      visible: true,
      locked: false,
      style: {
        fill: "none",
        stroke: "#0b0f14",
        strokeWidth: 2,
        strokeOpacity: 1,
        fillOpacity: 0,
        labelVisible: true,
        dash: "solid",
        pointSize: 5,
        labelPosition: "above-right",
        labelSize: 12,
      },
      dependencies: [],
      dependents: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    context.commitHistoryTransaction();
    context.setActiveTool("move");
  }
}

export const sliderTool = new SliderTool();
