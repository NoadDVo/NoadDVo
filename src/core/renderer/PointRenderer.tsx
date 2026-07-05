import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const PointRenderer: GeometryRenderer<import("../geometry").PointObject> = {
  objectType: "point",
  render: (object, context) => {
    const point = worldToScreen(object, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const radius = object.style.pointSize;
    const isDerived = object.pointKind === "derived";
    const fill =
      object.style.fill === "transparent"
        ? isDerived
          ? "#f8fafc"
          : "#0b0f14"
        : object.style.fill;
    const fillOpacity = object.style.fill === "transparent" ? 1 : object.style.fillOpacity;

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
        {isHovered && (
          <circle
            cx={point.x}
            cy={point.y}
            fill="none"
            r={radius + 5}
            stroke="#a8f0ff"
            strokeOpacity={0.28}
            strokeWidth={2}
          />
        )}
        <circle
          cx={point.x}
          cy={point.y}
          fill={fill}
          fillOpacity={fillOpacity}
          r={radius}
          stroke={isDerived ? "#747b84" : object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
        {object.locked && (
          <text
            fill="#0b0f14"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize={10}
            fontWeight={800}
            x={point.x + radius + 4}
            y={point.y + radius + 10}
          >
            L
          </text>
        )}
        {object.style.labelVisible && object.name && (
          <text
            fill="#0b0f14"
            fontFamily="Inter, ui-sans-serif, system-ui"
            fontSize={object.style.labelSize ?? 12}
            fontWeight={700}
            paintOrder="stroke"
            stroke="#f2f7fa"
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
