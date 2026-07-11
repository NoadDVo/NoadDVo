import { create } from "zustand";

type AppState = {
  readonly appName: string;
};

export const useAppStore = create<AppState>(() => ({
  appName: "NoadDVo Geometry Studio",
}));
