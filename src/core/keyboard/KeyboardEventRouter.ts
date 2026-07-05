import { keyboardManager, type KeyboardManager } from "./KeyboardManager";

export class KeyboardEventRouter {
  private attachedTarget: Window | null = null;

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.manager.handleKeyDown(event);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    this.manager.handleKeyUp(event);
  };

  private readonly handleBlur = (): void => {
    this.manager.releaseHeldKeys();
  };

  constructor(private readonly manager: KeyboardManager = keyboardManager) {}

  attach(target: Window = window): void {
    if (this.attachedTarget === target) {
      return;
    }

    this.detach();
    this.attachedTarget = target;
    target.addEventListener("keydown", this.handleKeyDown);
    target.addEventListener("keyup", this.handleKeyUp);
    target.addEventListener("blur", this.handleBlur);
  }

  detach(): void {
    if (!this.attachedTarget) {
      return;
    }

    this.attachedTarget.removeEventListener("keydown", this.handleKeyDown);
    this.attachedTarget.removeEventListener("keyup", this.handleKeyUp);
    this.attachedTarget.removeEventListener("blur", this.handleBlur);
    this.manager.releaseHeldKeys();
    this.attachedTarget = null;
  }
}

export const keyboardEventRouter = new KeyboardEventRouter();

