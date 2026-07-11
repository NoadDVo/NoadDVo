import type { GeometryObject, GeometryObjectRecord, Point2D, ScreenPoint } from "../geometry";
import type { Viewport } from "../geometry/viewport";
import { boxFromCorners, boxIntersectsBox, getBoundingBox } from "./BoundingBox";
import { hitTest } from "./HitTest";

export function getObjectAtPoint(
  screenPoint: ScreenPoint,
  worldPoint: Point2D,
  objects: GeometryObjectRecord,
  viewport: Viewport,
): GeometryObject | null {
  return hitTest(screenPoint, worldPoint, objects, viewport)?.object ?? null;
}

export function getObjectIdsInSelectionBox(
  start: Point2D,
  end: Point2D,
  objects: GeometryObjectRecord,
): readonly string[] {
  const selectionBox = boxFromCorners(start, end);

  return Object.values(objects)
    .filter((object) => object.visible)
    .filter((object) => {
      const boundingBox = getBoundingBox(object, objects);

      return boundingBox ? boxIntersectsBox(selectionBox, boundingBox) : false;
    })
    .map((object) => object.id);
}

export function getVisibleObjectIds(objects: GeometryObjectRecord): readonly string[] {
  return Object.values(objects)
    .filter((object) => object.visible)
    .map((object) => object.id);
}
