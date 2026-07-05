import { useGeometryStore } from "../../../app/store/geometryStore";
import type { Point2D, PointObject, SegmentObject } from "../../geometry";
import type { ContextMenuAction } from "../ContextMenuTypes";
import { getSegmentPoints, getTargetObject } from "../ContextMenuHelpers";

let duplicateIdCounter = 0;

function createDuplicateId(prefix: string): string {
  duplicateIdCounter += 1;

  return `${prefix}-${Date.now().toString(36)}-${duplicateIdCounter}`;
}

function clonePointAsFree(point: PointObject, offset: Point2D): PointObject {
  const now = Date.now();
  const { construction, ...basePoint } = point;

  void construction;

  return {
    ...basePoint,
    createdAt: now,
    dependencies: [],
    dependents: [],
    id: createDuplicateId("point-copy"),
    locked: false,
    name: point.name ? `${point.name}'` : "Point Copy",
    pointKind: "free",
    updatedAt: now,
    visible: true,
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
}

function cloneSegmentWithPoints(
  segment: SegmentObject,
  objects: Parameters<typeof getSegmentPoints>[1],
): readonly [PointObject, PointObject, SegmentObject] | null {
  const points = getSegmentPoints(segment, objects);

  if (!points) {
    return null;
  }

  const [start, end] = points;
  const offset = { x: 0.45, y: 0.45 };
  const startCopy = clonePointAsFree(start, offset);
  const endCopy = clonePointAsFree(end, offset);
  const now = Date.now();
  const segmentCopy: SegmentObject = {
    ...segment,
    createdAt: now,
    dependencies: [startCopy.id, endCopy.id],
    dependents: [],
    endPointId: endCopy.id,
    id: createDuplicateId("segment-copy"),
    locked: false,
    name: segment.name ? `${segment.name}'` : "Segment Copy",
    startPointId: startCopy.id,
    updatedAt: now,
    visible: true,
  };

  return [startCopy, endCopy, segmentCopy];
}

export const duplicateObjectAction: ContextMenuAction = {
  execute: (context) => {
    const object = getTargetObject(context);

    if (!object) {
      return;
    }

    const geometry = useGeometryStore.getState();

    if (object.type === "point") {
      const copy = clonePointAsFree(object, { x: 0.45, y: 0.45 });

      if (geometry.addObject(copy)) {
        geometry.selectObject(copy.id);
      }

      return;
    }

    if (object.type === "segment") {
      const copies = cloneSegmentWithPoints(object, geometry.objects);

      if (!copies) {
        return;
      }

      const [startCopy, endCopy, segmentCopy] = copies;

      geometry.beginHistoryTransaction("create", "Duplicate segment");
      geometry.addObject(startCopy);
      geometry.addObject(endCopy);
      geometry.addObject(segmentCopy);
      geometry.selectObject(segmentCopy.id);
      geometry.commitHistoryTransaction();
    }
  },
  icon: "duplicate",
  id: "duplicate",
  isEnabled: (context) => {
    const object = getTargetObject(context);

    return Boolean(object && !object.locked && (object.type === "point" || object.type === "segment"));
  },
  shortcut: "Ctrl+D",
  targets: ["point", "segment"],
};

