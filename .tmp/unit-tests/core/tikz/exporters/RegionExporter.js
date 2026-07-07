"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegionExporter = void 0;
const geometry_1 = require("../../geometry");
const TikzFormatter_1 = require("../TikzFormatter");
function hasVisibleFill(object) {
    return object.style.fill !== "transparent" && object.style.fillOpacity > 0;
}
function hasVisibleStroke(object) {
    return object.style.strokeOpacity > 0 && object.style.strokeWidth > 0;
}
function edgeToTikz(edge, context, first) {
    const object = context.scene.objects[edge.objectId];
    const precision = context.options.coordinatePrecision;
    if ((edge.edgeKind === "segment" ||
        edge.edgeKind === "polygon-edge" ||
        edge.edgeKind === "line" ||
        edge.edgeKind === "ray") &&
        edge.startParameter !== undefined &&
        edge.endParameter !== undefined) {
        const primitive = (0, geometry_1.collectBoundaryPrimitives)(context.scene.objects).find((candidate) => candidate.id === edge.sourcePrimitiveId ||
            candidate.objectId === edge.objectId);
        if (primitive?.kind === "linear" && primitive.origin && primitive.vector) {
            const start = {
                x: primitive.origin.x + primitive.vector.x * edge.startParameter,
                y: primitive.origin.y + primitive.vector.y * edge.startParameter,
            };
            const end = {
                x: primitive.origin.x + primitive.vector.x * edge.endParameter,
                y: primitive.origin.y + primitive.vector.y * edge.endParameter,
            };
            return `${first ? (0, TikzFormatter_1.formatPoint)(start, precision) : ""} -- ${(0, TikzFormatter_1.formatPoint)(end, precision)}`.trim();
        }
    }
    if (edge.edgeKind === "circle" && object?.type === "circle") {
        const circle = (0, geometry_1.getCircleGeometry)(object, context.scene.objects);
        return circle
            ? `${(0, TikzFormatter_1.formatPoint)(circle.center, precision)} circle (${(0, TikzFormatter_1.formatNumber)(circle.radius, precision)})`
            : null;
    }
    if (edge.edgeKind === "arc") {
        if (object?.type === "arc") {
            const geometry = (0, geometry_1.getArcGeometry)(object, context.scene.objects);
            if (!geometry) {
                return null;
            }
            const startAngle = edge.startParameter ?? geometry.startAngleDegrees;
            const endAngle = edge.endParameter ?? geometry.endAngleDegrees;
            const startRadians = (startAngle * Math.PI) / 180;
            const start = (0, TikzFormatter_1.formatPoint)({
                x: geometry.center.x + Math.cos(startRadians) * geometry.radius,
                y: geometry.center.y + Math.sin(startRadians) * geometry.radius,
            }, precision);
            return `${first ? start : ""} arc[start angle=${(0, TikzFormatter_1.formatNumber)(startAngle, precision)}, end angle=${(0, TikzFormatter_1.formatNumber)(endAngle, precision)}, radius=${(0, TikzFormatter_1.formatNumber)(geometry.radius, precision)}]`.trim();
        }
        if (object?.type === "circle" && edge.startParameter !== undefined && edge.endParameter !== undefined) {
            const circle = (0, geometry_1.getCircleGeometry)(object, context.scene.objects);
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
            return `${first ? (0, TikzFormatter_1.formatPoint)(startPoint, precision) : ""} arc[start angle=${(0, TikzFormatter_1.formatNumber)(startAngle, precision)}, end angle=${(0, TikzFormatter_1.formatNumber)(endAngle, precision)}, radius=${(0, TikzFormatter_1.formatNumber)(circle.radius, precision)}]`.trim();
        }
    }
    const startPointId = edge.direction === "reverse" ? edge.endPointId : edge.startPointId;
    const endPointId = edge.direction === "reverse" ? edge.startPointId : edge.endPointId;
    const startPoint = startPointId ? (0, geometry_1.getPointObject)(context.scene.objects, startPointId) : null;
    const point = endPointId ? (0, geometry_1.getPointObject)(context.scene.objects, endPointId) : null;
    if (!point || (first && !startPoint)) {
        return null;
    }
    return `${first && startPoint ? (0, TikzFormatter_1.formatPoint)(startPoint, precision) : ""} -- ${(0, TikzFormatter_1.formatPoint)(point, precision)}`.trim();
}
function pathForBoundaryRegion(object, context) {
    const loop = object.loops?.[0];
    if (!loop || loop.edges.length === 0) {
        return null;
    }
    if (loop.edges.length === 1 && loop.edges[0]?.edgeKind === "circle") {
        return edgeToTikz(loop.edges[0], context, true);
    }
    const parts = loop.edges.map((edge, index) => edgeToTikz(edge, context, index === 0));
    return parts.some((part) => part === null) ? null : `${parts.join(" ")} -- cycle`;
}
exports.RegionExporter = {
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
            const colorFor = (color) => context.colorRegistry.getColorName(color);
            const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
            const fillVisible = context.options.preserveStyle && hasVisibleFill(object);
            const strokeVisible = hasVisibleStroke(object);
            const options = (0, TikzFormatter_1.formatStyleOptions)({
                ...style,
                draw: strokeVisible ? style.draw : undefined,
                fill: fillVisible ? style.fill : undefined,
                fillOpacity: fillVisible ? style.fillOpacity : undefined,
            });
            const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
            const section = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;
            section.push(`${command}${options} ${path};`);
            return;
        }
        const names = object.boundaryPointIds
            .map((pointId) => context.nameRegistry.getPointName(pointId))
            .filter((name) => Boolean(name));
        if (names.length < 3) {
            context.warnings.push({
                code: "TIKZ_INVALID_REGION",
                message: "Region could not be exported because fewer than three boundary points are available.",
                objectId: object.id,
            });
            return;
        }
        const colorFor = (color) => context.colorRegistry.getColorName(color);
        const style = (0, TikzFormatter_1.styleToTikzParts)(object.style, context.options, colorFor);
        const fillVisible = context.options.preserveStyle && hasVisibleFill(object);
        const strokeVisible = hasVisibleStroke(object);
        const options = (0, TikzFormatter_1.formatStyleOptions)({
            ...style,
            draw: strokeVisible ? style.draw : undefined,
            fill: fillVisible ? style.fill : undefined,
            fillOpacity: fillVisible ? style.fillOpacity : undefined,
        });
        const command = fillVisible ? (strokeVisible ? "\\filldraw" : "\\fill") : "\\draw";
        const section = fillVisible ? context.scene.sections.fills : context.scene.sections.shapes;
        section.push(`${command}${options} ${names.map((name) => `(${name})`).join(" -- ")} -- cycle;`);
    },
    objectType: "region",
};
