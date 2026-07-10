import type { HyperbolaObject } from "../../geometry/types";
import { getHyperbolaGeometry } from "../../geometry/conicGeometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

export const HyperbolaExporter: TikzObjectExporter<HyperbolaObject> = {
  objectType: "hyperbola",
  exportObject: (object, context: TikzExportContext) => {
    const geometry = getHyperbolaGeometry(object, context.scene.objects);
    
    if (!geometry) {
      return;
    }

    const { center, a, b, angleDegrees, tRange } = geometry;
    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const styleParts = styleToTikzParts(object.style, context.options, colorFor);
    const styleOptions = formatStyleOptions(styleParts).replace(/^\[|\]$/g, "");
    
    const transform = `shift={(${center.x.toFixed(4)},${center.y.toFixed(4)})}, rotate=${angleDegrees.toFixed(4)}`;

    // Tikz plot with domain
    // Branch 1: x = a*cosh(t)
    context.scene.sections.shapes.push(`\\draw [${styleOptions}, ${transform}] plot [domain=-${tRange.toFixed(4)}:${tRange.toFixed(4)}, samples=50] ({${a.toFixed(4)}*cosh(\\x)}, {${b.toFixed(4)}*sinh(\\x)});`);
    // Branch 2: x = -a*cosh(t)
    context.scene.sections.shapes.push(`\\draw [${styleOptions}, ${transform}] plot [domain=-${tRange.toFixed(4)}:${tRange.toFixed(4)}, samples=50] ({-${a.toFixed(4)}*cosh(\\x)}, {${b.toFixed(4)}*sinh(\\x)});`);
  },
};
