import type { LineObject, PointObject } from "../geometry";
import { clipLineToBounds, getViewportWorldBounds, worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
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
