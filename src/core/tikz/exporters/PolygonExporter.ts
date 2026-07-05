import type { PolygonObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const PolygonExporter: TikzObjectExporter<PolygonObject> = {
  exportObject: (object, context) => {
    const names = object.pointIds
      .map((pointId) => context.nameRegistry.getPointName(pointId))
      .filter((name): name is string => Boolean(name));

    if (names.length < 3) {
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const options = formatStyleOptions({
      ...style,
      fill: object.style.fill !== "transparent" ? style.fill : undefined,
    });

    context.scene.sections.shapes.push(
      `\\draw${options} ${names.map((name) => `(${name})`).join(" -- ")} -- cycle;`,
    );
  },
  objectType: "polygon",
};
