import type { GeometryObject, PointObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRendererContext } from "./RendererRegistry";

export function getRendererPoint(
  objectId: string,
  context: GeometryRendererContext,
): PointObject | null {
  const object = context.objects[objectId];

  return object?.type === "point" ? object : null;
}

function getDashArray(dash: GeometryObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "10 8";
  }

  if (dash === "dotted") {
    return "2 7";
  }

  return undefined;
}

export function renderSegmentLike({
  context,
  end,
  markerEnd,
  object,
  selectionMarkerEnd,
  start,
}: {
  readonly context: GeometryRendererContext;
  readonly end: PointObject;
  readonly markerEnd?: string;
  readonly object: GeometryObject;
  readonly selectionMarkerEnd?: string;
  readonly start: PointObject;
}) {
  const startScreen = worldToScreen(start, context.viewport);
  const endScreen = worldToScreen(end, context.viewport);
  const isSelected = context.selectedObjectIds.includes(object.id);
  const isHovered = context.hoveredObjectId === object.id && !isSelected;

  return (
    <g data-object-id={object.id} data-object-type={object.type}>
      {isSelected && (
        <line
          markerEnd={selectionMarkerEnd}
          x1={startScreen.x}
          x2={endScreen.x}
          y1={startScreen.y}
          y2={endScreen.y}
          stroke="#7ddcff"
          strokeLinecap="round"
          strokeOpacity={0.38}
          strokeWidth={object.style.strokeWidth + 8}
        />
      )}
      {isHovered && (
        <line
          markerEnd={selectionMarkerEnd}
          x1={startScreen.x}
          x2={endScreen.x}
          y1={startScreen.y}
          y2={endScreen.y}
          stroke="#a8f0ff"
          strokeLinecap="round"
          strokeOpacity={0.24}
          strokeWidth={object.style.strokeWidth + 6}
        />
      )}
      <line
        markerEnd={markerEnd}
        x1={startScreen.x}
        x2={endScreen.x}
        y1={startScreen.y}
        y2={endScreen.y}
        stroke={object.style.stroke}
        strokeDasharray={getDashArray(object.style.dash)}
        strokeLinecap="round"
        strokeOpacity={object.style.strokeOpacity}
        strokeWidth={object.style.strokeWidth}
      />
    </g>
  );
}
