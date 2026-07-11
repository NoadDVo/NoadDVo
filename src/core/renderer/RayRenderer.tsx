import type { PointObject, RayObject } from "../geometry";
import { clipRayToBounds, getViewportWorldBounds, worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
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
