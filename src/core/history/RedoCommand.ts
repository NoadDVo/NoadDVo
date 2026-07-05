import type { HistoryAction } from "./HistoryAction";
import type { HistoryManager } from "./HistoryManager";

export function redoCommand(manager: HistoryManager): HistoryAction | null {
  return manager.redo();
}

