import {
  collectBoundaryPrimitives,
  getArcGeometry,
  getCircleGeometry,
  getPointObject,
  type BoundaryEdge,
  type RegionObject,
} from "../../geometry";

import {
  formatNumber,
  formatPoint,
  formatStyleOptions,
  getTikzPointReference,
  styleToTikzParts,
  formatPatternFill,
} from "../TikzFormatter";
import type { TikzExportContext, TikzObjectExporter } from "../TikzTypes";

function hasVisibleFill(object: RegionObject): boolean {
  return object.style.fill !== "transparent" && object.style.fillOpacity > 0;
}

function hasVisibleStroke(object: RegionObject): boolean {
  return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}

function edgeToTikz(edge: BoundaryEdge, context: TikzExportContext, first: boolean): string | null {
  const object = context.scene.objects[edge.objectId];
  const precision = context.options.coordinatePrecision;

  if (
    (
      edge.edgeKind === "segment" ||
      edge.edgeKind === "polygon-edge" ||
      edge.edgeKind === "line" ||
      edge.edgeKind === "ray" ||
      edge.edgeKind === "ellipse" ||
      edge.edgeKind === "hyperbola" ||
      edge.edgeKind === "polynomial"
    ) &&
    edge.startParameter !== undefined &&
    edge.endParameter !== undefined
  ) {
    const primitive = collectBoundaryPrimitives(context.scene.objects).find((candidate) =>
      edge.sourcePrimitiveId
        ? candidate.id === edge.sourcePrimitiveId
        : candidate.objectId === edge.objectId,
    );

    if (primitive?.kind === "linear" && primitive.origin && primitive.vector) {
      const start = {
        x: primitive.origin.x + primitive.vector.x * edge.startParameter,
        y: primitive.origin.y + primitive.vector.y * edge.startParameter,
      };
      const end = {
        x: primitive.origin.x + primitive.vector.x * edge.endParameter,
        y: primitive.origin.y + primitive.vector.y * edge.endParameter,
      };

      return `${first ? formatPoint(start, precision) : ""} -- ${formatPoint(end, precision)}`.trim();
    }
  }

  if (edge.edgeKind === "circle" && object?.type === "circle") {
    const circle = getCircleGeometry(object, context.scene.objects);

    return circle
      ? `${formatPoint(circle.center, precision)} circle (${formatNumber(circle.radius, precision)})`
      : null;
  }

  if (edge.edgeKind === "arc") {
    if (object?.type === "arc") {
      const geometry = getArcGeometry(object, context.scene.objects);

      if (!geometry) {
        return null;
      }

      const startAngle = edge.startParameter ?? geometry.startAngleDegrees;
      const endAngle = edge.endParameter ?? geometry.endAngleDegrees;
      const startRadians = (startAngle * Math.PI) / 180;
      const start = formatPoint({
        x: geometry.center.x + Math.cos(startRadians) * geometry.radius,
        y: geometry.center.y + Math.sin(startRadians) * geometry.radius,
      }, precision);

      return `${first ? start : ""} arc[start angle=${formatNumber(startAngle, precision)}, end angle=${formatNumber(endAngle, precision)}, radius=${formatNumber(geometry.radius, precision)}]`.trim();
    }

    if (object?.type === "circle" && edge.startParameter !== undefined && edge.endParameter !== undefined) {
      const circle = getCircleGeometry(object, context.scene.objects);

      if (!circle) {
        return null;
      }
      const startAngle = edge.startParameter;
      const clockwiseDelta = (edge.startParameter - edge.endParameter + 360) % 360 || 360;
      const endAngle = edge.direction === "reverse"
        ? edge.startParameter - clockwiseDelta
        : edge.endParameter;
      const startRadians = (startAngle * Math.PI) / 180;
      const startPoint = {
        x: circle.center.x + Math.cos(startRadians) * circle.radius,
        y: circle.center.y + Math.sin(startRadians) * circle.radius,
      };

      return `${first ? formatPoint(startPoint, precision) : ""} arc[start angle=${formatNumber(startAngle, precision)}, end angle=${formatNumber(endAngle, precision)}, radius=${formatNumber(circle.radius, precision)}]`.trim();
    }
  }

  const startPointId = edge.direction === "reverse" ? edge.endPointId : edge.startPointId;
  const endPointId = edge.direction === "reverse" ? edge.startPointId : edge.endPointId;
  const startPoint = startPointId ? getPointObject(context.scene.objects, startPointId) : null;
  const point = endPointId ? getPointObject(context.scene.objects, endPointId) : null;

  if (!point || (first && !startPoint)) {
    return null;
  }

  return `${first && startPoint ? formatPoint(startPoint, precision) : ""} -- ${formatPoint(point, precision)}`.trim();
}

function optimizePathParts(parts: (string | null)[]): string | null {
  if (parts.some((part) => part === null)) {
    return null;
  }

  const optimized: string[] = [];
  let currentCoords: string[] = [];

  const flushCoords = () => {
    if (currentCoords.length > 0) {
      if (currentCoords.length <= 2) {
        if (optimized.length > 0) optimized.push("--");
        optimized.push(currentCoords.join(" -- "));
      } else {
        const parse = (s: string) => {
          const p = s.replace("(", "").replace(")", "").split(",");
          return { x: parseFloat(p[0]!), y: parseFloat(p[1]!), s };
        };

        const parsedPoints = currentCoords.map(parse);

        const rdp = (points: {x: number, y: number, s: string}[], epsilonSq: number): {x: number, y: number, s: string}[] => {
          if (points.length <= 2) return points;

          let maxDistSq = 0;
          let index = 0;
          const start = points[0]!;
          const end = points[points.length - 1]!;

          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const lengthSq = dx * dx + dy * dy;

          for (let i = 1; i < points.length - 1; i++) {
            const p = points[i]!;
            let distSq = 0;

            if (lengthSq === 0) {
              distSq = (p.x - start.x) ** 2 + (p.y - start.y) ** 2;
            } else {
              const cross = (p.x - start.x) * dy - (p.y - start.y) * dx;
              distSq = (cross * cross) / lengthSq;
            }

            if (distSq > maxDistSq) {
              maxDistSq = distSq;
              index = i;
            }
          }

          if (maxDistSq > epsilonSq) {
            const left = rdp(points.slice(0, index + 1), epsilonSq);
            const right = rdp(points.slice(index), epsilonSq);
            return left.slice(0, left.length - 1).concat(right);
          } else {
            return [start, end];
          }
        };

        // Use epsilon = 0.005 (squared = 0.000025) which is ~0.05mm precision
        const simplified = rdp(parsedPoints, 0.000025).map((p) => p.s);

        if (optimized.length > 0) optimized.push("--");

        let chunked = "";
        for (let i = 0; i < simplified.length; i++) {
          if (i > 0 && i % 10 === 0) chunked += "\n  ";
          else if (i > 0) chunked += " ";
          chunked += simplified[i];
        }
        optimized.push(`plot coordinates { ${chunked} }`);
      }
      currentCoords = [];
    }
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!.trim();

    const isPointPath = /^(--\s*)?(\([-\d.,]+\))(\s*--\s*(\([-\d.,]+\)))*$/.test(part);

    if (isPointPath) {
      const points = part.match(/\([-\d.,]+\)/g);
      if (points) {
        for (const p of points) {
          if (currentCoords.length === 0 || currentCoords[currentCoords.length - 1] !== p) {
            currentCoords.push(p);
          }
        }
      }
    } else {
      flushCoords();
      optimized.push(part);
    }
  }
  flushCoords();

  return `${optimized.join(" ")} -- cycle`;
}

function pathForBoundaryRegion(
  object: RegionObject,
  context: TikzExportContext,
): string | null {
  const loop = object.loops?.[0];

  if (!loop || loop.edges.length === 0) {
    return null;
  }

  if (loop.edges.length === 1 && loop.edges[0]?.edgeKind === "circle") {
    return edgeToTikz(loop.edges[0], context, true);
  }

  const parts = loop.edges.map((edge, index) => edgeToTikz(edge, context, index === 0));

  return optimizePathParts(parts);
}

export const RegionExporter: TikzObjectExporter<RegionObject> = {
  exportObject: (object, context) => {
    if (object.regionKind === "boundary") {
      const path = pathForBoundaryRegion(object, context);

      if (!path) {
        context.warnings.push({
          code: "TIKZ_INVALID_REGION",
          message: "Boundary region could not be exported because its loop is invalid.",
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
        lineWidth: strokeVisible ? style.lineWidth : undefined,
        strokeOpacity: strokeVisible ? style.strokeOpacity : undefined,
        fill: fillVisible ? style.fill : undefined,
        fillOpacity: fillVisible ? style.fillOpacity : undefined,
      });

      const hasPattern = object.style.pattern && object.style.pattern.type !== "none";
      if (hasPattern) {
        if (fillVisible) {
          context.scene.sections.fills.push(`\\fill[${context.options.preserveColors ? colorFor(object.style.fill) : "white"}, fill opacity=${object.style.fillOpacity}] ${path};`);
        }

        const points = object.boundaryPointIds
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
        patternLines.forEach((line) => {
          context.scene.sections.fills.push(line);
        });

        if (strokeVisible) {
          const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
          const strokeOptions = formatStyleOptions(
            styleToTikzParts(strokeStyle, context.options, colorFor)
          );
          context.scene.sections.shapes.push(`\\draw${strokeOptions} ${path};`);
        }
      } else {
        const command = `\\${fillVisible && strokeVisible ? "filldraw" : fillVisible ? "fill" : "draw"}`;
        const section = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;
        section.push(`${command} ${options} ${path};`);
      }
      return;
    }



    const names = object.boundaryPointIds
      .map((pointId) => getTikzPointReference(pointId, context))
      .filter((name): name is string => Boolean(name));

    const parts = [names.map((name) => `(${name})`).join(" -- ")];
    const path = optimizePathParts(parts);

    if (!path) {
      context.warnings.push({
        code: "TIKZ_INVALID_REGION",
        message: "Region could not be exported because it has no boundary points.",
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
      lineWidth: strokeVisible ? style.lineWidth : undefined,
      strokeOpacity: strokeVisible ? style.strokeOpacity : undefined,
      fill: fillVisible ? style.fill : undefined,
      fillOpacity: fillVisible ? style.fillOpacity : undefined,
    });
    const hasPattern = object.style.pattern && object.style.pattern.type !== "none";
    if (hasPattern) {
      if (fillVisible) {
        context.scene.sections.fills.push(`\\fill[${context.options.preserveColors ? colorFor(object.style.fill) : "white"}, fill opacity=${object.style.fillOpacity}] ${path};`);
      }

      const points = object.boundaryPointIds
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
      patternLines.forEach((line) => {
        context.scene.sections.fills.push(line);
      });

      if (strokeVisible) {
        const strokeStyle = { ...object.style, fill: "transparent", fillOpacity: 0 };
        const strokeOptions = formatStyleOptions(
          styleToTikzParts(strokeStyle, context.options, colorFor)
        );
        context.scene.sections.shapes.push(`\\draw${strokeOptions} ${path};`);
      }
    } else {
      const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
      const section = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;

      section.push(`${command}${options} ${path};`);
    }
  },
  objectType: "region",
};
