import type {
  KeyboardActionContext,
  KeyboardShortcut,
  NormalizedKeyboardEvent,
} from "./KeyboardContext";

export type KeyboardAction = {
  readonly id: string;
  readonly label: string;
  readonly shortcut: KeyboardShortcut;
  readonly allowInEditable?: boolean;
  readonly preventDefault?: boolean;
  readonly repeatable?: boolean;
  readonly execute: (context: KeyboardActionContext) => void;
};

function normalizeShortcutKey(key: string): string {
  if (key === "Spacebar" || key === " ") {
    return " ";
  }

  return key.toLowerCase();
}

function modifierMatches(
  expected: boolean | undefined,
  actual: boolean,
): boolean {
  return Boolean(expected) === actual;
}

function primaryModifierMatches(
  shortcut: KeyboardShortcut,
  event: NormalizedKeyboardEvent,
): boolean {
  if (shortcut.ctrl === true && shortcut.meta === undefined) {
    return event.ctrlKey || event.metaKey;
  }

  return (
    modifierMatches(shortcut.ctrl, event.ctrlKey) &&
    modifierMatches(shortcut.meta, event.metaKey)
  );
}

export function normalizeKeyboardEvent(event: KeyboardEvent): NormalizedKeyboardEvent {
  return {
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    key: normalizeShortcutKey(event.key),
    metaKey: event.metaKey,
    repeat: event.repeat,
    shiftKey: event.shiftKey,
  };
}

export class ShortcutRegistry {
  private readonly actions = new Map<string, KeyboardAction>();

  constructor(actions: readonly KeyboardAction[] = []) {
    actions.forEach((action) => this.register(action));
  }

  register(action: KeyboardAction): void {
    this.actions.set(action.id, action);
  }

  getAction(actionId: string): KeyboardAction | null {
    return this.actions.get(actionId) ?? null;
  }

  match(event: NormalizedKeyboardEvent): KeyboardAction | null {
    for (const action of this.actions.values()) {
      if (this.matchesShortcut(action.shortcut, event)) {
        return action;
      }
    }

    return null;
  }

  private matchesShortcut(
    shortcut: KeyboardShortcut,
    event: NormalizedKeyboardEvent,
  ): boolean {
    return (
      normalizeShortcutKey(shortcut.key) === event.key &&
      primaryModifierMatches(shortcut, event) &&
      (event.key === "shift" || modifierMatches(shortcut.shift, event.shiftKey)) &&
      (event.key === "alt" || modifierMatches(shortcut.alt, event.altKey))
    );
  }
}
