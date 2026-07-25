import { getPolynomialCoefficients } from "../../geometry/polynomialGeometry";
import type { TikzObjectExporter } from "../TikzTypes";
import { getPointObject } from "../../geometry/derivedGeometry";
import type { Point2D, PolynomialObject } from "../../geometry/types";
import { formatNumber, formatStyleOptions, styleToTikzParts } from "../TikzFormatter";

export const PolynomialExporter: TikzObjectExporter<PolynomialObject> = {
  objectType: "polynomial",
  exportObject: (object, context) => {
    const points: Point2D[] = [];
    for (const id of object.pointIds) {
      const p = getPointObject(context.scene.objects, id);
      if (p) points.push(p);
    }
    
    if (points.length < 2) return;
    
    const ptsX = points.map((p, i) => ({ x: i, y: p.x }));
    const ptsY = points.map((p, i) => ({ x: i, y: p.y }));
    
    const coeffsX = getPolynomialCoefficients(ptsX);
    const coeffsY = getPolynomialCoefficients(ptsY);
    
    const buildEq = (coeffs: number[]) => {
      let equation = "";
      for (let i = 0; i < coeffs.length; i++) {
         if (Math.abs(coeffs[i]!) < 1e-9) continue;
         
         let coeffStr = formatNumber(Math.abs(coeffs[i]!));
         if (coeffStr === "1" && i > 0) coeffStr = ""; // omit 1x
         
         if (equation === "") {
           equation += (coeffs[i]! < 0 ? "-" : "") + formatNumber(Math.abs(coeffs[i]!));
           if (i === 1) equation += "*\\t";
           else if (i > 1) equation += `*(\\t)^${i}`;
         } else {
           equation += (coeffs[i]! < 0 ? " - " : " + ") + coeffStr;
           if (i === 1) equation += "*\\t";
           else if (i > 1) equation += `*(\\t)^${i}`;
         }
      }
      return equation === "" ? "0" : equation;
    };
    
    const eqX = buildEq(coeffsX);
    const eqY = buildEq(coeffsY);

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const styleParts = styleToTikzParts(object.style, context.options, colorFor);
    
    let domainStr = `domain=0:${points.length - 1}`;
    
    let optionsStr = formatStyleOptions(styleParts).replace(/^\[|\]$/g, "");
    
    if (optionsStr) optionsStr += ", ";
    optionsStr += `${domainStr}, samples=100, variable=\\t`;

    const finalOptions = `[${optionsStr}]`;

    context.scene.sections.shapes.push(`\\draw ${finalOptions} plot ({${eqX}}, {${eqY}});`);
  },
};
