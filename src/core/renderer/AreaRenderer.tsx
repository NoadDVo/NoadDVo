import { polygonArea, type AreaObject } from "../geometry";
import { getPolygonPoints } from "../geometry/derivedGeometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const AreaRenderer: GeometryRenderer<AreaObject> = {
  objectType: "area",
  render: (object, context) => {
    const polygon = context.objects[object.polygonId];
    if (!polygon || polygon.type !== "polygon") {
      return null;
    }

    const points = getPolygonPoints(polygon, context.objects);
    if (!points || points.length < 3) {
      return null;
    }

    const area = Math.abs(polygonArea(points));
    const precision = object.precision ?? 2;
    const formatted = Number(area.toFixed(precision));
    const value = Object.is(formatted, -0) ? "0" : String(formatted);

    // Calculate centroid
    const centroidWorld = points.reduce(
      (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
      { x: 0, y: 0 },
    );
    centroidWorld.x /= points.length;
    centroidWorld.y /= points.length;

    // offset
    const offsetMap = {
      above: { x: 0, y: 20 },
      "above-left": { x: -20, y: 20 },
      "above-right": { x: 20, y: 20 },
      below: { x: 0, y: -20 },
      "below-left": { x: -20, y: -20 },
      "below-right": { x: 20, y: -20 },
      left: { x: -20, y: 0 },
      right: { x: 20, y: 0 },
    };
    const offset = offsetMap[object.labelPosition] ?? offsetMap.above;

    const screenPos = worldToScreen(centroidWorld, context.viewport);
    const x = screenPos.x + offset.x;
    const y = screenPos.y - offset.y; // SVG y is down, so subtract for "above"

    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const fontSize = object.style.labelSize;
    const labelPrefix = polygon.name ? `Diện tích ${polygon.name} = ` : "S = ";
    const displayLabel = `${labelPrefix}${value}`;
    const width = Math.max(32, displayLabel.length * fontSize * 0.62);
    const height = fontSize * 1.45;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {(isSelected || isHovered) && (
          <rect
            x={x - width / 2 - 6}
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
          fillOpacity={object.style.strokeOpacity}
          fontFamily="Inter, system-ui, sans-serif"
          fontSize={fontSize}
          fontWeight={600}
          pointerEvents="none"
          textAnchor="middle"
        >
          {displayLabel}
        </text>
      </g>
    );
  },
};
