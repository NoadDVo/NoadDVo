import {
  copySelectionToGeometryClipboard,
  cutSelectionToGeometryClipboard,
  hasGeometryClipboard,
  pasteGeometryClipboard,
} from "../../clipboard";
import { generateTikz } from "../../tikz";
import type { ContextMenuAction } from "../ContextMenuTypes";

const geometryTargets = ["point", "segment", "line", "ray", "vector", "circle", "polygon", "region", "arc", "angle", "text", "distance", "area"] as const;

export const clipboardContextMenuActions: readonly ContextMenuAction[] = [
  {
    execute: () => {
      copySelectionToGeometryClipboard();
    },
    icon: "clipboard",
    id: "copy",
    isEnabled: (context) => context.selectedObjectIds.length > 0,
    shortcut: "Ctrl+C",
    targets: geometryTargets,
  },
  {
    execute: () => {
      cutSelectionToGeometryClipboard();
    },
    icon: "clipboard",
    id: "cut",
    isEnabled: (context) => context.selectedObjectIds.length > 0,
    shortcut: "Ctrl+X",
    targets: geometryTargets,
  },
  {
    execute: () => {
      pasteGeometryClipboard();
    },
    icon: "paste",
    id: "paste",
    isEnabled: () => hasGeometryClipboard(),
    shortcut: "Ctrl+V",
    targets: ["canvas", ...geometryTargets],
  },
  {
    execute: async (context) => {
      const code = generateTikz(context.objects, "academic").code;

      await navigator.clipboard.writeText(code);
    },
    icon: "tikz",
    id: "copy-tikz",
    shortcut: "Ctrl+C",
    targets: geometryTargets,
  },
];
