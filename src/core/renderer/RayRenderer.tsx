import type { Point2D, PointObject, RayObject } from "../geometry";
import { getViewportWorldBounds, worldToScreen } from "../geometry/viewport";
import type { WorldBounds } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

type Candidate = Point2D & {
  readonly t: number;
};

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

function collectCandidate(
  candidates: Candidate[],
  point: Candidate,
  bounds: WorldBounds,
): void {
  if (point.t < 0 || !isInsideBounds(point, bounds)) {
    return;
  }

  if (!candidates.some((candidate) => Math.abs(candidate.t - point.t) < 1e-8)) {
    candidates.push(point);
  }
}

function clipRayToBounds(start: Point2D, through: Point2D, bounds: WorldBounds) {
  const dx = through.x - start.x;
  const dy = through.y - start.y;
  const candidates: Candidate[] = [];

  if (Math.abs(dx) > 1e-10) {
    const leftT = (bounds.minX - start.x) / dx;
    const rightT = (bounds.maxX - start.x) / dx;

    collectCandidate(
      candidates,
      { t: leftT, x: bounds.minX, y: start.y + leftT * dy },
      bounds,
    );
    collectCandidate(
      candidates,
      { t: rightT, x: bounds.maxX, y: start.y + rightT * dy },
      bounds,
    );
  }

  if (Math.abs(dy) > 1e-10) {
    const bottomT = (bounds.minY - start.y) / dy;
    const topT = (bounds.maxY - start.y) / dy;

    collectCandidate(
      candidates,
      { t: bottomT, x: start.x + bottomT * dx, y: bounds.minY },
      bounds,
    );
    collectCandidate(
      candidates,
      { t: topT, x: start.x + topT * dx, y: bounds.maxY },
      bounds,
    );
  }

  const farPoint = candidates.sort((a, b) => b.t - a.t)[0];

  if (!farPoint) {
    return null;
  }

  return [start, farPoint] as const;
}

export const RayRenderer: GeometryRenderer<RayObject> = {
  objectType: "ray",
  render: (object, context) => {
    const start = getPoint(object.startPointId, context);
    const through = getPoint(object.throughPointId, context);

    if (!start || !through) {
      return null;
    }

    const clippedRay = clipRayToBounds(
      start,
      through,
      getViewportWorldBounds(context.viewport),
    );

    if (!clippedRay) {
      return null;
    }

    const startScreen = worldToScreen(clippedRay[0], context.viewport);
    const endScreen = worldToScreen(clippedRay[1], context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <line
            x1={startScreen.x}
            x2={endScreen.x}
            y1={startScreen.y}
            y2={endScreen.y}
            stroke="#7ddcff"
            strokeLinecap="round"
            strokeOpacity={0.32}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <line
            x1={startScreen.x}
            x2={endScreen.x}
            y1={startScreen.y}
            y2={endScreen.y}
            stroke="#a8f0ff"
            strokeLinecap="round"
            strokeOpacity={0.2}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <line
          x1={startScreen.x}
          x2={endScreen.x}
          y1={startScreen.y}
          y2={endScreen.y}
          stroke={object.style.stroke}
          strokeLinecap="round"
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
