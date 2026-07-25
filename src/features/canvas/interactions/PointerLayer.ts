import type { PointerEvent, WheelEvent } from "react";

import { createToolContext, createToolPointerEvent, type ToolPointerEvent } from "../../../core/tools/ToolContext";

export function getLocalPoint(
  event: PointerEvent<Element> | WheelEvent<Element>,
  element: Element,
) {
  return getCanvasLocalPoint(event, element);
}

export function getCanvasLocalPoint(
  event: PointerEvent<Element> | WheelEvent<Element>,
  element: Element,
) {
  const rect = element.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function getToolPointerEvent(
  event: PointerEvent<Element>,
  element: Element,
): ToolPointerEvent {
  return createToolPointerEvent(
    {
      altKey: event.altKey,
      button: event.button,
      buttons: event.buttons,
      clickCount: event.detail || 1, // detail contains the click count for pointer/mouse events
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      pointerId: event.pointerId,
      screenPoint: getLocalPoint(event, element),
      shiftKey: event.shiftKey,
    },
    createToolContext(),
  );
}
