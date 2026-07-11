import type { GeometryToolId } from "../../geometry";
import type { ToolState, ToolStateTransitionReason } from "./ToolState";

export type ToolStateSnapshot = {
  readonly toolId: GeometryToolId;
  readonly state: ToolState;
  readonly previousState: ToolState | null;
  readonly reason: ToolStateTransitionReason;
  readonly updatedAt: number;
};
