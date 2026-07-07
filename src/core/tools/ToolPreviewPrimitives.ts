import { createElement, type ReactNode } from "react";

import type { Point2D, PointObject } from "../geometry";
import { worldToScreen, type Viewport } from "../geometry/viewport";

const previewStroke = "#7ddcff";

export function renderPreviewPoint({
  point,
  r = 5,
  viewport,
}: {
  readonly point: Point2D;
  readonly r?: number;
  readonly viewport: Viewport;
}): ReactNode {
  const screen = worldToScreen(point, viewport);

  return createElement("circle", {
    cx: screen.x,
    cy: screen.y,
    fill: previewStroke,
    fillOpacity: 0.16,
    r,
    stroke: previewStroke,
    strokeOpacity: 0.82,
    strokeWidth: 1.5,
  });
}

export function renderPreviewPolyline({
  points,
  viewport,
}: {
  readonly points: readonly Point2D[];
  readonly viewport: Viewport;
}): ReactNode {
  if (points.length < 2) {
    return null;
  }

  const path = points
    .map((point, index) => {
      const screen = worldToScreen(point, viewport);

      return `${index === 0 ? "M" : "L"} ${screen.x} ${screen.y}`;
    })
    .join(" ");

  return createElement("path", {
    d: path,
    fill: "none",
    stroke: previewStroke,
    strokeDasharray: "7 6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeOpacity: 0.74,
    strokeWidth: 2,
  });
}

export function renderPointSequencePreview({
  points,
  pointerWorld,
  viewport,
}: {
  readonly points: readonly PointObject[];
  readonly pointerWorld: Point2D;
  readonly viewport: Viewport;
}): ReactNode {
  if (points.length === 0) {
    return null;
  }

  const previewPoints = [...points, pointerWorld];

  return createElement(
    "g",
    null,
    renderPreviewPolyline({ points: previewPoints, viewport }),
    ...points.map((point) =>
      createElement("g", { key: point.id }, renderPreviewPoint({ point, viewport })),
    ),
  );
}
