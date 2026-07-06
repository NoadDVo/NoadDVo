import type { PolygonObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
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
      .map((pointId) => context.nameRegistry.getPointName(pointId))
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
    const fillVisible = context.options.preserveStyle && hasVisibleFill(object);
    const strokeVisible = hasVisibleStroke(object);
    const options = formatStyleOptions({
      ...style,
      draw: strokeVisible ? style.draw : undefined,
      fill: fillVisible ? style.fill : undefined,
      fillOpacity: fillVisible ? style.fillOpacity : undefined,
    });
    const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
    const targetSection = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;

    targetSection.push(
      `${command}${options} ${names.map((name) => `(${name})`).join(" -- ")} -- cycle;`,
    );
  },
  objectType: "polygon",
};
