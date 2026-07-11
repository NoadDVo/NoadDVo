import type { GeometryObject, Point2D, TextAttachmentPlacement } from "../geometry";

export type TextCreationState = {
  readonly id: number;
  readonly point: Point2D;
  readonly targetObjectId?: string;
  readonly targetObjectType?: GeometryObject["type"];
  readonly placement?: TextAttachmentPlacement;
};

type TextCreationListener = () => void;

class TextCreationSession {
  private current: TextCreationState | null = null;
  private nextId = 0;
  private readonly listeners = new Set<TextCreationListener>();

  getSnapshot = (): TextCreationState | null => this.current;

  subscribe = (listener: TextCreationListener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  start({
    placement,
    point,
    targetObjectId,
    targetObjectType,
  }: {
    readonly placement?: TextAttachmentPlacement;
    readonly point: Point2D;
    readonly targetObjectId?: string;
    readonly targetObjectType?: GeometryObject["type"];
  }): void {
    this.nextId += 1;
    this.current = {
      id: this.nextId,
      point,
      ...(placement ? { placement } : {}),
      ...(targetObjectId ? { targetObjectId } : {}),
      ...(targetObjectType ? { targetObjectType } : {}),
    };
    this.emit();
  }

  cancel(): void {
    if (!this.current) {
      return;
    }

    this.current = null;
    this.emit();
  }

  complete(): void {
    this.cancel();
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const textCreationSession = new TextCreationSession();
