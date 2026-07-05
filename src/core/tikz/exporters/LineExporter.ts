import type { LineObject, Point2D, PointObject } from "../../geometry";
import { pointsAlmostEqual } from "../../geometry";
import {
  formatPoint,
  formatStyleOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

type Bounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

const exportBounds: Bounds = {
  maxX: 10,
  maxY: 10,
  minX: -10,
  minY: -10,
};

function getPoint(objectId: string, context: TikzExportContext) {
  const object = context.scene.objects[objectId];

  return object?.type === "point" ? object : null;
}

function isInsideBounds(point: Point2D, bounds: Bounds): boolean {
  const tolerance = 1e-8;

  return (
    point.x >= bounds.minX - tolerance &&
    point.x <= bounds.maxX + tolerance &&
    point.y >= bounds.minY - tolerance &&
    point.y <= bounds.maxY + tolerance
  );
}

function uniquePush(points: Point2D[], point: Point2D): void {
  if (!points.some((candidate) => pointsAlmostEqual(candidate, point))) {
    points.push(point);
  }
}

function clipLineToBounds(pointA: Point2D, pointB: Point2D, bounds: Bounds) {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const points: Point2D[] = [];

  if (Math.abs(dx) > 1e-10) {
    const leftT = (bounds.minX - pointA.x) / dx;
    const rightT = (bounds.maxX - pointA.x) / dx;

    uniquePush(points, { x: bounds.minX, y: pointA.y + leftT * dy });
    uniquePush(points, { x: bounds.maxX, y: pointA.y + rightT * dy });
  }

  if (Math.abs(dy) > 1e-10) {
    const bottomT = (bounds.minY - pointA.y) / dy;
    const topT = (bounds.maxY - pointA.y) / dy;

    uniquePush(points, { x: pointA.x + bottomT * dx, y: bounds.minY });
    uniquePush(points, { x: pointA.x + topT * dx, y: bounds.maxY });
  }

  const visiblePoints = points.filter((point) => isInsideBounds(point, bounds));
  const first = visiblePoints[0];
  const second = visiblePoints[1];

  return first && second ? [first, second] as const : null;
}

export const LineExporter: TikzObjectExporter<LineObject> = {
  exportObject: (object, context) => {
    const pointA = getPoint(object.pointAId, context) as PointObject | null;
    const pointB = getPoint(object.pointBId, context) as PointObject | null;

    if (!pointA || !pointB) {
      return;
    }

    const clipped = clipLineToBounds(pointA, pointB, exportBounds);

    if (!clipped) {
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const start = formatPoint(clipped[0], context.options.coordinatePrecision);
    const end = formatPoint(clipped[1], context.options.coordinatePrecision);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} ${start} -- ${end};`,
    );
  },
  objectType: "line",
};
