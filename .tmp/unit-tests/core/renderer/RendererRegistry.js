"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geometryRendererRegistry = exports.RendererRegistry = void 0;
const AngleRenderer_1 = require("./AngleRenderer");
const ArcRenderer_1 = require("./ArcRenderer");
const CircleRenderer_1 = require("./CircleRenderer");
const ImageRenderer_1 = require("./ImageRenderer");
const LineRenderer_1 = require("./LineRenderer");
const MeasurementRenderer_1 = require("./MeasurementRenderer");
const PointRenderer_1 = require("./PointRenderer");
const PolygonRenderer_1 = require("./PolygonRenderer");
const RayRenderer_1 = require("./RayRenderer");
const RegionRenderer_1 = require("./RegionRenderer");
const SegmentRenderer_1 = require("./SegmentRenderer");
const TextRenderer_1 = require("./TextRenderer");
const VectorRenderer_1 = require("./VectorRenderer");
class RendererRegistry {
    renderers = {};
    register(renderer) {
        this.renderers[renderer.objectType] = renderer;
    }
    renderObject(object, context) {
        if (!object.visible) {
            return null;
        }
        return this.renderers[object.type]?.render(object, context) ?? null;
    }
}
exports.RendererRegistry = RendererRegistry;
exports.geometryRendererRegistry = new RendererRegistry();
exports.geometryRendererRegistry.register(PolygonRenderer_1.PolygonRenderer);
exports.geometryRendererRegistry.register(ImageRenderer_1.ImageRenderer);
exports.geometryRendererRegistry.register(RegionRenderer_1.RegionRenderer);
exports.geometryRendererRegistry.register(CircleRenderer_1.CircleRenderer);
exports.geometryRendererRegistry.register(ArcRenderer_1.ArcRenderer);
exports.geometryRendererRegistry.register(LineRenderer_1.LineRenderer);
exports.geometryRendererRegistry.register(RayRenderer_1.RayRenderer);
exports.geometryRendererRegistry.register(SegmentRenderer_1.SegmentRenderer);
exports.geometryRendererRegistry.register(VectorRenderer_1.VectorRenderer);
exports.geometryRendererRegistry.register(AngleRenderer_1.AngleRenderer);
exports.geometryRendererRegistry.register(PointRenderer_1.PointRenderer);
exports.geometryRendererRegistry.register(TextRenderer_1.TextRenderer);
exports.geometryRendererRegistry.register(MeasurementRenderer_1.MeasurementRenderer);
