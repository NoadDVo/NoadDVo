import type { PointerEvent, WheelEvent } from "react";

import { createToolContext, createToolPointerEvent, type ToolPointerEvent } from "../../../core/tools/ToolContext";

export function getLocalPoint(
  event: PointerEvent<HTMLElement> | WheelEvent<HTMLElement>,
  element: HTMLElement,
) {
  const rect = element.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function getToolPointerEvent(
  event: PointerEvent<HTMLElement>,
  element: HTMLElement,
): ToolPointerEvent {
  return createToolPointerEvent(
    {
      altKey: event.altKey,
      button: event.button,
      buttons: event.buttons,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pointerId: event.pointerId,
      screenPoint: getLocalPoint(event, element),
      shiftKey: event.shiftKey,
    },
    createToolContext(),
  );
}

