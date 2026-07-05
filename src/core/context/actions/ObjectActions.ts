import { useGeometryStore } from "../../../app/store/geometryStore";
import { distance, type GeometryObject } from "../../geometry";
import type { ContextMenuAction } from "../ContextMenuTypes";
import {
  detailFromValue,
  disabled,
  formatNumber,
  getAngleDetail,
  getCircleRadius,
  getPolygonAreaDetail,
  getPolygonPerimeter,
  getSegmentPoints,
  getTargetObject,
  isObjectTarget,
  isUnlockedObject,
} from "../ContextMenuHelpers";
import { duplicateObjectAction } from "./ObjectDuplicateActions";

export const objectContextMenuActions: readonly ContextMenuAction[] = [
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
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
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
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
  },
  duplicateObjectAction,
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
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
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
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
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
    getDetail: getPolygonAreaDetail,
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
    getDetail: getAngleDetail,
    icon: "angle",
    id: "angle-value",
    isEnabled: disabled,
    targets: ["angle"],
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
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
  },
];
