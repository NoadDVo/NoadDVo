import type { GeometryToolId } from "../../geometry";
import type { ToolState, ToolStateTransitionReason } from "./ToolState";
import type { ToolStateSnapshot } from "./ToolStateContext";

const allowedTransitions: Readonly<Record<ToolState, readonly ToolState[]>> = {
  cancelled: ["idle", "waitingInput"],
  completed: ["idle", "waitingInput"],
  idle: ["waitingInput", "cancelled"],
  preview: ["completed", "cancelled", "waitingInput"],
  waitingInput: ["preview", "completed", "cancelled", "waitingInput"],
};

export class ToolStateMachine {
  private previousState: ToolState | null = null;
  private state: ToolState = "idle";
  private updatedAt = Date.now();

  constructor(private readonly toolId: GeometryToolId) {}

  get current(): ToolState {
    return this.state;
  }

  get snapshot(): ToolStateSnapshot {
    return {
      previousState: this.previousState,
      reason: "reset",
      state: this.state,
      toolId: this.toolId,
      updatedAt: this.updatedAt,
    };
  }

  canTransition(nextState: ToolState): boolean {
    return this.state === nextState || allowedTransitions[this.state].includes(nextState);
  }

  transition(
    nextState: ToolState,
    reason: ToolStateTransitionReason,
  ): ToolStateSnapshot {
    if (!this.canTransition(nextState)) {
      throw new Error(
        `Invalid ${this.toolId} tool transition: ${this.state} -> ${nextState}.`,
      );
    }

    this.previousState = this.state;
    this.state = nextState;
    this.updatedAt = Date.now();

    return {
      previousState: this.previousState,
      reason,
      state: this.state,
      toolId: this.toolId,
      updatedAt: this.updatedAt,
    };
  }

  reset(reason: ToolStateTransitionReason = "reset"): ToolStateSnapshot {
    this.previousState = this.state;
    this.state = "idle";
    this.updatedAt = Date.now();

    return {
      previousState: this.previousState,
      reason,
      state: this.state,
      toolId: this.toolId,
      updatedAt: this.updatedAt,
    };
  }
}
