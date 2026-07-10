import type { SliderObject } from "../geometry/types";
import { worldToScreen } from "../geometry/viewport";
import { HIT_RADIUS } from "../selection/HitTest";
import type { GeometryRenderer } from "./RendererRegistry";

export const SliderRenderer: GeometryRenderer<SliderObject> = {
  objectType: "slider",
  render: (object, context) => {
    const trackStart = worldToScreen({ x: object.x, y: object.y }, context.viewport);
    const trackEnd = { x: trackStart.x + object.widthPx, y: trackStart.y };
    
    const ratio = (object.value - object.min) / (object.max - object.min);
    const knobX = trackStart.x + object.widthPx * ratio;
    
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    const strokeColor = isSelected ? "#3b82f6" : isHovered ? "#64748b" : object.style.stroke;
    const strokeWidth = object.style.strokeWidth;
    const knobRadius = HIT_RADIUS;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {/* Track line */}
        <line
          x1={trackStart.x}
          y1={trackStart.y}
          x2={trackEnd.x}
          y2={trackEnd.y}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={object.style.strokeOpacity}
          strokeLinecap="round"
        />
        {/* Knob */}
        <circle
          cx={knobX}
          cy={trackStart.y}
          r={knobRadius}
          fill="#ffffff"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
        {/* Label */}
        {object.style.labelVisible && (
          <text
            x={trackStart.x}
            y={trackStart.y - 12}
            fill={strokeColor}
            fontSize={object.style.labelSize}
            fontFamily="sans-serif"
          >
            {object.variableName} = {object.value.toFixed(2)}
          </text>
        )}
      </g>
    );
  },
};
