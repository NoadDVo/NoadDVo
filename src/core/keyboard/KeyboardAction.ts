import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { contextMenuManager } from "../context";
import { toolManager } from "../tools/ToolManager";
import type { KeyboardActionContext } from "./KeyboardContext";
import type { KeyboardAction } from "./ShortcutRegistry";

function deleteSelectedObjects(): void {
  const geometry = useGeometryStore.getState();
  const deletableIds = geometry.selectedObjectIds.filter((objectId) => {
    const object = geometry.objects[objectId];

    return object && !object.locked;
  });

  if (deletableIds.length === 0) {
    return;
  }

  geometry.beginHistoryTransaction("delete", "Delete selection");
  deletableIds.forEach((objectId) => {
    geometry.deleteObject(objectId);
  });
  geometry.commitHistoryTransaction();
}

function selectAllVisibleObjects(): void {
  const geometry = useGeometryStore.getState();

  geometry.setSelectedObjects(
    Object.values(geometry.objects)
      .filter((object) => object.visible)
      .map((object) => object.id),
  );
}

function setPlaceholderHint(hint: string): void {
  void hint;
  useUiStore.getState().setKeyboardModeHint(null);
}

function clearWorkspaceInteraction(): void {
  contextMenuManager.close();
  toolManager.cancel();
  useGeometryStore.getState().clearSelection();
}

export const defaultKeyboardActions: readonly KeyboardAction[] = [
  {
    execute: () => useGeometryStore.getState().undo(),
    id: "undo",
    label: "Undo",
    preventDefault: true,
    shortcut: { ctrl: true, key: "z" },
  },
  {
    execute: () => useGeometryStore.getState().redo(),
    id: "redo-shift-z",
    label: "Redo",
    preventDefault: true,
    shortcut: { ctrl: true, key: "z", shift: true },
  },
  {
    execute: () => useGeometryStore.getState().redo(),
    id: "redo-y",
    label: "Redo",
    preventDefault: true,
    shortcut: { ctrl: true, key: "y" },
  },
  {
    execute: deleteSelectedObjects,
    id: "delete-selection",
    label: "Delete selected objects",
    preventDefault: true,
    shortcut: { key: "delete" },
  },
  {
    execute: clearWorkspaceInteraction,
    id: "escape",
    label: "Cancel current operation",
    preventDefault: true,
    shortcut: { key: "escape" },
  },
  {
    execute: selectAllVisibleObjects,
    id: "select-all",
    label: "Select all visible objects",
    preventDefault: true,
    shortcut: { ctrl: true, key: "a" },
  },
  {
    execute: () => setPlaceholderHint("Copy selected geometry"),
    id: "copy-selection",
    label: "Copy selected geometry",
    preventDefault: true,
    shortcut: { ctrl: true, key: "c" },
  },
  {
    execute: () => setPlaceholderHint("Paste geometry"),
    id: "paste-selection",
    label: "Paste geometry",
    preventDefault: true,
    shortcut: { ctrl: true, key: "v" },
  },
  {
    execute: () => setPlaceholderHint("Duplicate selected geometry"),
    id: "duplicate-selection",
    label: "Duplicate selected geometry",
    preventDefault: true,
    shortcut: { ctrl: true, key: "d" },
  },
  {
    execute: (_context: KeyboardActionContext) => {
      useViewportStore.getState().setSpacePressed(true);
      useUiStore.getState().setKeyboardModeHint("pan");
    },
    id: "hold-space-pan",
    label: "Temporary pan",
    preventDefault: true,
    repeatable: false,
    shortcut: { key: " " },
  },
  {
    execute: () => {
      useViewportStore.getState().setSnapTemporarilyDisabled(true);
      useUiStore.getState().setKeyboardModeHint("snap-off");
    },
    id: "hold-alt-disable-snap",
    label: "Temporarily disable snapping",
    preventDefault: true,
    repeatable: false,
    shortcut: { key: "alt" },
  },
  {
    execute: () => {
      useUiStore.getState().setKeyboardModeHint("constraint");
    },
    id: "hold-shift-constraint",
    label: "Constraint mode",
    repeatable: false,
    shortcut: { key: "shift" },
  },
];
