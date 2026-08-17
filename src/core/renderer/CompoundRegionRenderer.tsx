import type {
  CompoundRegionObject,
  GeometryObjectRecord,
  PointObject,
  Point2D,
} from "../geometry/types";
import { worldToScreen } from "../geometry/viewport";
import type {
  GeometryRenderer,
  GeometryRendererContext,
} from "./RendererRegistry";
import { getPointObject } from "../geometry/derivedGeometry";

function getDashArray(
  dash: CompoundRegionObject["style"]["dash"],
): string | undefined {
  if (dash === "dashed") return "10 8";
  if (dash === "dotted") return "2 7";
  return undefined;
}

/**
 * Resolve a point for a segment endpoint.
 * Prefers the scene point object; falls back to inline coord if provided.
 */
function resolvePoint(
  pointId: string,
  inlineCoord: Point2D | undefined,
  objects: GeometryObjectRecord,
): Point2D | null {
  if (pointId && pointId !== "__trimmed__") {
    const pt = getPointObject(objects, pointId);
    if (pt) return pt;
  }
  return inlineCoord ?? null;
}

function calculateSVGPath(
  object: CompoundRegionObject,
  context: GeometryRendererContext,
): string | null {
  const { segments } = object;
  if (!segments || segments.length === 0) return null;

  const objects = context.objects;
  const viewport = context.viewport;
  let path = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (!segment) continue;

    const startPt = resolvePoint(segment.startPointId, segment.startCoord, objects);
    const endPt = resolvePoint(segment.endPointId, segment.endCoord, objects);

    if (!startPt || !endPt) continue;

    const screenStart = worldToScreen(startPt, viewport);
    const screenEnd = worldToScreen(endPt, viewport);

    if (i === 0) {
      path += `M ${screenStart.x} ${screenStart.y} `;
    }

    if (segment.type === "line") {
      path += `L ${screenEnd.x} ${screenEnd.y} `;
    } else if (
      segment.type === "circle-arc" ||
      segment.type === "ellipse-arc"
    ) {
      const centerCoord = "centerCoord" in segment ? segment.centerCoord : undefined;
      const centerPt = resolvePoint(segment.centerPointId, centerCoord, objects);
      if (!centerPt) continue;

      const screenCenter = worldToScreen(centerPt, viewport);
      const dxStart = screenStart.x - screenCenter.x;
      const dyStart = screenStart.y - screenCenter.y;
      const dxEnd = screenEnd.x - screenCenter.x;
      const dyEnd = screenEnd.y - screenCenter.y;

      let rx: number, ry: number, xAxisRotation = 0;

      if (segment.type === "ellipse-arc") {
        // If radiusX was stored as 0, we recompute it from actual geometry.
        // ry (minor axis) is stored explicitly in the segment.
        if (segment.radiusX > 0) {
          // Use stored values (scale to screen space)
          rx = segment.radiusX * viewport.scale;
          ry = segment.radiusY * viewport.scale;
          xAxisRotation = (segment.rotation * 180) / Math.PI;
        } else {
          // Fallback: try to get from the EllipticalArcObject if centerPointId maps to an elliptical-arc
          // For now, derive rx from center→start distance (screen space), ry from stored segment.radiusY
          rx = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
          ry = segment.radiusY * viewport.scale;
          // xAxisRotation is the angle of the major axis
          xAxisRotation = (Math.atan2(dyStart, dxStart) * 180) / Math.PI;
        }
      } else {
        // circle-arc: compute radius from center→start distance (or use explicit radius)
        if (segment.radius !== undefined && segment.radius > 0) {
          rx = segment.radius * viewport.scale;
        } else {
          rx = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
        }
        ry = rx;
      }

      // SVG sweep=1 → clockwise (screen Y-down). Our direction "clockwise" = sweep=1.
      const sweepFlag = segment.direction === "clockwise" ? 1 : 0;

      // For large-arc determination, compute angular delta
      let startAngle = Math.atan2(dyStart, dxStart);
      let endAngle = Math.atan2(dyEnd, dxEnd);

      if (startAngle < 0) startAngle += 2 * Math.PI;
      if (endAngle < 0) endAngle += 2 * Math.PI;

      let deltaAngle = endAngle - startAngle;
      if (sweepFlag === 1 && deltaAngle <= 0) deltaAngle += 2 * Math.PI;
      if (sweepFlag === 0 && deltaAngle >= 0) deltaAngle -= 2 * Math.PI;

      if (Math.abs(deltaAngle) >= 1.99 * Math.PI) {
        // SVG cannot draw a full circle with a single arc command.
        // We split it into two 180-degree arcs.
        const midAngle = startAngle + deltaAngle / 2;
        const midX = screenCenter.x + rx * Math.cos(midAngle) * Math.cos(xAxisRotation * Math.PI / 180) - ry * Math.sin(midAngle) * Math.sin(xAxisRotation * Math.PI / 180);
        const midY = screenCenter.y + rx * Math.cos(midAngle) * Math.sin(xAxisRotation * Math.PI / 180) + ry * Math.sin(midAngle) * Math.cos(xAxisRotation * Math.PI / 180);
        path += `A ${rx} ${ry} ${xAxisRotation} 0 ${sweepFlag} ${midX} ${midY} `;
        path += `A ${rx} ${ry} ${xAxisRotation} 0 ${sweepFlag} ${screenEnd.x} ${screenEnd.y} `;
      } else {
        const largeArcFlag = Math.abs(deltaAngle) > Math.PI ? 1 : 0;
        path += `A ${rx} ${ry} ${xAxisRotation} ${largeArcFlag} ${sweepFlag} ${screenEnd.x} ${screenEnd.y} `;
      }
    } else if (segment.type === "curve") {
      const cps = segment.controlPoints
        .map((id) => getPointObject(objects, id))
        .filter((p): p is PointObject => Boolean(p))
        .map((p) => worldToScreen(p, viewport));

      if (cps.length === 0 || segment.curveType === "spline") {
        path += `L ${screenEnd.x} ${screenEnd.y} `;
      } else if ((cps.length === 1 || segment.curveType === "quadratic-bezier") && cps[0]) {
        path += `Q ${cps[0].x} ${cps[0].y} ${screenEnd.x} ${screenEnd.y} `;
      } else if (cps.length >= 2 && cps[0] && cps[1]) {
        path += `C ${cps[0].x} ${cps[0].y}, ${cps[1].x} ${cps[1].y}, ${screenEnd.x} ${screenEnd.y} `;
      }
    }
  }

  if (object.closed) {
    path += "Z";
  }

  return path.trim();
}

export const CompoundRegionRenderer: GeometryRenderer<CompoundRegionObject> = {
  objectType: "compound-region",
  render: (object, context) => {
    const path = calculateSVGPath(object, context);
    if (!path) return null;

    const isSelected = context.selectedObjectIds.includes(object.id);
    const isHovered = context.hoveredObjectId === object.id && !isSelected;
    const hasPattern =
      object.style.pattern && object.style.pattern.type !== "none";

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
        {isHovered && (
          <path
            d={path}
            fill="#a8f0ff"
            fillOpacity={0.05}
            stroke="#a8f0ff"
            strokeLinejoin="round"
            strokeOpacity={0.22}
            strokeWidth={object.style.strokeWidth + 6}
          />
        )}
        {object.style.fill !== "transparent" &&
          object.style.fillOpacity > 0 && (
            <path
              d={path}
              fill={object.style.fill}
              fillOpacity={object.style.fillOpacity}
              stroke="none"
            />
          )}
        <path
          d={path}
          fill={
            hasPattern
              ? `url(#pattern-${object.id})`
              : object.style.fill === "transparent"
                ? "none"
                : object.style.fill
          }
          fillOpacity={hasPattern ? 1 : object.style.fillOpacity}
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
