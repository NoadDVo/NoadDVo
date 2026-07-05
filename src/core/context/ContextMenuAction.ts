import { canvasContextMenuActions } from "./actions/CanvasActions";
import { clipboardContextMenuActions } from "./actions/ClipboardActions";
import { objectContextMenuActions } from "./actions/ObjectActions";
import { projectContextMenuActions } from "./actions/ProjectActions";
import type { ContextMenuAction } from "./ContextMenuTypes";

export const defaultContextMenuActions: readonly ContextMenuAction[] = [
  ...canvasContextMenuActions,
  ...objectContextMenuActions,
  ...clipboardContextMenuActions,
  ...projectContextMenuActions,
];

