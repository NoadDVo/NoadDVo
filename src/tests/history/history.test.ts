import { HistoryManager } from "../../core/history";
import type { HistorySnapshot } from "../../core/history";
import { assert, assertEqual } from "../assert";

const emptySnapshot: HistorySnapshot = {
  objects: {},
  selectedObjectIds: [],
};

const selectedSnapshot: HistorySnapshot = {
  objects: {},
  selectedObjectIds: ["a"],
};

export function runHistoryTests(): void {
  const history = new HistoryManager();

  history.beginTransaction("create", "Create object", emptySnapshot);
  history.record("create", "Ignored inside transaction", emptySnapshot, selectedSnapshot);
  history.commitTransaction(selectedSnapshot);

  assert(history.canUndo, "committed transaction creates one undo entry");
  assertEqual(history.undoCount, 1, "transaction records one history action");
  assertEqual(history.redoCount, 0, "redo stack starts empty");
  assertEqual(history.undo()?.description, "Create object", "undo returns transaction action");
  assert(history.canRedo, "undo creates redo availability");
}

