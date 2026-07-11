"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useViewportStore = void 0;
const zustand_1 = require("zustand");
const viewport_1 = require("../../core/geometry/viewport");
function readPersistedSettings() {
    if (typeof window === "undefined") {
        return {};
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem("ndv.viewportSettings") ?? "{}");
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    }
    catch {
        return {};
    }
}
function persistSettings(settings) {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem("ndv.viewportSettings", JSON.stringify(settings));
}
const persistedSettings = readPersistedSettings();
exports.useViewportStore = (0, zustand_1.create)((set, get) => ({
    viewport: viewport_1.DEFAULT_VIEWPORT,
    adaptiveGrid: persistedSettings.adaptiveGrid ?? true,
    canvasBackground: persistedSettings.canvasBackground ?? "#f2f7fa",
    coordinateDisplay: persistedSettings.coordinateDisplay ?? true,
    gridSize: persistedSettings.gridSize ?? 1,
    gridColor: persistedSettings.gridColor ?? "#0f172a",
    infiniteCanvas: persistedSettings.infiniteCanvas ?? true,
    majorGrid: persistedSettings.majorGrid ?? true,
    measurementPreview: persistedSettings.measurementPreview ?? true,
    minorGrid: persistedSettings.minorGrid ?? true,
    renderingQuality: persistedSettings.renderingQuality ?? "balanced",
    snapEnabled: persistedSettings.snapEnabled ?? true,
    snapRadius: persistedSettings.snapRadius ?? 10,
    snapTemporarilyDisabled: false,
    showGrid: persistedSettings.showGrid ?? true,
    showAxes: persistedSettings.showAxes ?? true,
    showOrigin: persistedSettings.showOrigin ?? true,
    pointerWorld: { x: 0, y: 0 },
    isSpacePressed: false,
    isPanning: false,
    lastPanPoint: null,
    setCanvasSize: (width, height) => {
        set((state) => ({
            viewport: (0, viewport_1.resizeViewport)(state.viewport, width, height),
        }));
    },
    setViewportState: (viewport, settings) => {
        set((state) => ({
            gridSize: settings?.gridSize ?? state.gridSize,
            snapEnabled: settings?.snapEnabled ?? state.snapEnabled,
            showAxes: settings?.showAxes ?? state.showAxes,
            showGrid: settings?.showGrid ?? state.showGrid,
            viewport: {
                ...viewport,
                height: Math.max(1, viewport.height),
                width: Math.max(1, viewport.width),
            },
        }));
    },
    setPointerScreen: (point) => {
        set((state) => ({
            pointerWorld: (0, viewport_1.screenToWorld)(point, state.viewport),
        }));
    },
    updateCanvasSettings: (patch) => {
        set((state) => ({
            ...state,
            ...patch,
            gridSize: patch.gridSize === undefined
                ? state.gridSize
                : Math.max(0.01, patch.gridSize),
            snapRadius: patch.snapRadius === undefined
                ? state.snapRadius
                : Math.max(0, patch.snapRadius),
        }));
        const next = exports.useViewportStore.getState();
        persistSettings({
            adaptiveGrid: next.adaptiveGrid,
            canvasBackground: next.canvasBackground,
            coordinateDisplay: next.coordinateDisplay,
            gridColor: next.gridColor,
            gridSize: next.gridSize,
            infiniteCanvas: next.infiniteCanvas,
            majorGrid: next.majorGrid,
            measurementPreview: next.measurementPreview,
            minorGrid: next.minorGrid,
            renderingQuality: next.renderingQuality,
            showAxes: next.showAxes,
            showGrid: next.showGrid,
            showOrigin: next.showOrigin,
            snapEnabled: next.snapEnabled,
            snapRadius: next.snapRadius,
        });
    },
    zoomAt: (point, zoomFactor) => {
        set((state) => {
            const viewport = (0, viewport_1.zoomViewportAtScreenPoint)(state.viewport, point, zoomFactor);
            return {
                pointerWorld: (0, viewport_1.screenToWorld)(point, viewport),
                viewport,
            };
        });
    },
    startPan: (point) => {
        set({
            isPanning: true,
            lastPanPoint: point,
        });
    },
    panTo: (point) => {
        const { isPanning, lastPanPoint, viewport } = get();
        if (!isPanning || !lastPanPoint) {
            return;
        }
        const delta = {
            x: point.x - lastPanPoint.x,
            y: point.y - lastPanPoint.y,
        };
        const nextViewport = (0, viewport_1.panViewport)(viewport, delta);
        set({
            lastPanPoint: point,
            pointerWorld: (0, viewport_1.screenToWorld)(point, nextViewport),
            viewport: nextViewport,
        });
    },
    endPan: () => {
        set({
            isPanning: false,
            lastPanPoint: null,
        });
    },
    setSpacePressed: (pressed) => {
        set({ isSpacePressed: pressed });
        if (!pressed) {
            get().endPan();
        }
    },
    setSnapTemporarilyDisabled: (disabled) => {
        set({ snapTemporarilyDisabled: disabled });
    },
    resetViewport: () => {
        const { viewport } = get();
        set({
            viewport: {
                ...viewport_1.DEFAULT_VIEWPORT,
                width: viewport.width,
                height: viewport.height,
            },
        });
    },
}));
