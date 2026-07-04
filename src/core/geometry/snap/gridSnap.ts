import type { Point2D } from "../types";

export function snapToGrid(point: Point2D, gridSize: number): Point2D {
  if (gridSize <= 0) {
    return point;
  }

  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}
