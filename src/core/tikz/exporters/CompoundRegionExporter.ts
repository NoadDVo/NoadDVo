import type { CompoundRegionObject, PointObject } from "../../geometry";
import { formatStyleOptions, styleToTikzParts, getTikzPointReference, formatPatternFill } from "../TikzFormatter";
import type { TikzObjectExporter } from "../TikzTypes";
import { getPointObject } from "../../geometry/derivedGeometry";

function hasVisibleFill(object: CompoundRegionObject): boolean {
  return object.style.fill !== "transparent" && object.style.fillOpacity > 0;
}

function hasVisibleStroke(object: CompoundRegionObject): boolean {
  return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}

export const CompoundRegionExporter: TikzObjectExporter<CompoundRegionObject> = {
  exportObject: (object, context) => {
    const { segments } = object;
    if (!segments || segments.length === 0) return;

    const objects = context.scene.objects;
    const colorFor = (color: string) => context.colorRegistry.getColorName(color);
    const style = styleToTikzParts(object.style, context.options, colorFor);

    let path = "";

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;

      const startPointId = segment.startPointId;
      const endPointId = segment.endPointId;
      let startName = getTikzPointReference(startPointId, context);
      let endName = getTikzPointReference(endPointId, context);

      if (!startName && segment.startCoord) {
        startName = `${segment.startCoord.x}, ${segment.startCoord.y}`;
      }
      if (!endName && segment.endCoord) {
        endName = `${segment.endCoord.x}, ${segment.endCoord.y}`;
      }

      if (!startName || !endName) continue;

      if (i === 0) {
        path += `(${startName})`;
      }

      if (segment.type === "line") {
        path += ` -- (${endName})`;
      } else if (segment.type === "circle-arc" || segment.type === "ellipse-arc") {
        const startPoint = getPointObject(objects, startPointId) ?? segment.startCoord;
        const endPoint = getPointObject(objects, endPointId) ?? segment.endCoord;
        const centerPointId = "centerPointId" in segment ? segment.centerPointId : "";
        const centerPoint = getPointObject(objects, centerPointId) ?? ("centerCoord" in segment ? segment.centerCoord : undefined);
        
        if (!startPoint || !endPoint || !centerPoint) continue;

        const dxStart = startPoint.x - centerPoint.x;
        const dyStart = startPoint.y - centerPoint.y;
        const dxEnd = endPoint.x - centerPoint.x;
        const dyEnd = endPoint.y - centerPoint.y;

        let rx: number, ry: number;
        
        if (segment.type === "ellipse-arc") {
          if (segment.radiusX > 0) {
            rx = segment.radiusX;
          } else {
            rx = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
          }
          ry = segment.radiusY;
        } else {
          if ("radius" in segment && segment.radius !== undefined) {
            rx = segment.radius;
          } else {
            rx = Math.sqrt(dxStart * dxStart + dyStart * dyStart);
          }
          ry = rx;
        }

        let startAngle = (Math.atan2(dyStart, dxStart) * 180) / Math.PI;
        let endAngle = (Math.atan2(dyEnd, dxEnd) * 180) / Math.PI;

        if (startAngle < 0) startAngle += 360;
        if (endAngle < 0) endAngle += 360;

        if ("direction" in segment && segment.direction === "counterclockwise") {
          if (endAngle <= startAngle) {
            endAngle += 360;
          }
        } else {
          if (endAngle >= startAngle) {
            endAngle -= 360;
          }
        }

        path += ` arc [start angle=${startAngle.toFixed(3)}, end angle=${endAngle.toFixed(3)}, x radius=${rx.toFixed(3)}, y radius=${ry.toFixed(3)}]`;
      } else if (segment.type === "curve") {
        const cps = "controlPoints" in segment ? segment.controlPoints
          .map(id => getTikzPointReference(id, context))
          .filter((name): name is string => Boolean(name)) : [];

        if (cps.length === 0 || ("curveType" in segment && segment.curveType === "spline")) {
          path += ` -- (${endName})`;
        } else if (cps.length === 1 || ("curveType" in segment && segment.curveType === "quadratic-bezier")) {
          path += ` .. controls (${cps[0]}) and (${cps[0]}) .. (${endName})`;
        } else {
          path += ` .. controls (${cps[0]}) and (${cps[1]}) .. (${endName})`;
        }
      }
    }

    if (object.closed && path) {
      path += " -- cycle";
    }

    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";

    if (hasPattern) {
      if (hasVisibleFill(object)) {
        const fillStyle = { ...object.style, stroke: "transparent", strokeWidth: 0, strokeOpacity: 0 };
        const fillOptions = formatStyleOptions(
          styleToTikzParts(fillStyle, context.options, colorFor)
        );
        context.scene.sections.fills.push(`\\fill${fillOptions} ${path};`);
      }

      // Compute bounding box for pattern
      const points = segments.flatMap(s => [s.startPointId, s.endPointId])
        .map(id => context.scene.objects[id])
        .filter(o => o && o.type === "point") as PointObject[];
        
      let bb: { xMin: number; xMax: number; yMin: number; yMax: number } | undefined;
      if (points.length > 0) {
        bb = {
          xMin: Math.min(...points.map((p) => p.x)),
          xMax: Math.max(...points.map((p) => p.x)),
          yMin: Math.min(...points.map((p) => p.y)),
          yMax: Math.max(...points.map((p) => p.y)),
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
      const fillVisible = hasVisibleFill(object);
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
  objectType: "compound-region",
};
