import type { Point2D, ScreenPoint } from "../types";

export type Viewport = {
  readonly scale: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;
};

export type WorldBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export const DEFAULT_VIEWPORT: Viewport = {
  scale: 48,
  offsetX: 0,
  offsetY: 0,
  width: 1,
  height: 1,
};

export const MIN_VIEWPORT_SCALE = 8;
export const MAX_VIEWPORT_SCALE = 320;

export function clampScale(scale: number): number {
  return Math.min(MAX_VIEWPORT_SCALE, Math.max(MIN_VIEWPORT_SCALE, scale));
}

export function worldToScreen(
  point: Point2D,
  viewport: Viewport,
): ScreenPoint {
  return {
    x: viewport.width / 2 + viewport.offsetX + point.x * viewport.scale,
    y: viewport.height / 2 + viewport.offsetY - point.y * viewport.scale,
  };
}

export function screenToWorld(
  point: ScreenPoint,
  viewport: Viewport,
): Point2D {
  return {
    x: (point.x - viewport.width / 2 - viewport.offsetX) / viewport.scale,
    y: -(point.y - viewport.height / 2 - viewport.offsetY) / viewport.scale,
  };
}

export function getViewportWorldBounds(viewport: Viewport): WorldBounds {
  const topLeft = screenToWorld({ x: 0, y: 0 }, viewport);
  const bottomRight = screenToWorld(
    { x: viewport.width, y: viewport.height },
    viewport,
  );

  return {
    minX: Math.min(topLeft.x, bottomRight.x),
    maxX: Math.max(topLeft.x, bottomRight.x),
    minY: Math.min(topLeft.y, bottomRight.y),
    maxY: Math.max(topLeft.y, bottomRight.y),
  };
}

export function zoomViewportAtScreenPoint(
  viewport: Viewport,
  screenPoint: ScreenPoint,
  zoomFactor: number,
): Viewport {
  const worldPoint = screenToWorld(screenPoint, viewport);
  const scale = clampScale(viewport.scale * zoomFactor);

  return {
    ...viewport,
    scale,
    offsetX: screenPoint.x - viewport.width / 2 - worldPoint.x * scale,
    offsetY: screenPoint.y - viewport.height / 2 + worldPoint.y * scale,
  };
}

export function panViewport(
  viewport: Viewport,
  delta: ScreenPoint,
): Viewport {
  return {
    ...viewport,
    offsetX: viewport.offsetX + delta.x,
    offsetY: viewport.offsetY + delta.y,
  };
}

export function resizeViewport(
  viewport: Viewport,
  width: number,
  height: number,
): Viewport {
  return {
    ...viewport,
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}
