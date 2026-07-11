import {
  getVectorArrowSize,
  getVectorArrowStyle,
  vectorArrowStyleToTikz,
  type VectorObject,
} from "../../geometry";
import {
  formatTikzOptions,
  stylePartsToOptions,
  styleToTikzParts,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const VectorExporter: TikzObjectExporter<VectorObject> = {
  exportObject: (object, context) => {
    const startName = context.nameRegistry.getPointName(object.startPointId);
    const endName = context.nameRegistry.getPointName(object.endPointId);

    if (!startName || !endName) {
      context.warnings.push({
        code: "TIKZ_INVALID_VECTOR",
        message: "Vector could not be exported because one or both endpoints are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);
    const arrow = vectorArrowStyleToTikz(
      getVectorArrowStyle(object),
      getVectorArrowSize(object),
    );
    const options = formatTikzOptions([
      ...(arrow ? [arrow] : []),
      ...stylePartsToOptions(style),
    ]);

    context.scene.sections.shapes.push(
      `\\draw${options} (${startName}) -- (${endName});`,
    );
  },
  objectType: "vector",
};
