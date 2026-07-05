import {
  getVectorArrowSize,
  getVectorArrowStyle,
  type VectorArrowStyle,
  type VectorObject,
} from "../geometry";
import type { GeometryRenderer } from "./RendererRegistry";
import { getRendererPoint, renderSegmentLike } from "./SegmentLikeRenderer";

function getArrowPath(style: VectorArrowStyle, size: number): string {
  if (style === "triangle") {
    return `M 0 0 L ${size} ${size / 2} L 0 ${size} z`;
  }

  if (style === "stealth") {
    return `M 0 0 L ${size} ${size / 2} L 0 ${size} L ${size * 0.25} ${size / 2} z`;
  }

  return `M 0 0 L ${size} ${size / 2} L 0 ${size} L ${size * 0.35} ${size / 2} z`;
}

function renderArrowMarker({
  color,
  id,
  opacity,
  size,
  style,
}: {
  readonly color: string;
  readonly id: string;
  readonly opacity: number;
  readonly size: number;
  readonly style: VectorArrowStyle;
}) {
  if (style === "none") {
    return null;
  }

  return (
    <marker
      id={id}
      markerHeight={size}
      markerWidth={size}
      orient="auto"
      refX={size - 1}
      refY={size / 2}
      viewBox={`0 0 ${size} ${size}`}
    >
      <path d={getArrowPath(style, size)} fill={color} fillOpacity={opacity} />
    </marker>
  );
}

export const VectorRenderer: GeometryRenderer<VectorObject> = {
  objectType: "vector",
  render: (object, context) => {
    const start = getRendererPoint(object.startPointId, context);
    const end = getRendererPoint(object.endPointId, context);

    if (!start || !end) {
      return null;
    }

    const arrowStyle = getVectorArrowStyle(object);
    const arrowSize = getVectorArrowSize(object);
    const arrowId = `ndv-vector-arrow-${object.id}`;
    const selectionArrowId = `ndv-vector-selection-arrow-${object.id}`;
    const markerEnd = arrowStyle === "none" ? undefined : `url(#${arrowId})`;
    const selectionMarkerEnd =
      arrowStyle === "none" ? undefined : `url(#${selectionArrowId})`;

    return (
      <g data-object-id={object.id} data-object-type={object.type}>
        <defs>
          {renderArrowMarker({
            color: object.style.stroke,
            id: arrowId,
            opacity: object.style.strokeOpacity,
            size: arrowSize,
            style: arrowStyle,
          })}
          {renderArrowMarker({
            color: "#7ddcff",
            id: selectionArrowId,
            opacity: 0.55,
            size: arrowSize + 2,
            style: arrowStyle,
          })}
        </defs>
        {renderSegmentLike({
          context,
          end,
          object,
          start,
          ...(markerEnd ? { markerEnd } : {}),
          ...(selectionMarkerEnd ? { selectionMarkerEnd } : {}),
        })}
      </g>
    );
  },
};
