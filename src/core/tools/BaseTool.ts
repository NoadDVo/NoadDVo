import type { GeometryToolId } from "../geometry";
import type { Tool } from "./Tool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";

export type BaseToolOptions = {
  readonly id: GeometryToolId;
  readonly name: string;
  readonly cursor?: string;
  readonly shortcut?: string;
};

export class BaseTool implements Tool {
  readonly id: GeometryToolId;
  readonly name: string;
  readonly cursor: string;
  readonly shortcut: string | undefined;

  constructor({ cursor = "crosshair", id, name, shortcut }: BaseToolOptions) {
    this.cursor = cursor;
    this.id = id;
    this.name = name;
    this.shortcut = shortcut;
  }

  activate(_context: ToolContext): void {}

  deactivate(_context: ToolContext): void {}

  pointerDown(_event: ToolPointerEvent, _context: ToolContext): void {}

  pointerMove(_event: ToolPointerEvent, _context: ToolContext): void {}

  pointerUp(_event: ToolPointerEvent, _context: ToolContext): void {}

  cancel(_context: ToolContext): void {}

  renderPreview(_context: ToolContext): null {
    return null;
  }
}
