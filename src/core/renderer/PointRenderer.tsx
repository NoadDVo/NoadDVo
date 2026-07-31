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
        {(() => {
          const style = object.style.pointStyle ?? "filled";
          const finalFill = style === "hollow" ? "#ffffff" : fill;
          const finalStroke = isDerived ? "#747b84" : object.style.stroke;
          const finalStrokeWidth = object.style.strokeWidth;
          const finalStrokeOpacity = object.style.strokeOpacity;

          if (style === "cross") {
            const size = radius * 0.8;
            return (
              <g stroke={finalStroke} strokeWidth={finalStrokeWidth} strokeOpacity={finalStrokeOpacity} strokeLinecap="round">
                <line x1={point.x - size} y1={point.y - size} x2={point.x + size} y2={point.y + size} />
                <line x1={point.x - size} y1={point.y + size} x2={point.x + size} y2={point.y - size} />
              </g>
            );
          }
          if (style === "plus") {
            const size = radius;
            return (
              <g stroke={finalStroke} strokeWidth={finalStrokeWidth} strokeOpacity={finalStrokeOpacity} strokeLinecap="round">
                <line x1={point.x - size} y1={point.y} x2={point.x + size} y2={point.y} />
                <line x1={point.x} y1={point.y - size} x2={point.x} y2={point.y + size} />
              </g>
            );
          }
          if (style === "square") {
            const size = radius * 1.6;
            return (
              <rect
                x={point.x - size / 2}
                y={point.y - size / 2}
                width={size}
                height={size}
                fill={finalFill}
                fillOpacity={fillOpacity}
                stroke={finalStroke}
                strokeOpacity={finalStrokeOpacity}
                strokeWidth={finalStrokeWidth}
              />
            );
          }
          // Default to filled or hollow circle
          return (
            <circle
              cx={point.x}
              cy={point.y}
              fill={finalFill}
              fillOpacity={fillOpacity}
              r={radius}
              stroke={finalStroke}
              strokeOpacity={finalStrokeOpacity}
              strokeWidth={finalStrokeWidth}
            />
          );
        })()}
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
        {object.style.labelVisible && object.name && (() => {
          const offset = 12 + radius;
          let dx = 0;
          let dy = 0;
          let anchor = "middle";
          let baseline = "middle";

          switch (object.style.labelPosition) {
            case "above": dx = 0; dy = -offset; baseline = "bottom"; break;
            case "below": dx = 0; dy = offset; baseline = "hanging"; break;
            case "left": dx = -offset; dy = 0; anchor = "end"; break;
            case "right": dx = offset; dy = 0; anchor = "start"; break;
            case "above-left": dx = -offset * 0.7; dy = -offset * 0.7; anchor = "end"; baseline = "bottom"; break;
            case "above-right": dx = offset * 0.7; dy = -offset * 0.7; anchor = "start"; baseline = "bottom"; break;
            case "below-left": dx = -offset * 0.7; dy = offset * 0.7; anchor = "end"; baseline = "hanging"; break;
            case "below-right": dx = offset * 0.7; dy = offset * 0.7; anchor = "start"; baseline = "hanging"; break;
            default: dx = offset * 0.7; dy = -offset * 0.7; anchor = "start"; baseline = "bottom"; break; // default above-right
          }

          return (
            <text
              fill="#0b0f14"
              fontFamily="Inter, ui-sans-serif, system-ui"
              fontSize={object.style.labelSize ?? 12}
              fontWeight={700}
              paintOrder="stroke"
              stroke="#f2f7fa"
              strokeWidth={3}
              textAnchor={anchor as any}
              alignmentBaseline={baseline as any}
              x={point.x + dx}
              y={point.y + dy}
            >
              {object.name}
            </text>
          );
        })()}
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
