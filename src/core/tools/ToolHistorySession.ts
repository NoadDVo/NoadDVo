import type { HistoryActionKind } from "../history";
import type { ToolContext } from "./ToolContext";

export class ToolHistorySession {
  private open = false;

  constructor(
    private readonly kind: HistoryActionKind,
    private readonly description: string,
  ) {}

  ensure(context: ToolContext): void {
    if (this.open) {
      return;
    }

    context.beginHistoryTransaction(this.kind, this.description);
    this.open = true;
  }

  commit(context: ToolContext): void {
    if (!this.open) {
      return;
    }

    context.commitHistoryTransaction();
    this.open = false;
  }

  cancel(context: ToolContext): void {
    if (!this.open) {
      return;
    }

    context.cancelHistoryTransaction();
    this.open = false;
  }
}

