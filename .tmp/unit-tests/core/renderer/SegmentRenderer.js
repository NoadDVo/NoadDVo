"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SegmentRenderer = void 0;
const SegmentLikeRenderer_1 = require("./SegmentLikeRenderer");
exports.SegmentRenderer = {
    objectType: "segment",
    render: (object, context) => {
        const start = (0, SegmentLikeRenderer_1.getRendererPoint)(object.startPointId, context);
        const end = (0, SegmentLikeRenderer_1.getRendererPoint)(object.endPointId, context);
        return start && end
            ? (0, SegmentLikeRenderer_1.renderSegmentLike)({ context, end, object, start })
            : null;
    },
};
