"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectContextMenuActions = void 0;
const geometryStore_1 = require("../../../app/store/geometryStore");
const geometry_1 = require("../../geometry");
const ContextMenuHelpers_1 = require("../ContextMenuHelpers");
const ObjectDuplicateActions_1 = require("./ObjectDuplicateActions");
const geometryTargets = ["point", "segment", "line", "ray", "vector", "circle", "polygon", "region", "arc", "angle", "text", "measurement"];
exports.objectContextMenuActions = [
    {
        execute: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (!object) {
                return;
            }
            const nextName = window.prompt("Rename object", object.name ?? object.id);
            if (nextName === null) {
                return;
            }
            const trimmedName = nextName.trim();
            if (trimmedName) {
                geometryStore_1.useGeometryStore.getState().updateObject(object.id, {
                    ...object,
                    name: trimmedName,
                    updatedAt: Date.now(),
                });
                return;
            }
            const { name, ...objectWithoutName } = object;
            void name;
            geometryStore_1.useGeometryStore.getState().updateObject(object.id, {
                ...objectWithoutName,
                updatedAt: Date.now(),
            });
        },
        icon: "rename",
        id: "rename",
        isEnabled: ContextMenuHelpers_1.isObjectTarget,
        targets: geometryTargets,
    },
    {
        execute: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (object && !object.locked) {
                geometryStore_1.useGeometryStore.getState().deleteObject(object.id);
            }
        },
        icon: "delete",
        id: "delete",
        isEnabled: ContextMenuHelpers_1.isUnlockedObject,
        shortcut: "Delete",
        targets: geometryTargets,
    },
    ObjectDuplicateActions_1.duplicateObjectAction,
    {
        execute: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (!object) {
                return;
            }
            geometryStore_1.useGeometryStore.getState().updateObject(object.id, {
                ...object,
                updatedAt: Date.now(),
                visible: !object.visible,
            });
        },
        getLabel: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            return object?.visible === false ? "Show" : "Hide";
        },
        icon: "hide",
        id: "hide",
        targets: geometryTargets,
    },
    {
        execute: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (!object) {
                return;
            }
            geometryStore_1.useGeometryStore.getState().updateObject(object.id, {
                ...object,
                locked: !object.locked,
                updatedAt: Date.now(),
            });
        },
        getLabel: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            return object?.locked ? "Unlock" : "Lock";
        },
        icon: "lock",
        id: "lock",
        targets: geometryTargets,
    },
    {
        execute: () => undefined,
        getDetail: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            return object?.type === "point"
                ? `(${(0, ContextMenuHelpers_1.formatNumber)(object.x)}, ${(0, ContextMenuHelpers_1.formatNumber)(object.y)})`
                : null;
        },
        icon: "coordinates",
        id: "coordinates",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["point"],
    },
    {
        execute: () => undefined,
        getDetail: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (object?.type !== "segment") {
                return null;
            }
            const points = (0, ContextMenuHelpers_1.getSegmentPoints)(object, context.objects);
            return (0, ContextMenuHelpers_1.detailFromValue)("Length", points ? (0, geometry_1.distance)(points[0], points[1]) : null);
        },
        icon: "length",
        id: "length",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["segment"],
    },
    {
        execute: () => undefined,
        getDetail: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            return object ? (0, ContextMenuHelpers_1.detailFromValue)("Radius", (0, ContextMenuHelpers_1.getCircleRadius)(object, context.objects)) : null;
        },
        icon: "radius",
        id: "radius",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["circle"],
    },
    {
        execute: () => undefined,
        getDetail: ContextMenuHelpers_1.getPolygonAreaDetail,
        icon: "area",
        id: "area",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["polygon"],
    },
    {
        execute: () => undefined,
        getDetail: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            return object?.type === "polygon"
                ? (0, ContextMenuHelpers_1.detailFromValue)("Perimeter", (0, ContextMenuHelpers_1.getPolygonPerimeter)(object, context.objects))
                : null;
        },
        icon: "perimeter",
        id: "perimeter",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["polygon"],
    },
    {
        execute: () => undefined,
        getDetail: ContextMenuHelpers_1.getAngleDetail,
        icon: "angle",
        id: "angle-value",
        isEnabled: ContextMenuHelpers_1.disabled,
        targets: ["angle"],
    },
    {
        execute: (context) => {
            const object = (0, ContextMenuHelpers_1.getTargetObject)(context);
            if (object) {
                geometryStore_1.useGeometryStore.getState().selectObject(object.id);
            }
        },
        icon: "properties",
        id: "properties",
        targets: geometryTargets,
    },
];
