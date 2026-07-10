import { distance, type DistanceObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

export const DistanceRenderer: GeometryRenderer<DistanceObject> = {
  objectType: "distance",
  render: (object, context) => {
    let point1;
    let point2;
    let labelPrefix = "";

    if (object.distanceKind === "segment" && object.segmentId) {
      const segment = context.objects[object.segmentId];
      if (segment && segment.type === "segment") {
        point1 = context.objects[segment.startPointId];
        point2 = context.objects[segment.endPointId];
        labelPrefix = segment.name ? `${segment.name} = ` : "";
      }
    } else if (object.distanceKind === "two-points" && object.pointAId && object.pointBId) {
      point1 = context.objects[object.pointAId];
      point2 = context.objects[object.pointBId];
      const nameA = point1?.name ?? "A";
      const nameB = point2?.name ?? "B";
      labelPrefix = `${nameA}${nameB} = `;
    }

    if (!point1 || point1.type !== "point" || !point2 || point2.type !== "point") {
      return null;
    }

    const dist = distance(point1, point2);
    const precision = object.precision ?? 2;
    const formatted = Number(dist.toFixed(precision));
    const value = Object.is(formatted, -0) ? "0" : String(formatted);

    const midPointWorld = {
      x: (point1.x + point2.x) / 2,
      y: (point1.y + point2.y) / 2,
    };

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
    const offset = offsetMap[object.labelPosition as keyof typeof offsetMap] ?? offsetMap.above;

    const screenPos = worldToScreen(midPointWorld, context.viewport);
    const x = screenPos.x + offset.x;
    const y = screenPos.y - offset.y; // SVG y is down, so subtract for "above"

    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const fontSize = object.style.labelSize;
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
