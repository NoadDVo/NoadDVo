import { duplicateSelection } from "../../clipboard";
import type { ContextMenuAction } from "../ContextMenuTypes";

const geometryTargets = ["point", "segment", "line", "ray", "vector", "circle", "polygon", "region", "arc", "angle", "text", "measurement"] as const;

export const duplicateObjectAction: ContextMenuAction = {
  execute: () => {
    duplicateSelection();
  },
  icon: "duplicate",
  id: "duplicate",
  isEnabled: (context) => context.selectedObjectIds.length > 0,
  shortcut: "Ctrl+D",
  targets: geometryTargets,
};
