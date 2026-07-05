import {
  cloneHistorySnapshot,
  snapshotsEqual,
  type HistoryAction,
  type HistoryActionKind,
  type HistorySnapshot,
} from "./HistoryAction";
import { HistoryStack } from "./HistoryStack";

type HistoryTransaction = {
  readonly before: HistorySnapshot;
  readonly description: string;
  readonly kind: HistoryActionKind;
};

let historyActionCounter = 0;

function createHistoryActionId(): string {
  historyActionCounter += 1;

  return `history-${Date.now().toString(36)}-${historyActionCounter}`;
}

export class HistoryManager {
  private readonly stack = new HistoryStack();
  private transaction: HistoryTransaction | null = null;

  get canUndo(): boolean {
    return this.stack.canUndo;
  }

  get canRedo(): boolean {
    return this.stack.canRedo;
  }

  get undoCount(): number {
    return this.stack.undoCount;
  }

  get redoCount(): number {
    return this.stack.redoCount;
  }

  clear(): void {
    this.stack.clear();
    this.transaction = null;
  }

  record(
    kind: HistoryActionKind,
    description: string,
    before: HistorySnapshot,
    after: HistorySnapshot,
  ): void {
    if (this.transaction) {
      return;
    }

    this.pushAction(kind, description, before, after);
  }

  beginTransaction(
    kind: HistoryActionKind,
    description: string,
    before: HistorySnapshot,
  ): void {
    if (this.transaction) {
      return;
    }

    this.transaction = {
      before: cloneHistorySnapshot(before),
      description,
      kind,
    };
  }

  commitTransaction(after: HistorySnapshot): void {
    if (!this.transaction) {
      return;
    }

    const transaction = this.transaction;

    this.transaction = null;
    this.pushAction(
      transaction.kind,
      transaction.description,
      transaction.before,
      after,
    );
  }

  cancelTransaction(): void {
    this.transaction = null;
  }

  undo(): HistoryAction | null {
    return this.stack.undo();
  }

  redo(): HistoryAction | null {
    return this.stack.redo();
  }

  private pushAction(
    kind: HistoryActionKind,
    description: string,
    before: HistorySnapshot,
    after: HistorySnapshot,
  ): void {
    const normalizedBefore = cloneHistorySnapshot(before);
    const normalizedAfter = cloneHistorySnapshot(after);

    if (snapshotsEqual(normalizedBefore, normalizedAfter)) {
      return;
    }

    this.stack.push({
      after: normalizedAfter,
      before: normalizedBefore,
      description,
      id: createHistoryActionId(),
      kind,
      timestamp: Date.now(),
    });
  }
}

export const historyManager = new HistoryManager();

