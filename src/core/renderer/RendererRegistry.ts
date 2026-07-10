import type { ReactNode } from "react";

import type {
  GeometryObject,
  GeometryObjectRecord,
  GeometryObjectType,
} from "../geometry";
import type { Viewport } from "../geometry/viewport";
import { AngleRenderer } from "./AngleRenderer";
import { ArcRenderer } from "./ArcRenderer";
import { CircleRenderer } from "./CircleRenderer";
import { ImageRenderer } from "./ImageRenderer";
import { LineRenderer } from "./LineRenderer";
import { PointRenderer } from "./PointRenderer";
import { PolygonRenderer } from "./PolygonRenderer";
import { DistanceRenderer } from "./DistanceRenderer";
import { AreaRenderer } from "./AreaRenderer";
import { RayRenderer } from "./RayRenderer";
import { RegionRenderer } from "./RegionRenderer";
import { SegmentRenderer } from "./SegmentRenderer";
import { TextRenderer } from "./TextRenderer";
import { VectorRenderer } from "./VectorRenderer";
import { EllipseRenderer } from "./EllipseRenderer";
import { HyperbolaRenderer } from "./HyperbolaRenderer";
import { PolynomialRenderer } from "./PolynomialRenderer";
import { SliderRenderer } from "./SliderRenderer";

export type GeometryRendererContext = {
  readonly viewport: Viewport;
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly hoveredObjectId: string | null;
};

export type GeometryRenderer<TObject extends GeometryObject = GeometryObject> = {
  readonly objectType: TObject["type"];
  readonly render: (
    object: TObject,
    context: GeometryRendererContext,
  ) => ReactNode;
};

type RendererMap = Partial<Record<GeometryObjectType, GeometryRenderer>>;

export class RendererRegistry {
  private readonly renderers: RendererMap = {};

  register<TObject extends GeometryObject>(
    renderer: GeometryRenderer<TObject>,
  ): void {
    this.renderers[renderer.objectType] = renderer as unknown as GeometryRenderer;
  }

  renderObject(
    object: GeometryObject,
    context: GeometryRendererContext,
  ): ReactNode {
    if (!object.visible) {
      return null;
    }

    return this.renderers[object.type]?.render(object, context) ?? null;
  }
}

export const geometryRendererRegistry = new RendererRegistry();

[
  PointRenderer,
  SegmentRenderer,
  LineRenderer,
  RayRenderer,
  VectorRenderer,
  CircleRenderer,
  ArcRenderer,
  PolygonRenderer,
  AngleRenderer,
  TextRenderer,
  ImageRenderer,
  RegionRenderer,
  DistanceRenderer,
  AreaRenderer,
  EllipseRenderer,
  HyperbolaRenderer,
  PolynomialRenderer,
  SliderRenderer,
].forEach((renderer: any) => {
  geometryRendererRegistry.register(renderer);
});
