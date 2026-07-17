import type { EllipticalArcObject } from "../geometry";
import { getEllipticalArcGeometry } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function getDashArray(dash: EllipticalArcObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "10 8";
  }

  if (dash === "dotted") {
    return "2 7";
  }

  return undefined;
}

export const EllipticalArcRenderer: GeometryRenderer<EllipticalArcObject> = {
  objectType: "elliptical-arc",
  render: (object, context) => {
    const geometry = getEllipticalArcGeometry(object, context.objects);

    if (!geometry) {
      return null;
    }

    const start = worldToScreen(geometry.startPoint, context.viewport);
    const end = worldToScreen(geometry.endPoint, context.viewport);
    const rx = geometry.rx * context.viewport.scale;
    const ry = geometry.ry * context.viewport.scale;
    const phiDegrees = -(geometry.phi * 180) / Math.PI;
    const largeArcFlag = geometry.thetaEnd > Math.PI ? 1 : 0;
    const sweepFlag = 0; // 0 is CCW in SVG because Y axis is flipped
    const path = `M ${start.x} ${start.y} A ${rx} ${ry} ${phiDegrees} ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
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
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
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
