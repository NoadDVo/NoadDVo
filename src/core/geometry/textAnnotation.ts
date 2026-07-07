import type {
  GeometryObject,
  GeometryObjectRecord,
  Point2D,
  TextAlignment,
  TextMode,
  TextObject,
} from "./types";
import {
  distance,
  polygonArea,
} from "./math";
import {
  getCircleGeometry,
  getPointObject,
  getPolygonPoints,
} from "./derivedGeometry";

export const textModes = [
  "plain",
  "math",
  "latex",
  "coordinate-label",
  "object-label",
  "measurement-label",
] as const satisfies readonly TextMode[];

export const textAlignments = [
  "left",
  "center",
  "right",
] as const satisfies readonly TextAlignment[];

export type TextAttachmentPlacement =
  | "above"
  | "below"
  | "left"
  | "right"
  | "above-left"
  | "above-right"
  | "below-left"
  | "below-right"
  | "midpoint"
  | "start"
  | "end"
  | "center"
  | "top"
  | "bottom"
  | "edge-midpoint"
  | "vertex"
  | "inside"
  | "near-arc"
  | "inside-angle"
  | "outside-angle";

export type TextAttachmentMetadata = {
  readonly targetObjectId: string;
  readonly placement: TextAttachmentPlacement;
  readonly offset?: Point2D;
};

const pointPlacements = [
  "above",
  "below",
  "left",
  "right",
  "above-left",
  "above-right",
  "below-left",
  "below-right",
] as const satisfies readonly TextAttachmentPlacement[];

const linearPlacements = [
  "midpoint",
  "above",
  "below",
  "left",
  "right",
  "start",
  "end",
] as const satisfies readonly TextAttachmentPlacement[];

const circlePlacements = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
] as const satisfies readonly TextAttachmentPlacement[];

const polygonPlacements = [
  "center",
  "edge-midpoint",
  "vertex",
  "inside",
] as const satisfies readonly TextAttachmentPlacement[];

const anglePlacements = [
  "near-arc",
  "inside-angle",
  "outside-angle",
] as const satisfies readonly TextAttachmentPlacement[];

export function getTextPlacementOptionsForTarget(
  target: GeometryObject | null | undefined,
): readonly TextAttachmentPlacement[] {
  if (!target) {
    return [];
  }

  if (target.type === "point") {
    return pointPlacements;
  }

  if (
    target.type === "segment" ||
    target.type === "line" ||
    target.type === "ray" ||
    target.type === "vector"
  ) {
    return linearPlacements;
  }

  if (target.type === "circle") {
    return circlePlacements;
  }

  if (target.type === "polygon") {
    return polygonPlacements;
  }

  if (target.type === "angle") {
    return anglePlacements;
  }

  return [];
}

export function getDefaultTextPlacementForTarget(
  target: GeometryObject | null | undefined,
): TextAttachmentPlacement {
  return getTextPlacementOptionsForTarget(target)[0] ?? "above";
}

export function isTextAttachmentTarget(
  target: GeometryObject | null | undefined,
): target is Extract<GeometryObject, {
  readonly type: "point" | "segment" | "line" | "ray" | "vector" | "circle" | "polygon" | "angle";
}> {
  return getTextPlacementOptionsForTarget(target).length > 0;
}

function metadataNumber(
  object: TextObject,
  key: string,
  fallback: number,
): number {
  const value = object.metadata?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function metadataString<TValue extends string>(
  object: TextObject,
  key: string,
  values: readonly TValue[],
  fallback: TValue,
): TValue {
  const value = object.metadata?.[key];

  return typeof value === "string" && values.includes(value as TValue)
    ? value as TValue
    : fallback;
}

export function getTextFontSize(object: TextObject): number {
  return Math.max(6, metadataNumber(object, "fontSize", object.style.labelSize));
}

export function getTextRotation(object: TextObject): number {
  return metadataNumber(object, "rotation", 0);
}

export function getTextAlignment(object: TextObject): TextAlignment {
  return metadataString(object, "alignment", textAlignments, "left");
}

export function getTextOpacity(object: TextObject): number {
  return Math.min(1, Math.max(0, metadataNumber(object, "opacity", object.style.strokeOpacity)));
}

function metadataPoint(object: TextObject, key: string): Point2D | null {
  const value = object.metadata?.[key];

  if (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    typeof value.y === "number" &&
    Number.isFinite(value.y)
  ) {
    return {
      x: value.x,
      y: value.y,
    };
  }

  return null;
}

export function getTextAttachment(object: TextObject): TextAttachmentMetadata | null {
  const targetObjectId = object.metadata?.targetObjectId;
  const placement = object.metadata?.placement;

  if (
    typeof targetObjectId === "string" &&
    typeof placement === "string" &&
    isTextPlacement(placement)
  ) {
    const offset = metadataPoint(object, "offset");

    return {
      placement,
      targetObjectId,
      ...(offset ? { offset } : {}),
    };
  }

  return null;
}

function isTextPlacement(value: string): value is TextAttachmentPlacement {
  return [
    ...pointPlacements,
    ...linearPlacements,
    ...circlePlacements,
    ...polygonPlacements,
    ...anglePlacements,
  ].includes(value as TextAttachmentPlacement);
}

function add(point: Point2D, delta: Point2D): Point2D {
  return {
    x: point.x + delta.x,
    y: point.y + delta.y,
  };
}

function withOffset(point: Point2D, offset: Point2D | undefined): Point2D {
  return offset ? add(point, offset) : point;
}

function pointDelta(placement: TextAttachmentPlacement): Point2D {
  const gap = 0.35;

  return {
    x: placement.includes("left") ? -gap : placement.includes("right") ? gap : 0,
    y: placement.includes("below") ? -gap : placement.includes("above") ? gap : 0,
  };
}

function linearEndpoints(
  target: GeometryObject,
  objects: GeometryObjectRecord,
): readonly [Point2D, Point2D] | null {
  if (target.type === "segment" || target.type === "vector") {
    const start = getPointObject(objects, target.startPointId);
    const end = getPointObject(objects, target.endPointId);

    return start && end ? [start, end] : null;
  }

  if (target.type === "ray") {
    const start = getPointObject(objects, target.startPointId);
    const end = getPointObject(objects, target.throughPointId);

    return start && end ? [start, end] : null;
  }

  if (target.type === "line") {
    const start = getPointObject(objects, target.pointAId);
    const end = getPointObject(objects, target.pointBId);

    return start && end ? [start, end] : null;
  }

  return null;
}

function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function normalizedPerpendicular(a: Point2D, b: Point2D): Point2D {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.max(distance(a, b), 1);

  return {
    x: -dy / length,
    y: dx / length,
  };
}

function polygonCenter(points: readonly Point2D[]): Point2D {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  const signedArea = polygonArea(points);

  if (Math.abs(signedArea) <= 1e-9) {
    const sum = points.reduce((acc, point) => add(acc, point), { x: 0, y: 0 });

    return {
      x: sum.x / points.length,
      y: sum.y / points.length,
    };
  }

  let cx = 0;
  let cy = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];

    if (!current || !next) {
      continue;
    }

    const cross = current.x * next.y - next.x * current.y;
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  return {
    x: cx / (6 * signedArea),
    y: cy / (6 * signedArea),
  };
}

function textPositionForAttachment(
  target: GeometryObject,
  placement: TextAttachmentPlacement,
  objects: GeometryObjectRecord,
): Point2D | null {
  if (target.type === "point") {
    return add(target, pointDelta(placement));
  }

  const linear = linearEndpoints(target, objects);

  if (linear) {
    const [start, end] = linear;
    const middle = midpoint(start, end);
    const normal = normalizedPerpendicular(start, end);
    const gap = 0.35;

    if (placement === "start") {
      return start;
    }

    if (placement === "end") {
      return end;
    }

    if (placement === "above") {
      return add(middle, { x: normal.x * gap, y: normal.y * gap });
    }

    if (placement === "below") {
      return add(middle, { x: -normal.x * gap, y: -normal.y * gap });
    }

    if (placement === "left") {
      return add(middle, { x: -gap, y: 0 });
    }

    if (placement === "right") {
      return add(middle, { x: gap, y: 0 });
    }

    return middle;
  }

  if (target.type === "circle") {
    const circle = getCircleGeometry(target, objects);

    if (!circle) {
      return null;
    }

    if (placement === "top") {
      return add(circle.center, { x: 0, y: circle.radius + 0.35 });
    }

    if (placement === "bottom") {
      return add(circle.center, { x: 0, y: -circle.radius - 0.35 });
    }

    if (placement === "left") {
      return add(circle.center, { x: -circle.radius - 0.35, y: 0 });
    }

    if (placement === "right") {
      return add(circle.center, { x: circle.radius + 0.35, y: 0 });
    }

    return circle.center;
  }

  if (target.type === "polygon") {
    const points = getPolygonPoints(target, objects);

    if (!points) {
      return null;
    }

    if (placement === "edge-midpoint") {
      const first = points[0];
      const second = points[1];

      return first && second ? midpoint(first, second) : polygonCenter(points);
    }

    if (placement === "vertex") {
      return points[0] ?? polygonCenter(points);
    }

    return polygonCenter(points);
  }

  if (target.type === "angle") {
    const pointA = getPointObject(objects, target.pointAId);
    const vertex = getPointObject(objects, target.vertexPointId);
    const pointC = getPointObject(objects, target.pointCId);

    if (!pointA || !vertex || !pointC) {
      return null;
    }

    const armA = { x: pointA.x - vertex.x, y: pointA.y - vertex.y };
    const armC = { x: pointC.x - vertex.x, y: pointC.y - vertex.y };
    const lenA = Math.max(distance(pointA, vertex), 1);
    const lenC = Math.max(distance(pointC, vertex), 1);
    const direction = {
      x: armA.x / lenA + armC.x / lenC,
      y: armA.y / lenA + armC.y / lenC,
    };
    const directionLength = Math.max(Math.hypot(direction.x, direction.y), 1);
    const radius =
      placement === "outside-angle"
        ? target.radius + 0.5
        : placement === "inside-angle"
          ? Math.max(target.radius * 0.55, 0.25)
          : target.radius + 0.2;

    return {
      x: vertex.x + (direction.x / directionLength) * radius,
      y: vertex.y + (direction.y / directionLength) * radius,
    };
  }

  return null;
}

export function getTextPosition(
  object: TextObject,
  objects: GeometryObjectRecord,
): Point2D {
  const attachment = getTextAttachment(object);

  if (attachment) {
    const target = objects[attachment.targetObjectId];
    const position = target
      ? textPositionForAttachment(target, attachment.placement, objects)
      : null;

    if (position) {
      return withOffset(position, attachment.offset);
    }
  }

  const parentId = object.dependencies[0];
  const parent = parentId ? objects[parentId] : null;

  if (object.metadata?.followObject === true && parent?.type === "point") {
    return {
      x: parent.x + object.x,
      y: parent.y + object.y,
    };
  }

  return {
    x: object.x,
    y: object.y,
  };
}

export function normalizeTextMode(value: string | null): TextMode {
  return textModes.includes(value as TextMode) ? value as TextMode : "plain";
}
