import type { HistoryAction } from "./HistoryAction";
import type { HistoryManager } from "./HistoryManager";

export function undoCommand(manager: HistoryManager): HistoryAction | null {
  return manager.undo();
}

