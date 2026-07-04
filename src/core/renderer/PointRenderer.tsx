import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const PointRenderer: GeometryRenderer<import("../geometry").PointObject> = {
  objectType: "point",
  render: (object, context) => {
    const point = worldToScreen(object, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const radius = object.style.pointSize;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <circle
            className="ndv-selection-glow"
            cx={point.x}
            cy={point.y}
            fill="none"
            r={radius + 7}
            stroke="#7ddcff"
            strokeOpacity={0.42}
            strokeWidth={3}
          />
        )}
        <circle
          cx={point.x}
          cy={point.y}
          fill={object.style.fill === "transparent" ? "#f4fbff" : object.style.fill}
          fillOpacity={object.style.fill === "transparent" ? 1 : object.style.fillOpacity}
          r={radius}
          stroke={object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
        {object.style.labelVisible && object.name && (
          <text
            fill="#dff6ff"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize={12}
            fontWeight={700}
            paintOrder="stroke"
            stroke="#08111a"
            strokeWidth={3}
            x={point.x + radius + 8}
            y={point.y - radius - 6}
          >
            {object.name}
          </text>
        )}
      </g>
    );
  },
};
