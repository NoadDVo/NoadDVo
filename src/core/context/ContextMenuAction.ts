import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import {
  angleDegrees,
  distance,
  polygonArea,
  type BoundingBox,
  type GeometryObject,
  type GeometryObjectRecord,
  type Point2D,
  type PointObject,
  type PolygonObject,
  type SegmentObject,
} from "../geometry";
import { clampScale } from "../geometry/viewport";
import { generateTikz } from "../tikz";
import { createNamedFreePoint } from "../tools/PointTool";
import { getBoundingBox } from "../selection/BoundingBox";
import type { ContextMenuAction, ContextMenuActionContext } from "./ContextMenuTypes";

let duplicateIdCounter = 0;

function getTargetObject(context: ContextMenuActionContext): GeometryObject | null {
  if (context.target.kind !== "object") {
    return null;
  }

  return context.objects[context.target.objectId] ?? null;
}

function getPoint(
  objects: GeometryObjectRecord,
  pointId: string,
): PointObject | null {
  const object = objects[pointId];

  return object?.type === "point" ? object : null;
}

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function getSegmentPoints(
  object: SegmentObject,
  objects: GeometryObjectRecord,
): readonly [PointObject, PointObject] | null {
  const start = getPoint(objects, object.startPointId);
  const end = getPoint(objects, object.endPointId);

  return start && end ? [start, end] : null;
}

function getCircleRadius(object: GeometryObject, objects: GeometryObjectRecord): number | null {
  if (object.type !== "circle") {
    return null;
  }

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

function getPolygonPoints(
  object: PolygonObject,
  objects: GeometryObjectRecord,
): readonly PointObject[] {
  return object.pointIds
    .map((pointId) => getPoint(objects, pointId))
    .filter((point): point is PointObject => Boolean(point));
}

function getPolygonPerimeter(
  object: PolygonObject,
  objects: GeometryObjectRecord,
): number | null {
  const points = getPolygonPoints(object, objects);

  if (points.length < 3) {
    return null;
  }

  return points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];

    return next ? sum + distance(point, next) : sum;
  }, 0);
}

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
  objects: GeometryObjectRecord,
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

function fitViewportToObjects(objects: GeometryObjectRecord): void {
  const boxes = Object.values(objects)
    .filter((object) => object.visible)
    .map((object) => getBoundingBox(object, objects))
    .filter((box): box is BoundingBox => Boolean(box));

  if (boxes.length === 0) {
    useViewportStore.getState().resetViewport();

    return;
  }

  const firstBox = boxes[0];

  if (!firstBox) {
    return;
  }

  const bounds = boxes.reduce(
    (acc, box) => ({
      maxX: Math.max(acc.maxX, box.maxX),
      maxY: Math.max(acc.maxY, box.maxY),
      minX: Math.min(acc.minX, box.minX),
      minY: Math.min(acc.minY, box.minY),
    }),
    firstBox,
  );

  if (!bounds) {
    return;
  }

  const store = useViewportStore.getState();
  const viewport = store.viewport;
  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = clampScale(Math.min((viewport.width - 96) / width, (viewport.height - 96) / height));
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  store.setViewportState({
    ...viewport,
    offsetX: -centerX * scale,
    offsetY: centerY * scale,
    scale,
  });
}

function disabled(): false {
  return false;
}

function isObjectTarget(context: ContextMenuActionContext): boolean {
  return context.target.kind === "object";
}

function isUnlockedObject(context: ContextMenuActionContext): boolean {
  const object = getTargetObject(context);

  return Boolean(object && !object.locked);
}

function detailFromValue(label: string, value: number | null): string {
  return value === null ? `${label} unavailable` : `${label} ${formatNumber(value)}`;
}

export const defaultContextMenuActions: readonly ContextMenuAction[] = [
  {
    execute: (context) => {
      if (context.target.kind !== "canvas") {
        return;
      }

      const point = createNamedFreePoint(
        context.target.worldPoint,
        useGeometryStore.getState().objects,
      );
      const geometry = useGeometryStore.getState();

      if (geometry.addObject(point)) {
        geometry.selectObject(point.id);
      }
    },
    icon: "plus",
    id: "new-point",
    targets: ["canvas"],
  },
  {
    execute: () => undefined,
    getDetail: () => "Coming soon",
    icon: "clipboard",
    id: "paste",
    isEnabled: disabled,
    shortcut: "Ctrl+V",
    targets: ["canvas"],
  },
  {
    execute: () => useViewportStore.getState().resetViewport(),
    icon: "reset-view",
    id: "reset-view",
    targets: ["canvas"],
  },
  {
    execute: (context) => fitViewportToObjects(context.objects),
    icon: "zoom-fit",
    id: "zoom-fit",
    targets: ["canvas"],
  },
  {
    execute: () => undefined,
    getDetail: () => "Coming soon",
    icon: "grid",
    id: "grid-settings",
    isEnabled: disabled,
    targets: ["canvas"],
  },
  {
    execute: () => undefined,
    getDetail: () => "Coming soon",
    icon: "settings",
    id: "canvas-settings",
    isEnabled: disabled,
    targets: ["canvas"],
  },
  {
    execute: (context) => {
      const object = getTargetObject(context);

      if (!object) {
        return;
      }

      const nextName = window.prompt("Rename object", object.name ?? object.id);

      if (nextName === null) {
        return;
      }

      const trimmedName = nextName.trim();

      if (trimmedName) {
        useGeometryStore.getState().updateObject(object.id, {
          ...object,
          name: trimmedName,
          updatedAt: Date.now(),
        });

        return;
      }

      const { name, ...objectWithoutName } = object;

      void name;
      useGeometryStore.getState().updateObject(object.id, {
        ...objectWithoutName,
        updatedAt: Date.now(),
      } as GeometryObject);
    },
    icon: "rename",
    id: "rename",
    isEnabled: isObjectTarget,
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
  {
    execute: (context) => {
      const object = getTargetObject(context);

      if (object && !object.locked) {
        useGeometryStore.getState().deleteObject(object.id);
      }
    },
    icon: "delete",
    id: "delete",
    isEnabled: isUnlockedObject,
    shortcut: "Delete",
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
  {
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
  },
  {
    execute: (context) => {
      const object = getTargetObject(context);

      if (!object) {
        return;
      }

      useGeometryStore.getState().updateObject(object.id, {
        ...object,
        updatedAt: Date.now(),
        visible: !object.visible,
      });
    },
    getLabel: (context) => {
      const object = getTargetObject(context);

      return object?.visible === false ? "Show" : "Hide";
    },
    icon: "hide",
    id: "hide",
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
  {
    execute: (context) => {
      const object = getTargetObject(context);

      if (!object) {
        return;
      }

      useGeometryStore.getState().updateObject(object.id, {
        ...object,
        locked: !object.locked,
        updatedAt: Date.now(),
      });
    },
    getLabel: (context) => {
      const object = getTargetObject(context);

      return object?.locked ? "Unlock" : "Lock";
    },
    icon: "lock",
    id: "lock",
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      return object?.type === "point"
        ? `(${formatNumber(object.x)}, ${formatNumber(object.y)})`
        : null;
    },
    icon: "coordinates",
    id: "coordinates",
    isEnabled: disabled,
    targets: ["point"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      if (object?.type !== "segment") {
        return null;
      }

      const points = getSegmentPoints(object, context.objects);

      return detailFromValue("Length", points ? distance(points[0], points[1]) : null);
    },
    icon: "length",
    id: "length",
    isEnabled: disabled,
    targets: ["segment"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      return object ? detailFromValue("Radius", getCircleRadius(object, context.objects)) : null;
    },
    icon: "radius",
    id: "radius",
    isEnabled: disabled,
    targets: ["circle"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      if (object?.type !== "polygon") {
        return null;
      }

      const points = getPolygonPoints(object, context.objects);

      return detailFromValue("Area", points.length >= 3 ? Math.abs(polygonArea(points)) : null);
    },
    icon: "area",
    id: "area",
    isEnabled: disabled,
    targets: ["polygon"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      return object?.type === "polygon"
        ? detailFromValue("Perimeter", getPolygonPerimeter(object, context.objects))
        : null;
    },
    icon: "perimeter",
    id: "perimeter",
    isEnabled: disabled,
    targets: ["polygon"],
  },
  {
    execute: () => undefined,
    getDetail: (context) => {
      const object = getTargetObject(context);

      if (object?.type !== "angle") {
        return null;
      }

      const pointA = getPoint(context.objects, object.pointAId);
      const vertex = getPoint(context.objects, object.vertexPointId);
      const pointC = getPoint(context.objects, object.pointCId);

      return detailFromValue(
        "Angle",
        pointA && vertex && pointC ? angleDegrees(pointA, vertex, pointC) : null,
      );
    },
    icon: "angle",
    id: "angle-value",
    isEnabled: disabled,
    targets: ["angle"],
  },
  {
    execute: async (context) => {
      const code = generateTikz(context.objects, "academic").code;

      await navigator.clipboard.writeText(code);
    },
    icon: "tikz",
    id: "copy-tikz",
    shortcut: "Ctrl+C",
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
  {
    execute: (context) => {
      const object = getTargetObject(context);

      if (object) {
        useGeometryStore.getState().selectObject(object.id);
      }
    },
    icon: "properties",
    id: "properties",
    targets: ["point", "segment", "line", "circle", "polygon", "angle"],
  },
];
