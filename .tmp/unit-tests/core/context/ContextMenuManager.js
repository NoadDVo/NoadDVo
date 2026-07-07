"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextMenuManager = exports.ContextMenuManager = void 0;
const geometryStore_1 = require("../../app/store/geometryStore");
const viewportStore_1 = require("../../app/store/viewportStore");
const ContextMenuRegistry_1 = require("./ContextMenuRegistry");
const MENU_WIDTH = 256;
const MENU_MARGIN = 8;
const MENU_VERTICAL_PADDING = 14;
const MENU_ROW_HEIGHT = 34;
function estimateMenuHeight(itemCount) {
    return MENU_VERTICAL_PADDING + itemCount * MENU_ROW_HEIGHT;
}
function clampPosition(position, bounds, itemCount) {
    const menuHeight = estimateMenuHeight(itemCount);
    return {
        x: Math.max(MENU_MARGIN, Math.min(position.x, bounds.width - MENU_WIDTH - MENU_MARGIN)),
        y: Math.max(MENU_MARGIN, Math.min(position.y, bounds.height - menuHeight - MENU_MARGIN)),
    };
}
function createActionContext(target) {
    const geometry = geometryStore_1.useGeometryStore.getState();
    const viewport = viewportStore_1.useViewportStore.getState();
    return {
        objects: geometry.objects,
        selectedObjectIds: geometry.selectedObjectIds,
        target,
        viewport: viewport.viewport,
    };
}
class ContextMenuManager {
    listeners = new Set();
    state = {
        items: [],
        open: false,
        position: { x: 0, y: 0 },
        target: null,
    };
    getSnapshot = () => this.state;
    subscribe = (listener) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    open(options) {
        const actionContext = createActionContext(options.target);
        const items = ContextMenuRegistry_1.contextMenuRegistry.getItems(actionContext);
        this.state = {
            items,
            open: true,
            position: clampPosition(options.position ?? options.target.screenPoint, options.bounds, items.length),
            target: options.target,
        };
        this.emit();
    }
    close() {
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
    async execute(actionId) {
        const { target } = this.state;
        if (!target) {
            return;
        }
        const action = ContextMenuRegistry_1.contextMenuRegistry.getAction(actionId);
        if (!action) {
            return;
        }
        const actionContext = createActionContext(target);
        if (action.isEnabled && !action.isEnabled(actionContext)) {
            return;
        }
        try {
            await action.execute(actionContext);
        }
        finally {
            this.close();
        }
    }
    emit() {
        this.listeners.forEach((listener) => listener());
    }
}
exports.ContextMenuManager = ContextMenuManager;
exports.contextMenuManager = new ContextMenuManager();
