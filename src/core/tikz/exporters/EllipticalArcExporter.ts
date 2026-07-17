import type { EllipticalArcObject } from "../../geometry";
import { getEllipticalArcGeometry } from "../../geometry";
import {
  formatNumber,
} from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";

export const EllipticalArcExporter: TikzObjectExporter<EllipticalArcObject> = {
  exportObject: (object, context) => {
    const geometry = getEllipticalArcGeometry(object, context.scene.objects);

    if (!geometry) {
      context.warnings.push({
        code: "TIKZ_INVALID_ELLIPTICAL_ARC",
        message: "Elliptical Arc could not be exported because its dependencies are unavailable or degenerate.",
        objectId: object.id,
      });
      return;
    }

    const phiDegrees = (geometry.phi * 180) / Math.PI;
    const thetaEndDegrees = (geometry.thetaEnd * 180) / Math.PI;

    const centerX = formatNumber(geometry.center.x, context.options.coordinatePrecision);
    const centerY = formatNumber(geometry.center.y, context.options.coordinatePrecision);
    const rx = formatNumber(geometry.rx, context.options.coordinatePrecision);
    const ry = formatNumber(geometry.ry, context.options.coordinatePrecision);
    const phiStr = formatNumber(phiDegrees, context.options.coordinatePrecision);
    const thetaEndStr = formatNumber(thetaEndDegrees, context.options.coordinatePrecision);

    context.scene.sections.shapes.push(
      `\\draw[line width=0.8pt, draw=black, shift={(${centerX}, ${centerY})}, rotate=${phiStr}] (${rx}, 0) arc [start angle=0, end angle=${thetaEndStr}, x radius=${rx}cm, y radius=${ry}cm];`,
    );
  },
  objectType: "elliptical-arc",
};
