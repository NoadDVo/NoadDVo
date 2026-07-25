import type { SliderObject } from "../../geometry/types";
// No imports from TikzFormatter needed anymore
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

export const SliderExporter: TikzObjectExporter<SliderObject> = {
  objectType: "slider",
  exportObject: (_object, _context: TikzExportContext) => {
    // Sliders are UI-only elements and should not be exported to static TikZ images
  },
};
