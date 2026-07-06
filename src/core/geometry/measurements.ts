import {
  angleDegrees,
  distance,
  polygonArea,
} from "./math";
import {
  getArcGeometry,
  getCircleGeometry,
  getPointObject,
  getPolygonPoints,
  getRegionArea,
} from "./derivedGeometry";
import type {
  AngleObject,
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
  return getPointObject(objects, pointId);
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
  return getPolygonPoints(object, objects);
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
    const circle = getCircleGeometry(target, objects);
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

  if (target?.type === "arc" && measurement.measurementType === "arc-length") {
    const arc = getArcGeometry(target, objects);

    if (!arc) {
      return null;
    }

    const delta =
      target.direction === "counterclockwise"
        ? (arc.endAngleDegrees - arc.startAngleDegrees + 360) % 360
        : (arc.startAngleDegrees - arc.endAngleDegrees + 360) % 360;

    return arc.radius * ((delta || 360) * Math.PI / 180);
  }

  if (target?.type === "region" && measurement.measurementType === "region-area") {
    return getRegionArea(target, objects);
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
    const circle = getCircleGeometry(target, objects);

    point = circle
      ? { x: circle.center.x + circle.radius, y: circle.center.y }
      : point;
  } else if (target?.type === "arc") {
    const arc = getArcGeometry(target, objects);

    point = arc
      ? {
          x: arc.center.x + arc.radius,
          y: arc.center.y,
        }
      : point;
  } else if (target?.type === "region") {
    point = averagePoint(getPolygonPoints(target, objects) ?? [point]);
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
    (target.type === "arc" && measurementType === "arc-length") ||
    (target.type === "region" && measurementType === "region-area") ||
    (target.type === "angle" && measurementType === "angle-value")
  );
}
