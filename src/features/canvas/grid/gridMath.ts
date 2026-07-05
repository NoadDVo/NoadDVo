import { getViewportWorldBounds, worldToScreen } from "../../../core/geometry/viewport";
import type { Viewport } from "../../../core/geometry/viewport";

export type GridLine = {
  readonly id: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly major: boolean;
};

const GRID_TARGET_PX = 36;

function getNiceStep(rawStep: number): number {
  const exponent = Math.floor(Math.log10(rawStep));
  const magnitude = 10 ** exponent;
  const normalized = rawStep / magnitude;

  if (normalized <= 1) {
    return magnitude;
  }

  if (normalized <= 2) {
    return 2 * magnitude;
  }

  if (normalized <= 5) {
    return 5 * magnitude;
  }

  return 10 * magnitude;
}

export function getGridStep(viewport: Viewport): number {
  return getNiceStep(GRID_TARGET_PX / viewport.scale);
}

export function createGridLines(viewport: Viewport): readonly GridLine[] {
  const bounds = getViewportWorldBounds(viewport);
  const step = getGridStep(viewport);
  const startX = Math.floor(bounds.minX / step) * step;
  const endX = Math.ceil(bounds.maxX / step) * step;
  const startY = Math.floor(bounds.minY / step) * step;
  const endY = Math.ceil(bounds.maxY / step) * step;
  const lines: GridLine[] = [];

  for (let x = startX; x <= endX; x += step) {
    const screen = worldToScreen({ x, y: 0 }, viewport);
    const index = Math.round(x / step);

    lines.push({
      id: `x-${x.toFixed(6)}`,
      major: index % 5 === 0,
      x1: screen.x,
      x2: screen.x,
      y1: 0,
      y2: viewport.height,
    });
  }

  for (let y = startY; y <= endY; y += step) {
    const screen = worldToScreen({ x: 0, y }, viewport);
    const index = Math.round(y / step);

    lines.push({
      id: `y-${y.toFixed(6)}`,
      major: index % 5 === 0,
      x1: 0,
      x2: viewport.width,
      y1: screen.y,
      y2: screen.y,
    });
  }

  return lines;
}
