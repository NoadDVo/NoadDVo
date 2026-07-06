import { useGeometryStore } from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import type { BoundingBox, GeometryObjectRecord } from "../../geometry";
import { clampScale } from "../../geometry/viewport";
import { createNamedFreePoint } from "../../tools/PointTool";
import { getBoundingBox } from "../../selection/BoundingBox";
import { disabled } from "../ContextMenuHelpers";
import type { ContextMenuAction } from "../ContextMenuTypes";

export function fitViewportToObjects(objects: GeometryObjectRecord): void {
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

export const canvasContextMenuActions: readonly ContextMenuAction[] = [
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
];
