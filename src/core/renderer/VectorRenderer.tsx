import type { PointObject, VectorObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
}

export const VectorRenderer: GeometryRenderer<VectorObject> = {
  objectType: "vector",
  render: (object, context) => {
    const start = getPoint(object.startPointId, context);
    const end = getPoint(object.endPointId, context);

    if (!start || !end) {
      return null;
    }

    const startScreen = worldToScreen(start, context.viewport);
    const endScreen = worldToScreen(end, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <line
            markerEnd="url(#ndv-vector-selection-arrow)"
            x1={startScreen.x}
            x2={endScreen.x}
            y1={startScreen.y}
            y2={endScreen.y}
            stroke="#7ddcff"
            strokeLinecap="round"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <line
            markerEnd="url(#ndv-vector-selection-arrow)"
            x1={startScreen.x}
            x2={endScreen.x}
            y1={startScreen.y}
            y2={endScreen.y}
            stroke="#a8f0ff"
            strokeLinecap="round"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <line
          markerEnd="url(#ndv-vector-arrow)"
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
