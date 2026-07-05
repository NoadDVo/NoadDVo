import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { useViewportStore } from "../../app/store/viewportStore";
import { toolManager } from "../tools/ToolManager";
import { defaultKeyboardActions } from "./KeyboardAction";
import {
  isEditableKeyboardTarget,
  type KeyboardHoldKey,
  type KeyboardHoldState,
} from "./KeyboardContext";
import {
  normalizeKeyboardEvent,
  ShortcutRegistry,
  type KeyboardAction,
} from "./ShortcutRegistry";

function keyToHoldKey(key: string): KeyboardHoldKey | null {
  if (key === " ") {
    return "space";
  }

  if (key === "alt") {
    return "alt";
  }

  if (key === "shift") {
    return "shift";
  }

  return null;
}

export class KeyboardManager {
  private holdState: KeyboardHoldState = {
    alt: false,
    shift: false,
    space: false,
  };

  constructor(private readonly registry = new ShortcutRegistry(defaultKeyboardActions)) {}

  registerAction(action: KeyboardAction): void {
    this.registry.register(action);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const normalizedEvent = normalizeKeyboardEvent(event);
    const action = this.registry.match(normalizedEvent);
    const isEditableTarget = isEditableKeyboardTarget(event.target);

    if (isEditableTarget && !action?.allowInEditable) {
      return;
    }

    if (action) {
      if (normalizedEvent.repeat && action.repeatable === false) {
        event.preventDefault();

        return;
      }

      if (action.preventDefault) {
        event.preventDefault();
      }

      const holdKey = keyToHoldKey(normalizedEvent.key);

      if (holdKey) {
        this.holdState = {
          ...this.holdState,
          [holdKey]: true,
        };
      }

      action.execute({
        event,
        objects: useGeometryStore.getState().objects,
        selectedObjectIds: useGeometryStore.getState().selectedObjectIds,
      });

      return;
    }

    if (!isEditableTarget) {
      toolManager.keyDown(event);
    }
  }

  handleKeyUp(event: KeyboardEvent): void {
    const normalizedEvent = normalizeKeyboardEvent(event);
    const holdKey = keyToHoldKey(normalizedEvent.key);

    if (!holdKey) {
      return;
    }

    this.holdState = {
      ...this.holdState,
      [holdKey]: false,
    };

    if (holdKey === "space") {
      useViewportStore.getState().setSpacePressed(false);
    }

    if (holdKey === "alt") {
      useViewportStore.getState().setSnapTemporarilyDisabled(false);
    }

    this.updateKeyboardHint();
  }

  releaseHeldKeys(): void {
    this.holdState = {
      alt: false,
      shift: false,
      space: false,
    };
    useViewportStore.getState().setSpacePressed(false);
    useViewportStore.getState().setSnapTemporarilyDisabled(false);
    useUiStore.getState().setKeyboardModeHint(null);
  }

  private updateKeyboardHint(): void {
    const ui = useUiStore.getState();

    if (this.holdState.space) {
      ui.setKeyboardModeHint("pan");

      return;
    }

    if (this.holdState.alt) {
      ui.setKeyboardModeHint("snap-off");

      return;
    }

    if (this.holdState.shift) {
      ui.setKeyboardModeHint("constraint");

      return;
    }

    ui.setKeyboardModeHint(null);
  }
}

export const keyboardManager = new KeyboardManager();

