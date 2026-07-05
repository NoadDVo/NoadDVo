import { generateTikz } from "../../tikz";
import type { ContextMenuAction } from "../ContextMenuTypes";

export const clipboardContextMenuActions: readonly ContextMenuAction[] = [
  {
    execute: async (context) => {
      const code = generateTikz(context.objects, "academic").code;

      await navigator.clipboard.writeText(code);
    },
    icon: "tikz",
    id: "copy-tikz",
    shortcut: "Ctrl+C",
    targets: ["point", "segment", "line", "ray", "vector", "circle", "polygon", "angle", "text", "measurement"],
  },
];
