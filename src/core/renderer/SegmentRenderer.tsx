import type { SegmentObject } from "../geometry";
import type { GeometryRenderer } from "./RendererRegistry";
import { getRendererPoint, renderSegmentLike } from "./SegmentLikeRenderer";

export const SegmentRenderer: GeometryRenderer<SegmentObject> = {
  objectType: "segment",
  render: (object, context) => {
    const start = getRendererPoint(object.startPointId, context);
    const end = getRendererPoint(object.endPointId, context);

    return start && end
      ? renderSegmentLike({ context, end, object, start })
      : null;
  },
};
