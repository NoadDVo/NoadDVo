export type ToolState =
  | "idle"
  | "waitingInput"
  | "preview"
  | "completed"
  | "cancelled";

export type ToolStateTransitionReason =
  | "activate"
  | "await-input"
  | "preview"
  | "complete"
  | "cancel"
  | "reset";
