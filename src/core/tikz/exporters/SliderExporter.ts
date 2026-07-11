import type { SliderObject } from "../../geometry/types";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

export const SliderExporter: TikzObjectExporter<SliderObject> = {
  objectType: "slider",
  exportObject: (object, context: TikzExportContext) => {
    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const styleParts = styleToTikzParts(object.style, context.options, colorFor);
    const styleOptions = formatStyleOptions(styleParts).replace(/^\[|\]$/g, "");

    
    // Assume width in TikZ coordinates is roughly widthPx / 50 (to match some scale)
    // We'll just draw a line from (x, y) to (x + width, y)
    const widthWorld = object.widthPx / 50; 
    const trackStartX = object.x;
    const trackStartY = object.y;
    const trackEndX = object.x + widthWorld;
    const trackEndY = object.y;

    const ratio = (object.value - object.min) / (object.max - object.min);
    const knobX = trackStartX + widthWorld * ratio;

    // Track
    context.scene.sections.shapes.push(`\\draw [${styleOptions}] (${trackStartX.toFixed(4)},${trackStartY.toFixed(4)}) -- (${trackEndX.toFixed(4)},${trackEndY.toFixed(4)});`);
    
    // Knob
    context.scene.sections.shapes.push(`\\filldraw [fill=white, ${styleOptions}] (${knobX.toFixed(4)},${trackStartY.toFixed(4)}) circle (2pt);`);
    
    // Label
    if (object.style.labelVisible) {
      context.scene.sections.shapes.push(`\\node [above, text=${colorFor(object.style.stroke)}] at (${trackStartX.toFixed(4)},${(trackStartY + 0.2).toFixed(4)}) {${object.variableName} = ${object.value.toFixed(2)}};`);
    }
  },
};
