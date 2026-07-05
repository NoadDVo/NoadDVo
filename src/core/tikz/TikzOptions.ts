import type { TikzMode } from "./TikzTypes";

export type TikzOptions = {
  readonly coordinatePrecision: number;
  readonly exportLabels: boolean;
  readonly exportPoints: boolean;
  readonly includeColorDefinitions: boolean;
  readonly mode: TikzMode;
  readonly preserveColors: boolean;
  readonly preserveStyle: boolean;
  readonly scale: number;
};

const academicOptions: TikzOptions = {
  coordinatePrecision: 3,
  exportLabels: true,
  exportPoints: true,
  includeColorDefinitions: true,
  mode: "academic",
  preserveColors: true,
  preserveStyle: true,
  scale: 1,
};

export function getTikzOptions(mode: TikzMode = "academic"): TikzOptions {
  if (mode === "minimal") {
    return {
      ...academicOptions,
      exportLabels: false,
      exportPoints: false,
      includeColorDefinitions: false,
      mode,
      preserveColors: false,
      preserveStyle: false,
    };
  }

  if (mode === "colorful") {
    return {
      ...academicOptions,
      mode,
      preserveColors: true,
      preserveStyle: true,
    };
  }

  if (mode === "olympiad") {
    return {
      ...academicOptions,
      includeColorDefinitions: false,
      mode,
      preserveColors: false,
      preserveStyle: true,
    };
  }

  return academicOptions;
}
