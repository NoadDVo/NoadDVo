import type { EllipseObject } from "../geometry/types";
import { getEllipseGeometry } from "../geometry/conicGeometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const EllipseRenderer: GeometryRenderer<EllipseObject> = {
  objectType: "ellipse",
  render: (object, context) => {
    const geometry = getEllipseGeometry(object, context.objects);

    if (!geometry) {
      return null;
    }

    const center = worldToScreen(geometry.center, context.viewport);
    const rx = geometry.rx * context.viewport.scale;
    const ry = geometry.ry * context.viewport.scale;
    
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    const transform = `rotate(${-geometry.angleDegrees}, ${center.x}, ${center.y})`;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#7ddcff"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 8}
            transform={transform}
          />
        )}
        {isHovered && (
          <ellipse
            cx={center.x}
            cy={center.y}
            rx={rx}
            ry={ry}
            fill="none"
            stroke="#a8f0ff"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
            transform={transform}
          />
        )}
        <ellipse
          cx={center.x}
          cy={center.y}
          rx={rx}
          ry={ry}
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
          stroke={object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
          transform={transform}
        />
      </g>
    );
  },
};
