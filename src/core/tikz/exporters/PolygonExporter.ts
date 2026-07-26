import type { PolygonObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts, getTikzPointReference, formatPatternFill } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

function hasVisibleFill(object: PolygonObject): boolean {
  return object.style.fill !== "transparent" && object.style.fillOpacity > 0;
}

function hasVisibleStroke(object: PolygonObject): boolean {
  return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}

export const PolygonExporter: TikzObjectExporter<PolygonObject> = {
  exportObject: (object, context) => {
    const names = object.pointIds
      .map((pointId) => getTikzPointReference(pointId, context))
      .filter((name): name is string => Boolean(name));

    if (names.length < 3) {
      context.warnings.push({
        code: "TIKZ_INVALID_POLYGON",
        message: "Polygon could not be exported because fewer than three boundary points are available.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    
    const path = names.map((name) => `(${name})`).join(" -- ") + " -- cycle";

    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";

    if (hasPattern) {
      if (hasVisibleFill(object)) {
        context.scene.sections.fills.push(`\\fill[${context.options.preserveColors ? colorFor(object.style.fill) : "white"}, fill opacity=${object.style.fillOpacity}] ${path};`);
      }

      const points = object.pointIds
        .map(id => context.scene.objects[id])
        .filter(o => o && o.type === "point") as any[];
        
      let bb: { xMin: number; xMax: number; yMin: number; yMax: number } | undefined;
      if (points.length > 0) {
        bb = {
          xMin: Math.min(...points.map((p: any) => p.geometry.x)),
          xMax: Math.max(...points.map((p: any) => p.geometry.x)),
          yMin: Math.min(...points.map((p: any) => p.geometry.y)),
          yMax: Math.max(...points.map((p: any) => p.geometry.y)),
        };
      }

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

      if (hasVisibleStroke(object)) {
        const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
        const strokeOptions = formatStyleOptions(
          styleToTikzParts(strokeStyle, context.options, colorFor)
        );
        context.scene.sections.shapes.push(`\\draw${strokeOptions} ${path};`);
      }
    } else {
      const fillVisible = context.options.preserveStyle && hasVisibleFill(object);
      const strokeVisible = hasVisibleStroke(object);
      const options = formatStyleOptions({
        ...style,
        draw: strokeVisible ? style.draw : undefined,
        lineWidth: strokeVisible ? style.lineWidth : undefined,
        strokeOpacity: strokeVisible ? style.strokeOpacity : undefined,
        fill: fillVisible ? style.fill : undefined,
        fillOpacity: fillVisible ? style.fillOpacity : undefined,
      });
      const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
      const targetSection = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;

      targetSection.push(`${command}${options} ${path};`);
    }
  },
  objectType: "polygon",
};
