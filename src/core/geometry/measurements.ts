import {
  angleDegrees,
  distance,
  polygonArea,
} from "./math";
import type {
  AngleObject,
  CircleObject,
  GeometryObject,
  GeometryObjectRecord,
  MeasurementObject,
  MeasurementType,
  Point2D,
  PointObject,
  PolygonObject,
  SegmentObject,
} from "./types";

const labelOffsets = {
  above: { x: 0, y: 0.35 },
  "above-left": { x: -0.35, y: 0.35 },
  "above-right": { x: 0.35, y: 0.35 },
  below: { x: 0, y: -0.35 },
  "below-left": { x: -0.35, y: -0.35 },
  "below-right": { x: 0.35, y: -0.35 },
  left: { x: -0.35, y: 0 },
  right: { x: 0.35, y: 0 },
} satisfies Record<MeasurementObject["labelPosition"], Point2D>;

function getPoint(objects: GeometryObjectRecord, pointId: string): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

export function getCircleMeasurementGeometry(
  object: CircleObject,
  objects: GeometryObjectRecord,
): { readonly center: PointObject; readonly radius: number } | null {
  if (object.circleKind === "three-points") {
    return null;
  }

  const center = getPoint(objects, object.centerPointId);

  if (!center) {
    return null;
  }

  if (object.circleKind === "center-radius") {
    return { center, radius: object.radius };
  }

  const radiusPoint = getPoint(objects, object.radiusPointId);

  return radiusPoint ? { center, radius: distance(center, radiusPoint) } : null;
}

function segmentLength(object: SegmentObject, objects: GeometryObjectRecord): number | null {
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  return start && end ? distance(start, end) : null;
}

function polygonPoints(
  object: PolygonObject,
  objects: GeometryObjectRecord,
): readonly PointObject[] | null {
  const points = object.pointIds.map((pointId) => getPoint(objects, pointId));

  return points.some((point) => point === null)
    ? null
    : points.filter((point): point is PointObject => Boolean(point));
}

function polygonPerimeter(object: PolygonObject, objects: GeometryObjectRecord): number | null {
  const points = polygonPoints(object, objects);

  if (!points) {
    return null;
  }

  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];

    return next ? sum + distance(point, next) : sum;
  }, 0);
}

function angleValue(object: AngleObject, objects: GeometryObjectRecord): number | null {
  const pointA = getPoint(objects, object.pointAId);
  const vertex = getPoint(objects, object.vertexPointId);
  const pointC = getPoint(objects, object.pointCId);

  return pointA && vertex && pointC ? angleDegrees(pointA, vertex, pointC) : null;
}

export function measureValue(
  measurement: MeasurementObject,
  objects: GeometryObjectRecord,
): number | null {
  const target = objects[measurement.targetObjectId];

  if (measurement.measurementType === "segment-length" && target?.type === "segment") {
    return segmentLength(target, objects);
  }

  if (target?.type === "polygon" && measurement.measurementType === "polygon-perimeter") {
    return polygonPerimeter(target, objects);
  }

  if (target?.type === "polygon" && measurement.measurementType === "polygon-area") {
    const points = polygonPoints(target, objects);

    return points ? Math.abs(polygonArea(points)) : null;
  }

  if (target?.type === "circle") {
    const circle = getCircleMeasurementGeometry(target, objects);
    const radius = circle?.radius ?? null;

    if (radius === null) {
      return null;
    }

    if (measurement.measurementType === "circle-radius") {
      return radius;
    }

    if (measurement.measurementType === "circle-diameter") {
      return radius * 2;
    }

    if (measurement.measurementType === "circle-circumference") {
      return 2 * Math.PI * radius;
    }

    if (measurement.measurementType === "circle-area") {
      return Math.PI * radius * radius;
    }
  }

  return target?.type === "angle" && measurement.measurementType === "angle-value"
    ? angleValue(target, objects)
    : null;
}

export function formatMeasurementValue(
  measurement: MeasurementObject,
  objects: GeometryObjectRecord,
): string {
  const value = measureValue(measurement, objects);
  const precision = measurement.precision ?? 2;

  if (value === null) {
    return "Unavailable";
  }

  const formatted = Number(value.toFixed(precision));
  const text = Object.is(formatted, -0) ? "0" : String(formatted);

  return measurement.measurementType === "angle-value" ? `${text}°` : text;
}

function averagePoint(points: readonly Point2D[]): Point2D {
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

export function getMeasurementAnchorPoint(
  measurement: MeasurementObject,
  objects: GeometryObjectRecord,
): Point2D {
  const target = objects[measurement.targetObjectId] as GeometryObject | undefined;
  let point: Point2D = { x: 0, y: 0 };

  if (target?.type === "segment") {
    const start = getPoint(objects, target.startPointId);
    const end = getPoint(objects, target.endPointId);

    point = start && end ? averagePoint([start, end]) : point;
  } else if (target?.type === "polygon") {
    point = averagePoint(polygonPoints(target, objects) ?? [point]);
  } else if (target?.type === "circle") {
    const circle = getCircleMeasurementGeometry(target, objects);

    point = circle
      ? { x: circle.center.x + circle.radius, y: circle.center.y }
      : point;
  } else if (target?.type === "angle") {
    const vertex = getPoint(objects, target.vertexPointId);

    point = vertex ? { x: vertex.x + target.radius, y: vertex.y } : point;
  }

  const offset = labelOffsets[measurement.labelPosition];

  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

export function isMeasurementTypeSupported(
  target: GeometryObject,
  measurementType: MeasurementType,
): boolean {
  return (
    (target.type === "segment" && measurementType === "segment-length") ||
    (target.type === "polygon" &&
      (measurementType === "polygon-area" || measurementType === "polygon-perimeter")) ||
    (target.type === "circle" && measurementType.startsWith("circle-")) ||
    (target.type === "angle" && measurementType === "angle-value")
  );
}
