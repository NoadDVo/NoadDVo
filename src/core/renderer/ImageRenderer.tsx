import type { ImageObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const ImageRenderer: GeometryRenderer<ImageObject> = {
  objectType: "image",
  render: (object, context) => {
    const center = worldToScreen(object, context.viewport);
    const width = object.width * context.viewport.scale;
    const height = object.height * context.viewport.scale;
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        <image
          height={height}
          href={object.src}
          opacity={object.opacity}
          preserveAspectRatio={object.preserveAspectRatio ? "xMidYMid meet" : "none"}
          width={width}
          x={center.x - width / 2}
          y={center.y - height / 2}
        />
        {(isSelected || isHovered) && (
          <rect
            fill="none"
            height={height}
            rx={6}
            ry={6}
            stroke={isSelected ? "#7ddcff" : "#a8f0ff"}
            strokeDasharray={isSelected ? "8 5" : "5 5"}
            strokeOpacity={isSelected ? 0.8 : 0.44}
            strokeWidth={2}
            width={width}
            x={center.x - width / 2}
            y={center.y - height / 2}
          />
        )}
      </g>
    );
  },
};
