import type { CircleObject } from "../geometry";
import { getCircleGeometry } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const CircleRenderer: GeometryRenderer<CircleObject> = {
  objectType: "circle",
  render: (object, context) => {
    const geometry = getCircleGeometry(object, context.objects);

    if (!geometry) {
      return null;
    }

    const center = worldToScreen(geometry.center, context.viewport);
    const radius = geometry.radius * context.viewport.scale;
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <circle
            cx={center.x}
            cy={center.y}
            fill="none"
            r={radius}
            stroke="#7ddcff"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <circle
            cx={center.x}
            cy={center.y}
            fill="none"
            r={radius}
            stroke="#a8f0ff"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <circle
          cx={center.x}
          cy={center.y}
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
          r={radius}
          stroke={object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
