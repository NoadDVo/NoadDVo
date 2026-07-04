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
  readonly snapEnabled: boolean;
  readonly showGrid: boolean;
  readonly showAxes: boolean;
  readonly pointerWorld: Point2D;
  readonly isSpacePressed: boolean;
  readonly isPanning: boolean;
  readonly lastPanPoint: ScreenPoint | null;
  readonly setCanvasSize: (width: number, height: number) => void;
  readonly setPointerScreen: (point: ScreenPoint) => void;
  readonly zoomAt: (point: ScreenPoint, zoomFactor: number) => void;
  readonly startPan: (point: ScreenPoint) => void;
  readonly panTo: (point: ScreenPoint) => void;
  readonly endPan: () => void;
  readonly setSpacePressed: (pressed: boolean) => void;
  readonly resetViewport: () => void;
};

export const useViewportStore = create<ViewportState>((set, get) => ({
  viewport: DEFAULT_VIEWPORT,
  gridSize: 1,
  snapEnabled: true,
  showGrid: true,
  showAxes: true,
  pointerWorld: { x: 0, y: 0 },
  isSpacePressed: false,
  isPanning: false,
  lastPanPoint: null,
  setCanvasSize: (width, height) => {
    set((state) => ({
      viewport: resizeViewport(state.viewport, width, height),
    }));
  },
  setPointerScreen: (point) => {
    set((state) => ({
      pointerWorld: screenToWorld(point, state.viewport),
    }));
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
