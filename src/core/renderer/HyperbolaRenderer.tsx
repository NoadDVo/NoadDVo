import type { HyperbolaObject } from "../geometry/types";
import { getHyperbolaGeometry } from "../geometry/conicGeometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function generateHyperbolaPath(
  cx: number, cy: number, a: number, b: number, angleDeg: number, scale: number,
  tRange: number
): string {
  const rad = angleDeg * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const tStart = -tRange;
  const tEnd = tRange;
  const steps = Math.max(50, Math.ceil(tRange * 20));
  
  let path1 = "";
  let path2 = "";

  for (let i = 0; i <= steps; i++) {
    const t = tStart + (tEnd - tStart) * (i / steps);
    const x = a * Math.cosh(t);
    const y = b * Math.sinh(t);

    // Branch 1 (right)
    const sx1 = cx + (x * cos - y * sin) * scale;
    const sy1 = cy - (x * sin + y * cos) * scale;
    
    // Branch 2 (left, x is negative)
    const sx2 = cx + (-x * cos - y * sin) * scale;
    const sy2 = cy - (-x * sin + y * cos) * scale;

    if (i === 0) {
      path1 += `M ${sx1} ${sy1} `;
      path2 += `M ${sx2} ${sy2} `;
    } else {
      path1 += `L ${sx1} ${sy1} `;
      path2 += `L ${sx2} ${sy2} `;
    }
  }

  return path1 + path2;
}

export const HyperbolaRenderer: GeometryRenderer<HyperbolaObject> = {
  objectType: "hyperbola",
  render: (object, context) => {
    const geometry = getHyperbolaGeometry(object, context.objects);

    if (!geometry) {
      return null;
    }

    const center = worldToScreen(geometry.center, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;

    const pathData = generateHyperbolaPath(
      center.x, center.y, geometry.a, geometry.b, geometry.angleDegrees, context.viewport.scale,
      geometry.tRange
    );

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <path
            d={pathData}
            fill="none"
            stroke="#7ddcff"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        {isHovered && (
          <path
            d={pathData}
            fill="none"
            stroke="#a8f0ff"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        <path
          d={pathData}
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
          stroke={object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
