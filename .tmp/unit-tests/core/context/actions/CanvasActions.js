"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasContextMenuActions = void 0;
exports.fitViewportToObjects = fitViewportToObjects;
const geometryStore_1 = require("../../../app/store/geometryStore");
const uiStore_1 = require("../../../app/store/uiStore");
const viewportStore_1 = require("../../../app/store/viewportStore");
const viewport_1 = require("../../geometry/viewport");
const PointTool_1 = require("../../tools/PointTool");
const BoundingBox_1 = require("../../selection/BoundingBox");
function fitViewportToObjects(objects) {
    const boxes = Object.values(objects)
        .filter((object) => object.visible)
        .map((object) => (0, BoundingBox_1.getBoundingBox)(object, objects))
        .filter((box) => Boolean(box));
    if (boxes.length === 0) {
        viewportStore_1.useViewportStore.getState().resetViewport();
        return;
    }
    const firstBox = boxes[0];
    if (!firstBox) {
        return;
    }
    const bounds = boxes.reduce((acc, box) => ({
        maxX: Math.max(acc.maxX, box.maxX),
        maxY: Math.max(acc.maxY, box.maxY),
        minX: Math.min(acc.minX, box.minX),
        minY: Math.min(acc.minY, box.minY),
    }), firstBox);
    const store = viewportStore_1.useViewportStore.getState();
    const viewport = store.viewport;
    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = (0, viewport_1.clampScale)(Math.min((viewport.width - 96) / width, (viewport.height - 96) / height));
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    store.setViewportState({
        ...viewport,
        offsetX: -centerX * scale,
        offsetY: centerY * scale,
        scale,
    });
}
exports.canvasContextMenuActions = [
    {
        execute: (context) => {
            if (context.target.kind !== "canvas") {
                return;
            }
            const point = (0, PointTool_1.createNamedFreePoint)(context.target.worldPoint, geometryStore_1.useGeometryStore.getState().objects);
            const geometry = geometryStore_1.useGeometryStore.getState();
            if (geometry.addObject(point)) {
                geometry.selectObject(point.id);
            }
        },
        icon: "plus",
        id: "new-point",
        targets: ["canvas"],
    },
    {
        execute: () => viewportStore_1.useViewportStore.getState().resetViewport(),
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
        execute: () => uiStore_1.useUiStore.getState().setOpenDialog("settings"),
        icon: "grid",
        id: "grid-settings",
        targets: ["canvas"],
    },
    {
        execute: () => uiStore_1.useUiStore.getState().setOpenDialog("settings"),
        icon: "settings",
        id: "canvas-settings",
        targets: ["canvas"],
    },
];
