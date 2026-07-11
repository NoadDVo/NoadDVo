import type { ArcObject } from "../geometry";
import { getArcGeometry } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function getDashArray(dash: ArcObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "10 8";
  }

  if (dash === "dotted") {
    return "2 7";
  }

  return undefined;
}

export const ArcRenderer: GeometryRenderer<ArcObject> = {
  objectType: "arc",
  render: (object, context) => {
    const geometry = getArcGeometry(object, context.objects);

    if (!geometry) {
      return null;
    }

    const start = worldToScreen(geometry.startPoint, context.viewport);
    const end = worldToScreen(geometry.endPoint, context.viewport);
    const radius = geometry.radius * context.viewport.scale;
    const delta =
      object.direction === "counterclockwise"
        ? (geometry.endAngleDegrees - geometry.startAngleDegrees + 360) % 360
        : (geometry.startAngleDegrees - geometry.endAngleDegrees + 360) % 360;
    const largeArcFlag = delta > 180 ? 1 : 0;
    const sweepFlag = object.direction === "counterclockwise" ? 0 : 1;
    const path = `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <path
            d={path}
            fill="none"
            stroke="#7ddcff"
            strokeLinecap="round"
            strokeOpacity={0.36}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <path
            d={path}
            fill="none"
            stroke="#a8f0ff"
            strokeLinecap="round"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <path
          d={path}
          fill="none"
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
