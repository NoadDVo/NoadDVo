import {
  formatMeasurementValue,
  getMeasurementAnchorPoint,
  type MeasurementObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const MeasurementRenderer: GeometryRenderer<MeasurementObject> = {
  objectType: "measurement",
  render: (object, context) => {
    const position = worldToScreen(
      getMeasurementAnchorPoint(object, context.objects),
      context.viewport,
    );
    const value = formatMeasurementValue(object, context.objects);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const fontSize = object.style.labelSize;
    const width = Math.max(32, value.length * fontSize * 0.62);
    const height = fontSize * 1.45;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {(isSelected || isHovered) && (
          <rect
            x={position.x - width / 2 - 6}
            y={position.y - height + 4}
            width={width + 12}
            height={height}
            rx={4}
            fill={isSelected ? "#7ddcff" : "#a8f0ff"}
            fillOpacity={isSelected ? 0.12 : 0.07}
            stroke={isSelected ? "#7ddcff" : "#a8f0ff"}
            strokeOpacity={isSelected ? 0.72 : 0.35}
          />
        )}
        <text
          x={position.x}
          y={position.y}
          dominantBaseline="alphabetic"
          fill={object.style.stroke}
          fillOpacity={object.style.strokeOpacity}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={fontSize}
          fontWeight={600}
          pointerEvents="none"
          textAnchor="middle"
        >
          {value}
        </text>
      </g>
    );
  },
};
