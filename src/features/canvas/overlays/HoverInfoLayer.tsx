import {
  distance,
  type CircleObject,
  type GeometryObject,
  type GeometryObjectRecord,
  type PointObject,
  type SegmentObject,
} from "../../../core/geometry";
import { worldToScreen, type Viewport } from "../../../core/geometry/viewport";
import type { Point2D } from "../../../core/geometry";
import { FixedOverlay } from "../../../ui/overlay/OverlayPortal";

function formatHoverNumber(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function getPoint(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

function getCircleRadius(
  object: CircleObject,
  objects: GeometryObjectRecord,
): number | null {
  if (object.circleKind === "center-radius") {
    return object.radius;
  }

  if (object.circleKind === "center-point") {
    const center = getPoint(objects, object.centerPointId);
    const radiusPoint = getPoint(objects, object.radiusPointId);

    return center && radiusPoint ? distance(center, radiusPoint) : null;
  }

  return null;
}

function getSegmentLength(
  object: SegmentObject,
  objects: GeometryObjectRecord,
): number | null {
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  return start && end ? distance(start, end) : null;
}

function getHoverInfo(
  object: GeometryObject | null,
  objects: GeometryObjectRecord,
): { readonly title: string; readonly detail: string } | null {
  if (!object) {
    return null;
  }

  if (object.type === "point") {
    return {
      detail: `(${formatHoverNumber(object.x)}, ${formatHoverNumber(object.y)})`,
      title: object.name ?? "Point",
    };
  }

  if (object.type === "segment") {
    const length = getSegmentLength(object, objects);

    return {
      detail: length === null ? "Length unavailable" : `Length ${formatHoverNumber(length)}`,
      title: object.name ?? "Segment",
    };
  }

  if (object.type === "circle") {
    const radius = getCircleRadius(object, objects);

    return {
      detail: radius === null ? "Radius unavailable" : `Radius ${formatHoverNumber(radius)}`,
      title: object.name ?? "Circle",
    };
  }

  return {
    detail: object.type,
    title: object.name ?? object.id,
  };
}

export function HoverInfoLayer({
  hoveredObject,
  objects,
  pointerWorld,
  viewport,
}: {
  readonly hoveredObject: GeometryObject | null;
  readonly objects: GeometryObjectRecord;
  readonly pointerWorld: Point2D;
  readonly viewport: Viewport;
}) {
  const hoverInfo = getHoverInfo(hoveredObject, objects);

  if (!hoverInfo) {
    return null;
  }

  const hoverScreen = worldToScreen(pointerWorld, viewport);
  const canvasRect =
    typeof document === "undefined"
      ? null
      : document
          .querySelector<SVGSVGElement>('svg[aria-label="Geometry canvas"]')
          ?.getBoundingClientRect();
  const left = Math.max(
    12,
    Math.min(hoverScreen.x + 16, Math.max(12, viewport.width - 180)),
  );
  const top = Math.max(
    12,
    Math.min(hoverScreen.y + 16, Math.max(12, viewport.height - 72)),
  );

  return (
    <FixedOverlay
      className="pointer-events-none rounded-[12px] border border-slate-900/10 bg-white/[0.86] px-3 py-2 text-slate-950 shadow-[0_16px_38px_rgb(15_23_42/0.16)] backdrop-blur-panel"
      style={{
        left: (canvasRect?.left ?? 0) + left,
        position: "fixed",
        top: (canvasRect?.top ?? 0) + top,
        zIndex: 2147483647,
      }}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.12em]">
        {hoverInfo.title}
      </p>
      <p className="mt-1 font-mono text-[12px] font-semibold text-slate-700">
        {hoverInfo.detail}
      </p>
    </FixedOverlay>
  );
}
