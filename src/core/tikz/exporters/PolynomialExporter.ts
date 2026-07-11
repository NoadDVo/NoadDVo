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
    
    const coeffs = getPolynomialCoefficients(points);
    
    // Format equation: a_0 + a_1*x + a_2*x^2 + ...
    let equation = "";
    for (let i = 0; i < coeffs.length; i++) {
       if (Math.abs(coeffs[i]!) < 1e-9) continue;
       
       let coeffStr = formatNumber(Math.abs(coeffs[i]!));
       if (coeffStr === "1" && i > 0) coeffStr = ""; // omit 1x
       
       if (equation === "") {
         equation += (coeffs[i]! < 0 ? "-" : "") + formatNumber(Math.abs(coeffs[i]!));
         if (i === 1) equation += "*\\x";
         else if (i > 1) equation += `*(\\x)^${i}`;
       } else {
         equation += (coeffs[i]! < 0 ? " - " : " + ") + coeffStr;
         if (i === 1) equation += "*\\x";
         else if (i > 1) equation += `*(\\x)^${i}`;
       }
    }
    
    if (equation === "") equation = "0";

    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const styleParts = styleToTikzParts(object.style, context.options, colorFor);
    
    // TikZ needs a domain to draw a function.
    let minX = Infinity;
    let maxX = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
    }
    
    let domainStr = "domain=-10:10";
    if (minX !== Infinity && minX !== maxX) {
      domainStr = `domain=${formatNumber(minX)}:${formatNumber(maxX)}`;
    }
    
    let optionsStr = formatStyleOptions(styleParts).replace(/^\[|\]$/g, "");
    
    if (optionsStr) optionsStr += ", ";
    optionsStr += `${domainStr}, samples=100`;

    const finalOptions = `[${optionsStr}]`;

    context.scene.sections.shapes.push(`\\draw ${finalOptions} plot (\\x, {${equation}});`);
  },
};
