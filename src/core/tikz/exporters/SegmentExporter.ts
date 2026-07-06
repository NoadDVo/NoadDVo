import type { SegmentObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const SegmentExporter: TikzObjectExporter<SegmentObject> = {
  exportObject: (object, context) => {
    const startName = context.nameRegistry.getPointName(object.startPointId);
    const endName = context.nameRegistry.getPointName(object.endPointId);

    if (!startName || !endName) {
      context.warnings.push({
        code: "TIKZ_INVALID_SEGMENT",
        message: "Segment could not be exported because one or both endpoints are unavailable.",
        objectId: object.id,
      });
      return;
    }

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);

    context.scene.sections.shapes.push(
      `\\draw${formatStyleOptions(style)} (${startName}) -- (${endName});`,
    );
  },
  objectType: "segment",
};
