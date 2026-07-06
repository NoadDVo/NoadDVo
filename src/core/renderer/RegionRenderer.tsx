import type { PointObject, RegionObject } from "../geometry";
import { getPolygonPoints } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function screenPath(points: readonly PointObject[], context: GeometryRendererContext): string {
  return `${points
    .map((point, index) => {
      const screenPoint = worldToScreen(point, context.viewport);

      return `${index === 0 ? "M" : "L"} ${screenPoint.x} ${screenPoint.y}`;
    })
    .join(" ")} Z`;
}

export const RegionRenderer: GeometryRenderer<RegionObject> = {
  objectType: "region",
  render: (object, context) => {
    const points = getPolygonPoints(object, context.objects);

    if (!points || points.length < 3) {
      return null;
    }

    const path = screenPath(points, context);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <path
            d={path}
            fill="#7ddcff"
            fillOpacity={0.1}
            stroke="#7ddcff"
            strokeLinejoin="round"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        {isHovered && (
          <path
            d={path}
            fill="#a8f0ff"
            fillOpacity={0.08}
            stroke="#a8f0ff"
            strokeLinejoin="round"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 4}
          />
        )}
        <path
          d={path}
          fill={object.style.fill === "transparent" ? object.style.stroke : object.style.fill}
          fillOpacity={
            object.style.fill === "transparent"
              ? Math.max(0.12, object.style.fillOpacity)
              : object.style.fillOpacity
          }
          stroke={object.style.stroke}
          strokeLinejoin="round"
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
