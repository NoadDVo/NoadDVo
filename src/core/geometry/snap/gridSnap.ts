import type { Point2D } from "../types";

export function snapToGrid(point: Point2D, gridSize: number, snapRadiusWorld = 0): Point2D {
  if (gridSize <= 0) {
    return point;
  }

  const snappedX = Math.round(point.x / gridSize) * gridSize;
  const snappedY = Math.round(point.y / gridSize) * gridSize;

  if (snapRadiusWorld > 0) {
    const distance = Math.sqrt(Math.pow(snappedX - point.x, 2) + Math.pow(snappedY - point.y, 2));
    if (distance > snapRadiusWorld) {
      return point;
    }
  }

  return {
    x: snappedX,
    y: snappedY,
  };
}
