import type { ReactNode } from "react";

import type {
  GeometryObject,
  GeometryObjectRecord,
  GeometryObjectType,
} from "../geometry";
import type { Viewport } from "../geometry/viewport";
import { CircleRenderer } from "./CircleRenderer";
import { LineRenderer } from "./LineRenderer";
import { PointRenderer } from "./PointRenderer";
import { PolygonRenderer } from "./PolygonRenderer";
import { RayRenderer } from "./RayRenderer";
import { SegmentRenderer } from "./SegmentRenderer";
import { VectorRenderer } from "./VectorRenderer";

export type GeometryRendererContext = {
  readonly viewport: Viewport;
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
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

geometryRendererRegistry.register(PolygonRenderer);
geometryRendererRegistry.register(CircleRenderer);
geometryRendererRegistry.register(LineRenderer);
geometryRendererRegistry.register(RayRenderer);
geometryRendererRegistry.register(SegmentRenderer);
geometryRendererRegistry.register(VectorRenderer);
geometryRendererRegistry.register(PointRenderer);
