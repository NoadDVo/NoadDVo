import { create } from "zustand";

import {
  DEFAULT_VIEWPORT,
  panViewport,
  resizeViewport,
  screenToWorld,
  zoomViewportAtScreenPoint,
  type Viewport,
} from "../../core/geometry/viewport";
import type { Point2D, ScreenPoint } from "../../core/geometry/types";

type ViewportState = {
  readonly viewport: Viewport;
  readonly gridSize: number;
  readonly adaptiveGrid: boolean;
  readonly canvasBackground: string;
  readonly coordinateDisplay: boolean;
  readonly gridColor: string;
  readonly infiniteCanvas: boolean;
  readonly majorGrid: boolean;
  readonly measurementPreview: boolean;
  readonly minorGrid: boolean;
  readonly renderingQuality: "balanced" | "crisp" | "high";
  readonly snapEnabled: boolean;
  readonly snapRadius: number;
  readonly snapTemporarilyDisabled: boolean;
  readonly showGrid: boolean;
  readonly showAxes: boolean;
  readonly showOrigin: boolean;
  readonly pointerWorld: Point2D;
  readonly isSpacePressed: boolean;
  readonly isPanning: boolean;
  readonly lastPanPoint: ScreenPoint | null;
  readonly setCanvasSize: (width: number, height: number) => void;
  readonly setViewportState: (
    viewport: Viewport,
    settings?: {
      readonly gridSize?: number;
      readonly snapEnabled?: boolean;
      readonly showGrid?: boolean;
      readonly showAxes?: boolean;
    },
  ) => void;
  readonly setPointerScreen: (point: ScreenPoint) => void;
  readonly updateCanvasSettings: (
    patch: Partial<
      Pick<
        ViewportState,
        | "adaptiveGrid"
        | "canvasBackground"
        | "coordinateDisplay"
        | "gridColor"
        | "gridSize"
        | "infiniteCanvas"
        | "majorGrid"
        | "measurementPreview"
        | "minorGrid"
        | "renderingQuality"
        | "showAxes"
        | "showGrid"
        | "showOrigin"
        | "snapEnabled"
        | "snapRadius"
      >
    >,
  ) => void;
  readonly zoomAt: (point: ScreenPoint, zoomFactor: number) => void;
  readonly startPan: (point: ScreenPoint) => void;
  readonly panTo: (point: ScreenPoint) => void;
  readonly endPan: () => void;
  readonly setSpacePressed: (pressed: boolean) => void;
  readonly setSnapTemporarilyDisabled: (disabled: boolean) => void;
  readonly resetViewport: () => void;
};

type PersistedViewportSettings = Partial<
  Pick<
    ViewportState,
    | "adaptiveGrid"
    | "canvasBackground"
    | "coordinateDisplay"
    | "gridColor"
    | "gridSize"
    | "infiniteCanvas"
    | "majorGrid"
    | "measurementPreview"
    | "minorGrid"
    | "renderingQuality"
    | "showAxes"
    | "showGrid"
    | "showOrigin"
    | "snapEnabled"
    | "snapRadius"
  >
>;

function readPersistedSettings(): PersistedViewportSettings {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem("ndv.viewportSettings") ?? "{}") as unknown;

    return typeof parsed === "object" && parsed !== null ? parsed as PersistedViewportSettings : {};
  } catch {
    return {};
  }
}

function persistSettings(settings: PersistedViewportSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("ndv.viewportSettings", JSON.stringify(settings));
}

const persistedSettings = readPersistedSettings();

export const useViewportStore = create<ViewportState>((set, get) => ({
  viewport: DEFAULT_VIEWPORT,
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
      viewport: resizeViewport(state.viewport, width, height),
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
      pointerWorld: screenToWorld(point, state.viewport),
    }));
  },
  updateCanvasSettings: (patch) => {
    set((state) => ({
      ...state,
      ...patch,
      gridSize:
        patch.gridSize === undefined
          ? state.gridSize
          : Math.max(0.01, patch.gridSize),
      snapRadius:
        patch.snapRadius === undefined
          ? state.snapRadius
          : Math.max(0, patch.snapRadius),
    }));
    const next = useViewportStore.getState();

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
      const viewport = zoomViewportAtScreenPoint(
        state.viewport,
        point,
        zoomFactor,
      );

      return {
        pointerWorld: screenToWorld(point, viewport),
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
    const nextViewport = panViewport(viewport, delta);

    set({
      lastPanPoint: point,
      pointerWorld: screenToWorld(point, nextViewport),
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
        ...DEFAULT_VIEWPORT,
        width: viewport.width,
        height: viewport.height,
      },
    });
  },
}));
