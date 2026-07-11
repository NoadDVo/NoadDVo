import {
  getTextAlignment,
  getTextFontSize,
  getTextOpacity,
  getTextPosition,
  getTextRotation,
  type TextObject,
} from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function svgAnchor(alignment: ReturnType<typeof getTextAlignment>): "start" | "middle" | "end" {
  if (alignment === "center") {
    return "middle";
  }

  return alignment === "right" ? "end" : "start";
}

function displayText(object: TextObject): string {
  if (object.textMode === "math" && object.content.startsWith("$") && object.content.endsWith("$")) {
    return object.content.slice(1, -1);
  }

  return object.content;
}

export const TextRenderer: GeometryRenderer<TextObject> = {
  objectType: "text",
  render: (object, context) => {
    const position = getTextPosition(object, context.objects);
    const screen = worldToScreen(position, context.viewport);
    const fontSize = getTextFontSize(object);
    const rotation = getTextRotation(object);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const text = displayText(object);
    const width = Math.max(36, text.length * fontSize * 0.62);
    const height = fontSize * 1.5;
    const x = screen.x;
    const y = screen.y;

    return (
      <g
        data-object-id={object.id}
        data-object-type={object.type}
        transform={`rotate(${rotation} ${x} ${y})`}
      >
        {(isSelected || isHovered) && (
          <rect
            x={x - 6}
            y={y - height + 4}
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
          x={x}
          y={y}
          dominantBaseline="alphabetic"
          fill={object.style.stroke}
          fillOpacity={getTextOpacity(object)}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={fontSize}
          fontWeight={object.textMode === "plain" ? 500 : 600}
          pointerEvents="none"
          textAnchor={svgAnchor(getTextAlignment(object))}
        >
          {text}
        </text>
      </g>
    );
  },
};
