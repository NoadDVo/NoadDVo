"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTikz = generateTikz;
const AngleExporter_1 = require("./exporters/AngleExporter");
const ArcExporter_1 = require("./exporters/ArcExporter");
const CircleExporter_1 = require("./exporters/CircleExporter");
const LineExporter_1 = require("./exporters/LineExporter");
const MeasurementExporter_1 = require("./exporters/MeasurementExporter");
const PointExporter_1 = require("./exporters/PointExporter");
const PolygonExporter_1 = require("./exporters/PolygonExporter");
const RayExporter_1 = require("./exporters/RayExporter");
const RegionExporter_1 = require("./exporters/RegionExporter");
const SegmentExporter_1 = require("./exporters/SegmentExporter");
const TextExporter_1 = require("./exporters/TextExporter");
const VectorExporter_1 = require("./exporters/VectorExporter");
const TikzFormatter_1 = require("./TikzFormatter");
const TikzOptions_1 = require("./TikzOptions");
const TikzColorRegistry_1 = require("./TikzColorRegistry");
const TikzNameRegistry_1 = require("./TikzNameRegistry");
const TikzScene_1 = require("./TikzScene");
const exporters = {
    angle: (object, context) => {
        if (object.type === "angle") {
            AngleExporter_1.AngleExporter.exportObject(object, context);
        }
    },
    arc: (object, context) => {
        if (object.type === "arc") {
            ArcExporter_1.ArcExporter.exportObject(object, context);
        }
    },
    circle: (object, context) => {
        if (object.type === "circle") {
            CircleExporter_1.CircleExporter.exportObject(object, context);
        }
    },
    line: (object, context) => {
        if (object.type === "line") {
            LineExporter_1.LineExporter.exportObject(object, context);
        }
    },
    measurement: (object, context) => {
        if (object.type === "measurement") {
            MeasurementExporter_1.MeasurementExporter.exportObject(object, context);
        }
    },
    polygon: (object, context) => {
        if (object.type === "polygon") {
            PolygonExporter_1.PolygonExporter.exportObject(object, context);
        }
    },
    ray: (object, context) => {
        if (object.type === "ray") {
            RayExporter_1.RayExporter.exportObject(object, context);
        }
    },
    region: (object, context) => {
        if (object.type === "region") {
            RegionExporter_1.RegionExporter.exportObject(object, context);
        }
    },
    segment: (object, context) => {
        if (object.type === "segment") {
            SegmentExporter_1.SegmentExporter.exportObject(object, context);
        }
    },
    vector: (object, context) => {
        if (object.type === "vector") {
            VectorExporter_1.VectorExporter.exportObject(object, context);
        }
    },
    text: (object, context) => {
        if (object.type === "text") {
            TextExporter_1.TextExporter.exportObject(object, context);
        }
    },
};
function registerCoordinateNames(context) {
    context.scene.points.forEach((point, index) => {
        context.nameRegistry.registerPoint(point, index, context.options.usePointNames);
    });
}
function exportCoordinates(context) {
    context.scene.points.forEach((point) => {
        PointExporter_1.PointExporter.exportObject(point, context);
    });
}
function exportShapes(context) {
    context.scene.orderedObjects.forEach((object) => {
        if (object.type === "point") {
            return;
        }
        const exporter = exporters[object.type];
        if (!exporter) {
            context.warnings.push({
                code: "TIKZ_UNSUPPORTED_OBJECT",
                message: `No TikZ exporter is registered for object type "${object.type}".`,
                objectId: object.id,
            });
            return;
        }
        try {
            exporter(object, context);
        }
        catch (error) {
            context.warnings.push({
                code: "TIKZ_EXPORT_FAILED",
                message: error instanceof Error
                    ? error.message
                    : `Object "${object.id}" could not be exported.`,
                objectId: object.id,
            });
        }
    });
}
function resolveTikzOptions(modeOrOptions) {
    if (typeof modeOrOptions === "string") {
        return (0, TikzOptions_1.getTikzOptions)(modeOrOptions);
    }
    return {
        ...(0, TikzOptions_1.getTikzOptions)(modeOrOptions.mode),
        ...modeOrOptions,
    };
}
function generateTikz(objects, modeOrOptions = "academic") {
    const options = resolveTikzOptions(modeOrOptions);
    const scene = (0, TikzScene_1.buildTikzScene)(objects, options);
    const warnings = [];
    const context = {
        colorRegistry: new TikzColorRegistry_1.TikzColorRegistry(),
        nameRegistry: new TikzNameRegistry_1.TikzNameRegistry(),
        options,
        scene,
        warnings,
    };
    registerCoordinateNames(context);
    exportCoordinates(context);
    exportShapes(context);
    const colorDefinitions = options.includeColorDefinitions
        ? context.colorRegistry.getDefinitions()
        : [];
    const code = (0, TikzFormatter_1.formatTikzDocument)({
        colorDefinitions,
        options,
        sections: scene.sections,
    });
    return {
        code,
        errors: [],
        metadata: {
            generatedAt: Date.now(),
            mode: options.mode,
            objectCount: scene.orderedObjects.length,
        },
        warnings,
    };
}
