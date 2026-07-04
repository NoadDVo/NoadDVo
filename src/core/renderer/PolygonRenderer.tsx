import type { PointObject, PolygonObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

function getPoint(objectId: string, context: GeometryRendererContext) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
}

function getDashArray(dash: PolygonObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "10 8";
  }

  if (dash === "dotted") {
    return "2 7";
  }

  return undefined;
}

export const PolygonRenderer: GeometryRenderer<PolygonObject> = {
  objectType: "polygon",
  render: (object, context) => {
    const points = object.pointIds
      .map((pointId) => getPoint(pointId, context))
      .filter((point): point is PointObject => Boolean(point))
      .map((point) => worldToScreen(point, context.viewport));

    if (points.length < 3) {
      return null;
    }

    const path = `${points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ")} Z`;
    const isSelected = context.selectedObjectIds.includes(object.id);

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <path
            d={path}
            fill="#7ddcff"
            fillOpacity={0.08}
            stroke="#7ddcff"
            strokeLinejoin="round"
            strokeOpacity={0.38}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        <path
          d={path}
          fill={object.style.fill}
          fillOpacity={object.style.fillOpacity}
          stroke={object.style.stroke}
          strokeDasharray={getDashArray(object.style.dash)}
          strokeLinejoin="round"
          strokeOpacity={object.style.strokeOpacity}
          strokeWidth={object.style.strokeWidth}
        />
      </g>
    );
  },
};
