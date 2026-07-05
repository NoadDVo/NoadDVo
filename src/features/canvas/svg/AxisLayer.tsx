import { memo, useMemo } from "react";

import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";
import { getGridStep } from "../grid/gridMath";

type AxisLayerProps = {
  readonly viewport: Viewport;
};

export const AxisLayer = memo(function AxisLayer({ viewport }: AxisLayerProps) {
  const origin = worldToScreen({ x: 0, y: 0 }, viewport);
  const labels = useMemo(() => createAxisLabels(viewport), [viewport]);

  return (
    <g data-layer="axes" shapeRendering="crispEdges">
      <line
        stroke="rgb(11 15 20 / 0.82)"
        strokeWidth={1.35}
        x1={0}
        x2={viewport.width}
        y1={origin.y}
        y2={origin.y}
      />
      <line
        stroke="rgb(11 15 20 / 0.82)"
        strokeWidth={1.35}
        x1={origin.x}
        x2={origin.x}
        y1={0}
        y2={viewport.height}
      />
      <circle
        cx={origin.x}
        cy={origin.y}
        fill="rgb(11 15 20)"
        r={4}
        stroke="rgb(242 247 250)"
        strokeWidth={1.25}
      />
      {labels.map((label) => (
        <text
          fill="rgb(11 15 20 / 0.62)"
          fontFamily="Inter, ui-sans-serif, system-ui"
          fontSize={10}
          fontWeight={700}
          key={label.id}
          paintOrder="stroke"
          stroke="rgb(242 247 250 / 0.92)"
          strokeWidth={3}
          textAnchor={label.anchor}
          x={label.x}
          y={label.y}
        >
          {label.value}
        </text>
      ))}
    </g>
  );
});

type AxisLabel = {
  readonly anchor: "middle" | "start" | "end";
  readonly id: string;
  readonly value: string;
  readonly x: number;
  readonly y: number;
};

function formatAxisNumber(value: number): string {
  const rounded = Number(value.toFixed(4));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function createAxisLabels(viewport: Viewport): readonly AxisLabel[] {
  const minorStep = getGridStep(viewport);
  const majorStep = minorStep * 5;
  const worldMinX = (0 - viewport.offsetX) / viewport.scale;
  const worldMaxX = (viewport.width - viewport.offsetX) / viewport.scale;
  const worldMaxY = (viewport.offsetY - 0) / viewport.scale;
  const worldMinY = (viewport.offsetY - viewport.height) / viewport.scale;
  const startX = Math.ceil(worldMinX / majorStep) * majorStep;
  const endX = Math.floor(worldMaxX / majorStep) * majorStep;
  const startY = Math.ceil(worldMinY / majorStep) * majorStep;
  const endY = Math.floor(worldMaxY / majorStep) * majorStep;
  const origin = worldToScreen({ x: 0, y: 0 }, viewport);
  const xAxisY = Math.min(viewport.height - 14, Math.max(14, origin.y + 13));
  const yAxisX = Math.min(viewport.width - 14, Math.max(16, origin.x - 9));
  const labels: AxisLabel[] = [];

  for (let x = startX; x <= endX; x += majorStep) {
    const screen = worldToScreen({ x, y: 0 }, viewport);

    labels.push({
      anchor: "middle",
      id: `x-label-${x.toFixed(6)}`,
      value: formatAxisNumber(x),
      x: Math.abs(x) < 1e-8 ? screen.x + 14 : screen.x,
      y: xAxisY,
    });
  }

  for (let y = startY; y <= endY; y += majorStep) {
    if (Math.abs(y) < 1e-8) {
      continue;
    }

    const screen = worldToScreen({ x: 0, y }, viewport);

    labels.push({
      anchor: "end",
      id: `y-label-${y.toFixed(6)}`,
      value: formatAxisNumber(y),
      x: yAxisX,
      y: screen.y + 4,
    });
  }

  return labels;
}
