import type { ReactNode } from "react";

import type { GeometryToolId } from "../geometry";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export type Tool = {
  readonly id: GeometryToolId;
  readonly name: string;
  readonly cursor: string;
  readonly shortcut: string | undefined;
  activate: (context: ToolContext) => void;
  deactivate: (context: ToolContext) => void;
  pointerDown: (event: ToolPointerEvent, context: ToolContext) => void;
  pointerMove: (event: ToolPointerEvent, context: ToolContext) => void;
  pointerUp: (event: ToolPointerEvent, context: ToolContext) => void;
  cancel: (context: ToolContext) => void;
  renderPreview: (context: ToolContext) => ReactNode;
};
