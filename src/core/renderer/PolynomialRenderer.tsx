import type { ReactNode } from "react";
import { memo } from "react";

import { evaluateLagrange, type Point2D } from "../geometry";
import { getPointObject } from "../geometry/derivedGeometry";
import type { PolynomialObject } from "../geometry/types";
import { worldToScreen } from "../geometry/viewport";
import type { GeometryRenderer, GeometryRendererContext } from "./RendererRegistry";

export const PolynomialRenderer: GeometryRenderer<PolynomialObject> = {
  objectType: "polynomial",

  render(object: PolynomialObject, context: GeometryRendererContext): ReactNode {
    return <PolynomialRendererComponent key={object.id} context={context} object={object} />;
  },
};

const PolynomialRendererComponent = memo(function PolynomialRendererComponent({
  object,
  context,
}: {
  object: PolynomialObject;
  context: GeometryRendererContext;
}) {
  const points: Point2D[] = [];
  for (const pointId of object.pointIds) {
    const p = getPointObject(context.objects, pointId);
    if (p) points.push(p);
  }

  if (points.length < 2) {
    return null;
  }

  const { viewport } = context;
  const numSamples = 200;
  
  // Bounded polynomial: only draw between the minimum and maximum x-coordinates of the selected points
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  
  if (minX === Infinity || minX === maxX) {
    return null;
  }
  
  const step = (maxX - minX) / numSamples;
  
  const pathPoints: string[] = [];
  
  for (let i = 0; i <= numSamples; i++) {
    const x = minX + i * step;
    const y = evaluateLagrange(x, points);
    
    if (!Number.isNaN(y) && isFinite(y)) {
      const screenP = worldToScreen({ x, y }, viewport);
      if (pathPoints.length === 0) {
        pathPoints.push(`M ${screenP.x} ${screenP.y}`);
      } else {
        pathPoints.push(`L ${screenP.x} ${screenP.y}`);
      }
    }
  }

  const d = pathPoints.join(" ");

  const isSelected = context.selectedObjectIds.includes(object.id);
  const isHovered = context.hoveredObjectId === object.id && !isSelected;

  return (
    <g>
      {/* Interaction area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={10}
      />
      
      {/* Visible line */}
      <path
        d={d}
        fill={object.style.fill}
        fillOpacity={object.style.fillOpacity}
        stroke={object.style.stroke}
        strokeOpacity={object.style.strokeOpacity}
        strokeWidth={isSelected || isHovered ? object.style.strokeWidth + 2 : object.style.strokeWidth}
        pointerEvents="none"
        strokeDasharray={object.style.dash === "dashed" ? "8,4" : object.style.dash === "dotted" ? "2,4" : undefined}
      />
    </g>
  );
});
