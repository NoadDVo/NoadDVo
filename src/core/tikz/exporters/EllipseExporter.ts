import type { EllipseObject } from "../../geometry/types";
import { getEllipseGeometry } from "../../geometry/conicGeometry";
import { formatStyleOptions, styleToTikzParts, formatPatternFill } from "../TikzFormatter";
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

    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";
    const path = `[rotate around={${angleDegrees}:(${center.x.toFixed(4)},${center.y.toFixed(4)})}] (${center.x.toFixed(4)},${center.y.toFixed(4)}) ellipse (${rx.toFixed(4)} and ${ry.toFixed(4)})`;

    if (hasPattern) {
      const patternLines = formatPatternFill(
        path,
        object.style,
        context.options,
        colorFor
      );
      
      patternLines.forEach(line => {
        context.scene.sections.fills.push(line);
      });

      if (object.style.strokeOpacity > 0 && object.style.strokeWidth > 0) {
        const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
        const strokeOptions = formatStyleOptions(
          styleToTikzParts(strokeStyle, context.options, colorFor)
        ).replace(/^\[|\]$/g, "");
        context.scene.sections.shapes.push(`\\draw [${strokeOptions}] ${path};`);
      }
    } else {
      context.scene.sections.shapes.push(`\\draw [${styleOptions}] ${path};`);
    }
  },
};
