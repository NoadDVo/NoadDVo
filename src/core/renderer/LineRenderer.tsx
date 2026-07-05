import type { LineObject, Point2D, PointObject } from "../geometry";
import { pointsAlmostEqual } from "../geometry";
import { getViewportWorldBounds, worldToScreen } from "../geometry/viewport";
import type { WorldBounds } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
}

function isInsideBounds(point: Point2D, bounds: WorldBounds): boolean {
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

function clipLineToBounds(a: Point2D, b: Point2D, bounds: WorldBounds) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const points: Point2D[] = [];

  if (Math.abs(dx) > 1e-10) {
    const leftT = (bounds.minX - a.x) / dx;
    const rightT = (bounds.maxX - a.x) / dx;

    uniquePush(points, { x: bounds.minX, y: a.y + leftT * dy });
    uniquePush(points, { x: bounds.maxX, y: a.y + rightT * dy });
  }

  if (Math.abs(dy) > 1e-10) {
    const bottomT = (bounds.minY - a.y) / dy;
    const topT = (bounds.maxY - a.y) / dy;

    uniquePush(points, { x: a.x + bottomT * dx, y: bounds.minY });
    uniquePush(points, { x: a.x + topT * dx, y: bounds.maxY });
  }

  const visiblePoints = points.filter((point) => isInsideBounds(point, bounds));
  const firstPoint = visiblePoints[0];
  const secondPoint = visiblePoints[1];

  return firstPoint && secondPoint ? [firstPoint, secondPoint] as const : null;
}

function getDashArray(dash: LineObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "12 10";
  }

  if (dash === "dotted") {
    return "2 8";
  }

  return undefined;
}

export const LineRenderer: GeometryRenderer<LineObject> = {
  objectType: "line",
  render: (object, context) => {
    const pointA = getPoint(object.pointAId, context);
    const pointB = getPoint(object.pointBId, context);

    if (!pointA || !pointB) {
      return null;
    }

    const clippedLine = clipLineToBounds(
      pointA,
      pointB,
      getViewportWorldBounds(context.viewport),
    );

    if (!clippedLine) {
      return null;
    }

    const start = worldToScreen(clippedLine[0], context.viewport);
    const end = worldToScreen(clippedLine[1], context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <line
            x1={start.x}
            x2={end.x}
            y1={start.y}
            y2={end.y}
            stroke="#7ddcff"
            strokeLinecap="round"
            strokeOpacity={0.32}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <line
            x1={start.x}
            x2={end.x}
            y1={start.y}
            y2={end.y}
            stroke="#a8f0ff"
            strokeLinecap="round"
            strokeOpacity={0.2}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <line
          x1={start.x}
          x2={end.x}
          y1={start.y}
          y2={end.y}
          stroke={object.style.stroke}
          strokeDasharray={getDashArray(object.style.dash)}
          strokeLinecap="round"
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
