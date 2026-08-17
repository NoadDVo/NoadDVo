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

    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";
    const path = `[rotate around={${angleDegrees}:(${center.x.toFixed(4)},${center.y.toFixed(4)})}] (${center.x.toFixed(4)},${center.y.toFixed(4)}) ellipse (${rx.toFixed(4)} and ${ry.toFixed(4)})`;

    if (object.style.fill !== "transparent" && object.style.fillOpacity > 0) {
      const fillStyle = { ...object.style, stroke: "transparent", strokeWidth: 0, strokeOpacity: 0 };
      const fillOptions = formatStyleOptions(
        styleToTikzParts(fillStyle, context.options, colorFor)
      );
      context.scene.sections.shapes.push(`\\fill${fillOptions} ${path};`);
    }

    if (hasPattern) {
      const maxR = Math.max(rx, ry);
      const bb = {
        xMin: center.x - maxR,
        xMax: center.x + maxR,
        yMin: center.y - maxR,
        yMax: center.y + maxR,
      };
      const patternLines = formatPatternFill(
        path,
        object.style,
        context.options,
        colorFor,
        bb
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
      if (object.style.strokeOpacity > 0 && object.style.strokeWidth > 0) {
        const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
        const strokeOptions = formatStyleOptions(
          styleToTikzParts(strokeStyle, context.options, colorFor)
        ).replace(/^\[|\]$/g, "");
        context.scene.sections.shapes.push(`\\draw [${strokeOptions}] ${path};`);
      }
    }
  },
};
