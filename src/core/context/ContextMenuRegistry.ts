import { defaultContextMenuActions } from "./ContextMenuAction";
import type {
  ContextMenuAction,
  ContextMenuActionContext,
  ContextMenuItem,
  ContextMenuTarget,
} from "./ContextMenuTypes";

const menuOrders = {
  angle: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "angle-value",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  canvas: [
    "new-point",
    "paste",
    "separator",
    "reset-view",
    "zoom-fit",
    "separator",
    "grid-settings",
    "canvas-settings",
  ],
  circle: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "radius",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  line: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  point: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "coordinates",
    "separator",
    "copy-tikz",
    "properties",
  ],
  polygon: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "area",
    "perimeter",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  segment: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "length",
    "separator",
    "copy-tikz",
    "properties",
  ],
  vector: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  text: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  measurement: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  arc: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  ray: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
  region: [
    "rename",
    "copy",
    "cut",
    "delete",
    "duplicate",
    "area",
    "separator",
    "hide",
    "lock",
    "separator",
    "copy-tikz",
    "properties",
  ],
} as const;

function menuKeyForTarget(target: ContextMenuTarget): keyof typeof menuOrders {
  if (target.kind === "canvas") {
    return "canvas";
  }

  if (target.objectType in menuOrders) {
    return target.objectType as keyof typeof menuOrders;
  }

  return "canvas";
}

export class ContextMenuRegistry {
  private readonly actions = new Map<string, ContextMenuAction>();

  constructor(actions: readonly ContextMenuAction[] = []) {
    actions.forEach((action) => this.register(action));
  }

  register(action: ContextMenuAction): void {
    this.actions.set(action.id, action);
  }

  getAction(actionId: string): ContextMenuAction | null {
    return this.actions.get(actionId) ?? null;
  }

  getItems(context: ContextMenuActionContext): readonly ContextMenuItem[] {
    const order = menuOrders[menuKeyForTarget(context.target)];
    const targetType =
      context.target.kind === "canvas" ? "canvas" : context.target.objectType;
    let separatorIndex = 0;

    return order
      .map((actionId): ContextMenuItem | null => {
        if (actionId === "separator") {
          separatorIndex += 1;

          return {
            id: `separator-${separatorIndex}`,
            type: "separator",
          };
        }

        const action = this.actions.get(actionId);

        if (!action || !action.targets.includes(targetType)) {
          return null;
        }

        const detail = action.getDetail?.(context) ?? undefined;
        const shortcut = action.shortcut ?? undefined;

        return {
          actionId: action.id,
          disabled: action.isEnabled ? !action.isEnabled(context) : false,
          icon: action.icon,
          id: `action-${action.id}`,
          label: action.getLabel?.(context) ?? defaultLabels[action.id] ?? action.id,
          type: "action",
          ...(detail ? { detail } : {}),
          ...(shortcut ? { shortcut } : {}),
        };
      })
      .filter((item): item is ContextMenuItem => Boolean(item));
  }
}

const defaultLabels: Record<string, string> = {
  "angle-value": "Angle",
  "area": "Area",
  "canvas-settings": "Canvas Settings",
  "coordinates": "Coordinates",
  "copy": "Copy",
  "copy-tikz": "Copy TikZ",
  "cut": "Cut",
  "delete": "Delete",
  "duplicate": "Duplicate",
  "grid-settings": "Grid Settings",
  "length": "Length",
  "lock": "Lock",
  "new-point": "New Point",
  "paste": "Paste",
  "perimeter": "Perimeter",
  "properties": "Properties",
  "radius": "Radius",
  "rename": "Rename",
  "reset-view": "Reset View",
  "zoom-fit": "Zoom To Fit",
};

export const contextMenuRegistry = new ContextMenuRegistry(defaultContextMenuActions);
