import type { EllipseObject } from "../../geometry/types";
import { getEllipseGeometry } from "../../geometry/conicGeometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

export const EllipseExporter: TikzObjectExporter<EllipseObject> = {
  objectType: "ellipse",
  exportObject: (object, context: TikzExportContext) => {
    const geometry = getEllipseGeometry(object, context.scene.objects);
    
    if (!geometry) {
      return;
    }

    const { center, rx, ry, angleDegrees } = geometry;
    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const styleParts = styleToTikzParts(object.style, context.options, colorFor);
    const styleOptions = formatStyleOptions(styleParts).replace(/^\[|\]$/g, "");

    context.scene.sections.shapes.push(`\\draw [${styleOptions}, rotate around={${angleDegrees}:(${center.x.toFixed(4)},${center.y.toFixed(4)})}] (${center.x.toFixed(4)},${center.y.toFixed(4)}) ellipse (${rx.toFixed(4)} and ${ry.toFixed(4)});`);
  },
};
