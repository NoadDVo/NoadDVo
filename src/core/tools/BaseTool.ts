import type { ReactNode } from "react";

import type { GeometryToolId } from "../geometry";
import type { Tool } from "./Tool";
import type { ToolContext, ToolPointerEvent } from "./ToolContext";
import { ToolStateMachine } from "./state/ToolStateMachine";
import type { ToolState, ToolStateTransitionReason } from "./state/ToolState";

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
  readonly stateMachine: ToolStateMachine;

  constructor({ cursor = "crosshair", id, name, shortcut }: BaseToolOptions) {
    this.cursor = cursor;
    this.id = id;
    this.name = name;
    this.shortcut = shortcut;
    this.stateMachine = new ToolStateMachine(id);
  }

  get state(): ToolState {
    return this.stateMachine.current;
  }

  activate(_context: ToolContext): void {
    this.resetState("activate");
    this.transitionState("waitingInput", "await-input");
  }

  deactivate(_context: ToolContext): void {
    this.transitionState("cancelled", "cancel");
    this.resetState("reset");
  }

  pointerDown(_event: ToolPointerEvent, _context: ToolContext): void {}

  pointerMove(_event: ToolPointerEvent, _context: ToolContext): void {}

  pointerUp(_event: ToolPointerEvent, _context: ToolContext): void {}

  keyDown(_event: KeyboardEvent, _context: ToolContext): void {}

  cancel(_context: ToolContext): void {
    this.transitionState("cancelled", "cancel");
    this.resetState("reset");
  }

  renderPreview(_context: ToolContext): ReactNode {
    return null;
  }

  protected transitionState(
    nextState: ToolState,
    reason: ToolStateTransitionReason,
  ): void {
    this.stateMachine.transition(nextState, reason);
  }

  protected resetState(reason: ToolStateTransitionReason = "reset"): void {
    this.stateMachine.reset(reason);
  }
}
