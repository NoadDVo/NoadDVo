import type { SegmentObject } from "../geometry";
import type { GeometryRenderer } from "./RendererRegistry";
import { getRendererPoint, renderSegmentLike } from "./SegmentLikeRenderer";
import { ConstructionSymbols } from "./ConstructionSymbols";

export const SegmentRenderer: GeometryRenderer<SegmentObject> = {
  objectType: "segment",
  render: (object, context) => {
    const start = getRendererPoint(object.startPointId, context);
    const end = getRendererPoint(object.endPointId, context);

    if (!start || !end) return null;

    return (
      <g>
        {renderSegmentLike({ context, end, object, start })}
        <ConstructionSymbols line={object as any} viewport={context.viewport} objects={context.objects} stroke={object.style.stroke} />
      </g>
    );
  },
};
