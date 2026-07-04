import type { PointObject, SegmentObject } from "../geometry";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer } from "./RendererRegistry";

function getPoint(objectId: string, context: Parameters<GeometryRenderer<SegmentObject>["render"]>[1]) {
  const object = context.objects[objectId];

  return object?.type === "point" ? object as PointObject : null;
}

function getDashArray(dash: SegmentObject["style"]["dash"]): string | undefined {
  if (dash === "dashed") {
    return "10 8";
  }

  if (dash === "dotted") {
    return "2 7";
  }

  return undefined;
}

export const SegmentRenderer: GeometryRenderer<SegmentObject> = {
  objectType: "segment",
  render: (object, context) => {
    const start = getPoint(object.startPointId, context);
    const end = getPoint(object.endPointId, context);

    if (!start || !end) {
      return null;
    }

    const startScreen = worldToScreen(start, context.viewport);
    const endScreen = worldToScreen(end, context.viewport);
    const isSelected = context.selectedObjectIds.includes(object.id);

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        {isSelected && (
          <line
            x1={startScreen.x}
            x2={endScreen.x}
            y1={startScreen.y}
            y2={endScreen.y}
            stroke="#7ddcff"
            strokeLinecap="round"
            strokeOpacity={0.38}
            strokeWidth={object.style.strokeWidth + 8}
          />
        )}
        <line
          x1={startScreen.x}
          x2={endScreen.x}
          y1={startScreen.y}
          y2={endScreen.y}
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
