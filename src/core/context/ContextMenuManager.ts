import { useGeometryStore } from "../../app/store/geometryStore";
import { useViewportStore } from "../../app/store/viewportStore";
import type { ScreenPoint } from "../geometry";
import { contextMenuRegistry } from "./ContextMenuRegistry";
import type {
  ContextMenuActionContext,
  ContextMenuState,
  ContextMenuTarget,
  ContextMenuViewportBounds,
} from "./ContextMenuTypes";

type Listener = () => void;

type OpenContextMenuOptions = {
  readonly target: ContextMenuTarget;
  readonly bounds: ContextMenuViewportBounds;
  readonly position?: ScreenPoint;
};

const MENU_WIDTH = 256;
const MENU_MARGIN = 8;
const MENU_VERTICAL_PADDING = 14;
const MENU_ROW_HEIGHT = 34;

function estimateMenuHeight(itemCount: number): number {
  return MENU_VERTICAL_PADDING + itemCount * MENU_ROW_HEIGHT;
}

function clampPosition(
  position: ScreenPoint,
  bounds: ContextMenuViewportBounds,
  itemCount: number,
): ScreenPoint {
  const menuHeight = estimateMenuHeight(itemCount);

  return {
    x: Math.max(
      MENU_MARGIN,
      Math.min(position.x, bounds.width - MENU_WIDTH - MENU_MARGIN),
    ),
    y: Math.max(
      MENU_MARGIN,
      Math.min(position.y, bounds.height - menuHeight - MENU_MARGIN),
    ),
  };
}

function createActionContext(target: ContextMenuTarget): ContextMenuActionContext {
  const geometry = useGeometryStore.getState();
  const viewport = useViewportStore.getState();

  return {
    objects: geometry.objects,
    selectedObjectIds: geometry.selectedObjectIds,
    target,
    viewport: viewport.viewport,
  };
}

export class ContextMenuManager {
  private listeners = new Set<Listener>();

  private state: ContextMenuState = {
    items: [],
    open: false,
    position: { x: 0, y: 0 },
    target: null,
  };

  getSnapshot = (): ContextMenuState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  open(options: OpenContextMenuOptions): void {
    const actionContext = createActionContext(options.target);
    const items = contextMenuRegistry.getItems(actionContext);

    this.state = {
      items,
      open: true,
      position: clampPosition(
        options.position ?? options.target.screenPoint,
        options.bounds,
        items.length,
      ),
      target: options.target,
    };
    this.emit();
  }

  close(): void {
    if (!this.state.open) {
      return;
    }

    this.state = {
      items: [],
      open: false,
      position: { x: 0, y: 0 },
      target: null,
    };
    this.emit();
  }

  async execute(actionId: string): Promise<void> {
    const { target } = this.state;

    if (!target) {
      return;
    }

    const action = contextMenuRegistry.getAction(actionId);

    if (!action) {
      return;
    }

    const actionContext = createActionContext(target);

    if (action.isEnabled && !action.isEnabled(actionContext)) {
      return;
    }

    try {
      await action.execute(actionContext);
    } finally {
      this.close();
    }
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const contextMenuManager = new ContextMenuManager();
