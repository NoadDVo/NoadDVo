import type { CircleObject } from "../geometry";
import { getCircleGeometry } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function getDashArray(dash: CircleObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") return "10 8";
  if (dash === "dotted") return "2 7";
  return undefined;
}

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
    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";
    const fillValue = hasPattern
      ? `url(#pattern-${object.id})`
      : object.style.fill === "transparent"
        ? "transparent"
        : object.style.fill;

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
          fill={fillValue}
          fillOpacity={object.style.fillOpacity}
          r={radius}
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
