import type { TikzMode, TikzOutputType } from "./TikzTypes";

export type TikzOptions = {
  readonly coordinatePrecision: number;
  readonly exportAxes: boolean;
  readonly exportGrid: boolean;
  readonly exportLabels: boolean;
  readonly exportPoints: boolean;
  readonly includeColorDefinitions: boolean;
  readonly includeComments: boolean;
  readonly includeDocumentWrapper: boolean;
  readonly includeTikzLibraries: boolean;
  readonly mode: TikzMode;
  readonly outputType: TikzOutputType;
  readonly preferTkzEuclide: boolean;
  readonly preserveColors: boolean;
  readonly preserveStyle: boolean;
  readonly scale: number;
  readonly showHiddenObjects: boolean;
  readonly usePointNames: boolean;
};

export const DEFAULT_TIKZ_OPTIONS: TikzOptions = {
  coordinatePrecision: 3,
  exportAxes: false,
  exportGrid: false,
  exportLabels: true,
  exportPoints: true,
  includeColorDefinitions: true,
  includeComments: true,
  includeDocumentWrapper: false,
  includeTikzLibraries: true,
  mode: "academic",
  outputType: "snippet",
  preferTkzEuclide: false,
  preserveColors: true,
  preserveStyle: true,
  scale: 1,
  showHiddenObjects: false,
  usePointNames: true,
};

export function getTikzOptions(mode: TikzMode = "academic"): TikzOptions {
  if (mode === "minimal") {
    return {
      ...DEFAULT_TIKZ_OPTIONS,
      exportLabels: false,
      exportPoints: false,
      includeColorDefinitions: false,
      includeComments: false,
      mode,
      preserveColors: false,
      preserveStyle: false,
    };
  }

  if (mode === "colorful") {
    return {
      ...DEFAULT_TIKZ_OPTIONS,
      mode,
      preserveColors: true,
      preserveStyle: true,
    };
  }

  if (mode === "olympiad") {
    return {
      ...DEFAULT_TIKZ_OPTIONS,
      includeColorDefinitions: false,
      mode,
      preserveColors: false,
      preserveStyle: false,
    };
  }

  return DEFAULT_TIKZ_OPTIONS;
}
