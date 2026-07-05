import {
  angleRadians,
  isRightAngle,
  normalize,
  scaleVector,
  vectorFromPoints,
  type AngleObject,
  type Point2D,
  type PointObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function getPoint(objectId: string, context: Parameters<GeometryRenderer["render"]>[1]) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object : null;
}

function polarAngle(point: Point2D, vertex: Point2D): number {
  return Math.atan2(point.y - vertex.y, point.x - vertex.x);
}

function normalizeDelta(delta: number): number {
  let nextDelta = delta;

  while (nextDelta <= -Math.PI) {
    nextDelta += Math.PI * 2;
  }

  while (nextDelta > Math.PI) {
    nextDelta -= Math.PI * 2;
  }

  return nextDelta;
}

function createArcPoints(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  radius: number,
): readonly Point2D[] {
  const start = polarAngle(pointA, vertex);
  const delta = normalizeDelta(polarAngle(pointC, vertex) - start);
  const steps = Math.max(8, Math.ceil((Math.abs(delta) * 180) / Math.PI / 10));

  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = start + (delta * index) / steps;

    return {
      x: vertex.x + Math.cos(angle) * radius,
      y: vertex.y + Math.sin(angle) * radius,
    };
  });
}

function createArcPath(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  radius: number,
  context: Parameters<GeometryRenderer["render"]>[1],
): string {
  return createArcPoints(pointA, vertex, pointC, radius)
    .map((point, index) => {
      const screen = worldToScreen(point, context.viewport);

      return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
    })
    .join(" ");
}

function labelPoint(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  radius: number,
): Point2D {
  const start = polarAngle(pointA, vertex);
  const delta = normalizeDelta(polarAngle(pointC, vertex) - start);
  const angle = start + delta / 2;

  return {
    x: vertex.x + Math.cos(angle) * radius,
    y: vertex.y + Math.sin(angle) * radius,
  };
}

function rightAngleMarkerPath(
  pointA: PointObject,
  vertex: PointObject,
  pointC: PointObject,
  radius: number,
  context: Parameters<GeometryRenderer["render"]>[1],
): string {
  const vectorA = normalize(vectorFromPoints(vertex, pointA));
  const vectorC = normalize(vectorFromPoints(vertex, pointC));
  const markerSize = radius * 0.48;
  const first = {
    x: vertex.x + scaleVector(vectorA, markerSize).x,
    y: vertex.y + scaleVector(vectorA, markerSize).y,
  };
  const corner = {
    x: first.x + scaleVector(vectorC, markerSize).x,
    y: first.y + scaleVector(vectorC, markerSize).y,
  };
  const second = {
    x: vertex.x + scaleVector(vectorC, markerSize).x,
    y: vertex.y + scaleVector(vectorC, markerSize).y,
  };
  const screenFirst = worldToScreen(first, context.viewport);
  const screenCorner = worldToScreen(corner, context.viewport);
  const screenSecond = worldToScreen(second, context.viewport);

  return `M ${screenFirst.x} ${screenFirst.y} L ${screenCorner.x} ${screenCorner.y} L ${screenSecond.x} ${screenSecond.y}`;
}

export const AngleRenderer: GeometryRenderer<AngleObject> = {
  objectType: "angle",
  render: (object, context) => {
    const pointA = getPoint(object.pointAId, context);
    const vertex = getPoint(object.vertexPointId, context);
    const pointC = getPoint(object.pointCId, context);

    if (!pointA || !vertex || !pointC) {
      return null;
    }

    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const radius = Math.max(0.15, object.radius);
    const stroke = isSelected ? "#7ddcff" : object.style.stroke;
    const strokeWidth = object.style.strokeWidth + (isSelected ? 1.25 : 0);
    const label = object.label ?? object.name;
    const labelScreen = worldToScreen(
      labelPoint(pointA, vertex, pointC, radius * 1.34),
      context.viewport,
    );
    const isRight = isRightAngle(pointA, vertex, pointC);
    const arcPath = createArcPath(pointA, vertex, pointC, radius, context);

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {(isSelected || isHovered) && (
          <path
            className={isSelected ? "ndv-selection-glow" : undefined}
            d={arcPath}
            fill="none"
            stroke={isSelected ? "#7ddcff" : "#a8f0ff"}
            strokeLinecap="round"
            strokeOpacity={isSelected ? 0.42 : 0.24}
            strokeWidth={strokeWidth + 6}
          />
        )}
        {isRight ? (
          <path
            d={rightAngleMarkerPath(pointA, vertex, pointC, radius, context)}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={object.style.strokeOpacity}
            strokeWidth={strokeWidth}
          />
        ) : (
          <path
            d={arcPath}
            fill="none"
            stroke={stroke}
            strokeLinecap="round"
            strokeOpacity={object.style.strokeOpacity}
            strokeWidth={strokeWidth}
          />
        )}
        {object.style.labelVisible && label && (
          <text
            fill="#0b0f14"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize={object.style.labelSize ?? 13}
            fontWeight={800}
            paintOrder="stroke"
            stroke="#f2f7fa"
            strokeWidth={3}
            textAnchor="middle"
            x={labelScreen.x}
            y={labelScreen.y}
          >
            {label}
          </text>
        )}
        {isSelected && (
          <circle
            cx={worldToScreen(vertex, context.viewport).x}
            cy={worldToScreen(vertex, context.viewport).y}
            fill="#7ddcff"
            fillOpacity={0.18}
            r={4}
          />
        )}
        <title>{`${label ?? "Angle"} ${Math.round((angleRadians(pointA, vertex, pointC) * 180) / Math.PI)} degrees`}</title>
      </g>
    );
  },
};
