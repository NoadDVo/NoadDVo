import type { CircleObject, Point2D, PointObject } from "../geometry";
import { distance } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
}

function getCircleGeometry(
  object: CircleObject,
  context: GeometryRendererContext,
): { readonly center: Point2D; readonly radius: number } | null {
  if (object.circleKind === "center-radius") {
    const center = getPoint(object.centerPointId, context);

    return center ? { center, radius: object.radius } : null;
  }

  if (object.circleKind === "center-point") {
    const center = getPoint(object.centerPointId, context);
    const radiusPoint = getPoint(object.radiusPointId, context);

    return center && radiusPoint
      ? { center, radius: distance(center, radiusPoint) }
      : null;
  }

  return null;
}

export const CircleRenderer: GeometryRenderer<CircleObject> = {
  objectType: "circle",
  render: (object, context) => {
    const geometry = getCircleGeometry(object, context);

    if (!geometry) {
      return null;
    }

    const center = worldToScreen(geometry.center, context.viewport);
    const radius = geometry.radius * context.viewport.scale;
    const isSelected = context.selectedObjectIds.includes(object.id);

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <circle
            cx={center.x}
            cy={center.y}
            fill="none"
            r={radius}
            stroke="#7ddcff"
            strokeOpacity={0.34}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        <circle
          cx={center.x}
          cy={center.y}
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
          r={radius}
          stroke={object.style.stroke}
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
