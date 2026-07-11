import {
  EPSILON,
  distance,
  isFiniteNumber,
  pointsAlmostEqual,
  polygonArea,
} from "./math";
import { validateDependencyGraph } from "./dependency";
import type {
  AngleObject,
  CircleObject,
  GeometryError,
  GeometryObject,
  GeometryObjectRecord,
  ImageObject,
  DistanceObject,
  AreaObject,
  PointObject,
  RegionObject,
  TextObject,
  ValidationResult,
} from "./types";
import { getArcGeometry, getPolygonPoints } from "./derivedGeometry";
import { getRegionBoundaryPath } from "./regionGeometry";

function invalid(
  code: string,
  message: string,
  objectId?: string,
): ValidationResult {
  const error: GeometryError = {
    code,
    message,
    severity: "error",
    ...(objectId ? { objectId } : {}),
  };

  return { error, valid: false };
}

function valid(): ValidationResult {
  return { valid: true };
}

function getPoint(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

function validateDistinctPoints(
  objectId: string,
  objects: GeometryObjectRecord,
  firstPointId: string,
  secondPointId: string,
): ValidationResult {
  const first = getPoint(objects, firstPointId);
  const second = getPoint(objects, secondPointId);

  if (!first || !second) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Referenced point does not exist.",
      objectId,
    );
  }

  if (pointsAlmostEqual(first, second)) {
    return invalid(
      "GEOMETRY_DUPLICATE_POINT",
      "Geometry requires two distinct points.",
      objectId,
    );
  }

  return valid();
}

function validatePoint(object: PointObject): ValidationResult {
  if (!isFiniteNumber(object.x) || !isFiniteNumber(object.y)) {
    return invalid(
      "GEOMETRY_INVALID_POINT",
      "Point coordinates must be finite numbers.",
      object.id,
    );
  }

  return valid();
}

function validateCircle(
  object: CircleObject,
  objects: GeometryObjectRecord,
): ValidationResult {
  if (object.circleKind === "center-radius") {
    if (!getPoint(objects, object.centerPointId)) {
      return invalid(
        "GEOMETRY_MISSING_CENTER",
        "Circle center point does not exist.",
        object.id,
      );
    }

    if (!isFiniteNumber(object.radius) || object.radius <= EPSILON) {
      return invalid(
        "GEOMETRY_INVALID_RADIUS",
        "Circle radius must be greater than zero.",
        object.id,
      );
    }

    return valid();
  }

  if (object.circleKind === "center-point") {
    const result = validateDistinctPoints(
      object.id,
      objects,
      object.centerPointId,
      object.radiusPointId,
    );

    if (!result.valid) {
      return result;
    }

    return valid();
  }

  const pointA = getPoint(objects, object.pointAId);
  const pointB = getPoint(objects, object.pointBId);
  const pointC = getPoint(objects, object.pointCId);

  if (!pointA || !pointB || !pointC) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Circle through three points requires existing points.",
      object.id,
    );
  }

  const area = polygonArea([pointA, pointB, pointC]);

  if (Math.abs(area) <= EPSILON) {
    return invalid(
      "GEOMETRY_COLLINEAR_POINTS",
      "Circle through three points requires non-collinear points.",
      object.id,
    );
  }

  return valid();
}

function validatePolygon(
  object: GeometryObject & { readonly type: "polygon" },
  objects: GeometryObjectRecord,
): ValidationResult {
  if (object.pointIds.length < 3) {
    return invalid(
      "GEOMETRY_INVALID_POLYGON",
      "Polygon requires at least three points.",
      object.id,
    );
  }

  const points = object.pointIds.map((pointId) => getPoint(objects, pointId));

  if (points.some((point) => point === null)) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Polygon references a missing point.",
      object.id,
    );
  }

  const polygonPoints = points.filter((point): point is PointObject => Boolean(point));

  for (let index = 0; index < polygonPoints.length; index += 1) {
    const current = polygonPoints[index];
    const next = polygonPoints[(index + 1) % polygonPoints.length];

    if (current && next && pointsAlmostEqual(current, next)) {
      return invalid(
        "GEOMETRY_DUPLICATE_POINT",
        "Polygon neighboring points must be distinct.",
        object.id,
      );
    }
  }

  if (Math.abs(polygonArea(polygonPoints)) <= EPSILON) {
    return invalid(
      "GEOMETRY_ZERO_AREA",
      "Polygon area must not be zero.",
      object.id,
    );
  }

  return valid();
}

function validateRegion(
  object: RegionObject,
  objects: GeometryObjectRecord,
): ValidationResult {
  if (object.regionKind === "boundary") {
    if (!object.loops?.length) {
      return invalid(
        "GEOMETRY_INVALID_REGION",
        "Boundary region requires at least one closed loop.",
        object.id,
      );
    }

    if (object.loops.some((loop) => !loop.closed || loop.edges.length === 0)) {
      return invalid(
        "GEOMETRY_INVALID_REGION",
        "Boundary region loops must be closed and non-empty.",
        object.id,
      );
    }

    return getRegionBoundaryPath(object, objects)
      ? valid()
      : invalid(
          "GEOMETRY_INVALID_REGION",
          "Boundary region references an invalid edge.",
          object.id,
        );
  }

  if (object.boundaryPointIds.length < 3) {
    return invalid(
      "GEOMETRY_INVALID_REGION",
      "Region requires at least three boundary points.",
      object.id,
    );
  }

  const points = getPolygonPoints(object, objects);

  if (!points) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Region references a missing boundary point.",
      object.id,
    );
  }

  if (Math.abs(polygonArea(points)) <= EPSILON) {
    return invalid(
      "GEOMETRY_ZERO_AREA",
      "Region area must not be zero.",
      object.id,
    );
  }

  return valid();
}

function validateArc(
  object: GeometryObject & { readonly type: "arc" },
  objects: GeometryObjectRecord,
): ValidationResult {
  const center = getPoint(objects, object.centerPointId);
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  if (!center || !start || !end) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Arc requires existing center, start, and end points.",
      object.id,
    );
  }

  if (distance(center, start) <= EPSILON || distance(center, end) <= EPSILON) {
    return invalid(
      "GEOMETRY_INVALID_ARC",
      "Arc radius must be greater than zero.",
      object.id,
    );
  }

  if (!getArcGeometry(object, objects)) {
    return invalid(
      "GEOMETRY_INVALID_ARC_RADIUS",
      "Arc start and end points must be the same distance from the center.",
      object.id,
    );
  }

  return valid();
}

function validateAngle(
  object: AngleObject,
  objects: GeometryObjectRecord,
): ValidationResult {
  const pointA = getPoint(objects, object.pointAId);
  const vertex = getPoint(objects, object.vertexPointId);
  const pointC = getPoint(objects, object.pointCId);

  if (!pointA || !vertex || !pointC) {
    return invalid(
      "GEOMETRY_MISSING_POINT",
      "Angle requires three existing points.",
      object.id,
    );
  }

  if (distance(pointA, vertex) <= EPSILON || distance(pointC, vertex) <= EPSILON) {
    return invalid(
      "GEOMETRY_INVALID_ANGLE",
      "Angle arms must use points distinct from the vertex.",
      object.id,
    );
  }

  if (!isFiniteNumber(object.radius) || object.radius <= 0) {
    return invalid(
      "GEOMETRY_INVALID_RADIUS",
      "Angle radius must be greater than zero.",
      object.id,
    );
  }

  return valid();
}

function validateText(object: TextObject): ValidationResult {
  if (!isFiniteNumber(object.x) || !isFiniteNumber(object.y)) {
    return invalid(
      "GEOMETRY_INVALID_TEXT_POSITION",
      "Text position must use finite coordinates.",
      object.id,
    );
  }

  if (typeof object.content !== "string") {
    return invalid(
      "GEOMETRY_INVALID_TEXT",
      "Text content must be a string.",
      object.id,
    );
  }

  return valid();
}

function validateImage(object: ImageObject): ValidationResult {
  if (!isFiniteNumber(object.x) || !isFiniteNumber(object.y)) {
    return invalid(
      "GEOMETRY_INVALID_IMAGE_POSITION",
      "Image position must use finite coordinates.",
      object.id,
    );
  }

  if (!isFiniteNumber(object.width) || object.width <= EPSILON) {
    return invalid(
      "GEOMETRY_INVALID_IMAGE_SIZE",
      "Image width must be greater than zero.",
      object.id,
    );
  }

  if (!isFiniteNumber(object.height) || object.height <= EPSILON) {
    return invalid(
      "GEOMETRY_INVALID_IMAGE_SIZE",
      "Image height must be greater than zero.",
      object.id,
    );
  }

  if (!isFiniteNumber(object.opacity) || object.opacity < 0 || object.opacity > 1) {
    return invalid(
      "GEOMETRY_INVALID_IMAGE_OPACITY",
      "Image opacity must be between 0 and 1.",
      object.id,
    );
  }

  if (typeof object.src !== "string" || object.src.length === 0) {
    return invalid(
      "GEOMETRY_INVALID_IMAGE_SOURCE",
      "Image source must be available.",
      object.id,
    );
  }

  return valid();
}

function validateDistance(
  object: DistanceObject,
  objects: GeometryObjectRecord,
): ValidationResult {
  if (object.distanceKind === "segment") {
    const segment = objects[object.segmentId!];
    if (!segment || segment.type !== "segment") {
      return invalid("GEOMETRY_MISSING_TARGET", "Distance target segment not found.", object.id);
    }
  } else if (object.distanceKind === "two-points") {
    const pointA = objects[object.pointAId!];
    const pointB = objects[object.pointBId!];
    if (!pointA || pointA.type !== "point" || !pointB || pointB.type !== "point") {
      return invalid("GEOMETRY_MISSING_TARGET", "Distance target points not found.", object.id);
    }
  }
  return valid();
}

function validateArea(
  object: AreaObject,
  objects: GeometryObjectRecord,
): ValidationResult {
  const target = objects[object.polygonId];
  if (!target || target.type !== "polygon") {
    return invalid("GEOMETRY_MISSING_TARGET", "Area target polygon not found.", object.id);
  }
  return valid();
}

export function validateGeometryObject(
  object: GeometryObject,
  objects: GeometryObjectRecord = {},
): ValidationResult {
  const sceneObjects = { ...objects, [object.id]: object };

  switch (object.type) {
    case "point":
      return validatePoint(object);
    case "segment":
      return validateDistinctPoints(
        object.id,
        sceneObjects,
        object.startPointId,
        object.endPointId,
      );
    case "line":
      return validateDistinctPoints(
        object.id,
        sceneObjects,
        object.pointAId,
        object.pointBId,
      );
    case "ray":
      return validateDistinctPoints(
        object.id,
        sceneObjects,
        object.startPointId,
        object.throughPointId,
      );
    case "vector":
      return validateDistinctPoints(
        object.id,
        sceneObjects,
        object.startPointId,
        object.endPointId,
      );
    case "circle":
      return validateCircle(object, sceneObjects);
    case "arc":
      return validateArc(object, sceneObjects);
    case "polygon":
      return validatePolygon(object, sceneObjects);
    case "angle":
      return validateAngle(object, sceneObjects);
    case "text":
      return validateText(object);
    case "image":
      return validateImage(object);
    case "region":
      return validateRegion(object, sceneObjects);
    case "distance":
      return validateDistance(object, objects);
    case "area":
      return validateArea(object, objects);
    default:
      return valid();
  }
}

export function validateGeometryObjects(
  objects: GeometryObjectRecord,
): ValidationResult {
  const dependencyError = validateDependencyGraph(objects);

  if (dependencyError) {
    return { error: dependencyError, valid: false };
  }

  for (const object of Object.values(objects)) {
    const result = validateGeometryObject(object, objects);

    if (!result.valid) {
      return result;
    }
  }

  return valid();
}
