import type { GeometryObjectRecord } from "../geometry";

export type KeyboardFocusTarget = "workspace" | "editable";

export type KeyboardShortcut = {
  readonly key: string;
  readonly alt?: boolean;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
  readonly shift?: boolean;
};

export type NormalizedKeyboardEvent = {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly key: string;
  readonly metaKey: boolean;
  readonly repeat: boolean;
  readonly shiftKey: boolean;
};

export type KeyboardActionContext = {
  readonly event: KeyboardEvent;
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
};

export type KeyboardHoldKey = "space" | "alt" | "shift";

export type KeyboardHoldState = Readonly<Record<KeyboardHoldKey, boolean>>;

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

