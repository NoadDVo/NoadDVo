import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";
import { TickMarksSymbol, getMidpointIndex } from "./ConstructionSymbols";
import { midpoint, vectorFromPoints, normalize } from "../geometry/math";

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
        {object.showEqualityTicks && object.construction?.type === "midpoint" && (() => {
          const pointA = context.objects[object.construction.pointAId];
          const pointB = context.objects[object.construction.pointBId];
          if (pointA?.type === "point" && pointB?.type === "point") {
            const index = Math.min(getMidpointIndex(object, context.objects), 3);
            const pointAScreen = worldToScreen(pointA, context.viewport);
            const pointBScreen = worldToScreen(pointB, context.viewport);
            const u = normalize(vectorFromPoints(pointAScreen, pointBScreen));
            const v = { x: -u.y, y: u.x };
            const mid1Screen = worldToScreen(midpoint(pointA, object), context.viewport);
            const mid2Screen = worldToScreen(midpoint(object, pointB), context.viewport);
            return (
              <>
                <TickMarksSymbol center={mid1Screen} dir={u} perp={v} size={5} color={object.style.stroke} count={index} />
                <TickMarksSymbol center={mid2Screen} dir={u} perp={v} size={5} color={object.style.stroke} count={index} />
              </>
            );
          }
          return null;
        })()}
      </g>
    );
  },
};
