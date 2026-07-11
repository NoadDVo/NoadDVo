import type { HistoryAction } from "./HistoryAction";

export class HistoryStack {
  private readonly undoEntries: HistoryAction[] = [];
  private readonly redoEntries: HistoryAction[] = [];

  clear(): void {
    this.undoEntries.length = 0;
    this.redoEntries.length = 0;
  }

  get canUndo(): boolean {
    return this.undoEntries.length > 0;
  }

  get canRedo(): boolean {
    return this.redoEntries.length > 0;
  }

  get undoCount(): number {
    return this.undoEntries.length;
  }

  get redoCount(): number {
    return this.redoEntries.length;
  }

  push(action: HistoryAction): void {
    this.undoEntries.push(action);
    this.redoEntries.length = 0;
  }

  undo(): HistoryAction | null {
    const action = this.undoEntries.pop();

    if (!action) {
      return null;
    }

    this.redoEntries.push(action);

    return action;
  }

  redo(): HistoryAction | null {
    const action = this.redoEntries.pop();

    if (!action) {
      return null;
    }

    this.undoEntries.push(action);

    return action;
  }
}

