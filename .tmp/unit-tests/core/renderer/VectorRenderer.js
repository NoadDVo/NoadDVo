"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const geometry_1 = require("../geometry");
const SegmentLikeRenderer_1 = require("./SegmentLikeRenderer");
function getArrowPath(style, size) {
    if (style === "triangle") {
        return `M 0 0 L ${size} ${size / 2} L 0 ${size} z`;
    }
    if (style === "stealth") {
        return `M 0 0 L ${size} ${size / 2} L 0 ${size} L ${size * 0.25} ${size / 2} z`;
    }
    return `M 0 0 L ${size} ${size / 2} L 0 ${size} L ${size * 0.35} ${size / 2} z`;
}
function renderArrowMarker({ color, id, opacity, size, style, }) {
    if (style === "none") {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)("marker", { id: id, markerHeight: size, markerWidth: size, orient: "auto", refX: size - 1, refY: size / 2, viewBox: `0 0 ${size} ${size}`, children: (0, jsx_runtime_1.jsx)("path", { d: getArrowPath(style, size), fill: color, fillOpacity: opacity }) }));
}
exports.VectorRenderer = {
    objectType: "vector",
    render: (object, context) => {
        const start = (0, SegmentLikeRenderer_1.getRendererPoint)(object.startPointId, context);
        const end = (0, SegmentLikeRenderer_1.getRendererPoint)(object.endPointId, context);
        if (!start || !end) {
            return null;
        }
        const arrowStyle = (0, geometry_1.getVectorArrowStyle)(object);
        const arrowSize = (0, geometry_1.getVectorArrowSize)(object);
        const arrowId = `ndv-vector-arrow-${object.id}`;
        const selectionArrowId = `ndv-vector-selection-arrow-${object.id}`;
        const markerEnd = arrowStyle === "none" ? undefined : `url(#${arrowId})`;
        const selectionMarkerEnd = arrowStyle === "none" ? undefined : `url(#${selectionArrowId})`;
        return ((0, jsx_runtime_1.jsxs)("g", { "data-object-id": object.id, "data-object-type": object.type, children: [(0, jsx_runtime_1.jsxs)("defs", { children: [renderArrowMarker({
                            color: object.style.stroke,
                            id: arrowId,
                            opacity: object.style.strokeOpacity,
                            size: arrowSize,
                            style: arrowStyle,
                        }), renderArrowMarker({
                            color: "#7ddcff",
                            id: selectionArrowId,
                            opacity: 0.55,
                            size: arrowSize + 2,
                            style: arrowStyle,
                        })] }), (0, SegmentLikeRenderer_1.renderSegmentLike)({
                    context,
                    end,
                    object,
                    start,
                    ...(markerEnd ? { markerEnd } : {}),
                    ...(selectionMarkerEnd ? { selectionMarkerEnd } : {}),
                })] }));
    },
};
