import type { GeometryObject, GeometryObjectRecord } from "../geometry";
import { AngleExporter } from "./exporters/AngleExporter";
import { ArcExporter } from "./exporters/ArcExporter";
import { CircleExporter } from "./exporters/CircleExporter";
import { DistanceExporter } from "./exporters/DistanceExporter";
import { AreaExporter } from "./exporters/AreaExporter";
import { LineExporter } from "./exporters/LineExporter";
import { PointExporter } from "./exporters/PointExporter";
import { PolygonExporter } from "./exporters/PolygonExporter";
import { RayExporter } from "./exporters/RayExporter";
import { RegionExporter } from "./exporters/RegionExporter";
import { SegmentExporter } from "./exporters/SegmentExporter";
import { TextExporter } from "./exporters/TextExporter";
import { VectorExporter } from "./exporters/VectorExporter";
import { EllipseExporter } from "./exporters/EllipseExporter";
import { HyperbolaExporter } from "./exporters/HyperbolaExporter";
import { PolynomialExporter } from "./exporters/PolynomialExporter";
import { SliderExporter } from "./exporters/SliderExporter";
import { formatTikzDocument } from "./TikzFormatter";
import { getTikzOptions, type TikzOptions } from "./TikzOptions";
import { TikzColorRegistry } from "./TikzColorRegistry";
import { TikzNameRegistry } from "./TikzNameRegistry";
import { buildTikzScene } from "./TikzScene";
import type {
  TikzExportContext,
  TikzGeneratedOutput,
  TikzMode,
  TikzWarning,
} from "./TikzTypes";

type ExportHandler = (object: GeometryObject, context: TikzExportContext) => void;

const exporters: Partial<Record<GeometryObject["type"], ExportHandler>> = {
  angle: (object, context) => {
    if (object.type === "angle") {
      AngleExporter.exportObject(object, context);
    }
  },
  arc: (object, context) => {
    if (object.type === "arc") {
      ArcExporter.exportObject(object, context);
    }
  },
  circle: (object, context) => {
    if (object.type === "circle") {
      CircleExporter.exportObject(object, context);
    }
  },
  line: (object, context) => {
    if (object.type === "line") {
      LineExporter.exportObject(object, context);
    }
  },
  polygon: (object, context) => {
    if (object.type === "polygon") {
      PolygonExporter.exportObject(object, context);
    }
  },
  ray: (object, context) => {
    if (object.type === "ray") {
      RayExporter.exportObject(object, context);
    }
  },
  region: (object, context) => {
    if (object.type === "region") {
      RegionExporter.exportObject(object, context);
    }
  },
  segment: (object, context) => {
    if (object.type === "segment") {
      SegmentExporter.exportObject(object, context);
    }
  },
  vector: (object, context) => {
    if (object.type === "vector") {
      VectorExporter.exportObject(object, context);
    }
  },
  distance: (object, context) => {
    if (object.type === "distance") {
      DistanceExporter.exportObject(object, context);
    }
  },
  area: (object, context) => {
    if (object.type === "area") {
      AreaExporter.exportObject(object, context);
    }
  },
  text: (object, context) => {
    if (object.type === "text") {
      TextExporter.exportObject(object, context);
    }
  },
  ellipse: (object, context) => {
    if (object.type === "ellipse") {
      EllipseExporter.exportObject(object as any, context);
    }
  },
  hyperbola: (object, context) => {
    if (object.type === "hyperbola") {
      HyperbolaExporter.exportObject(object as any, context);
    }
  },
  polynomial: (object, context) => {
    if (object.type === "polynomial") {
      PolynomialExporter.exportObject(object as any, context);
    }
  },
  slider: (object, context) => {
    if (object.type === "slider") {
      SliderExporter.exportObject(object as any, context);
    }
  },
};

function registerCoordinateNames(context: TikzExportContext): void {
  context.scene.points.forEach((point, index) => {
    context.nameRegistry.registerPoint(point, index, context.options.usePointNames);
  });
}

function exportCoordinates(context: TikzExportContext): void {
  context.scene.points.forEach((point) => {
    PointExporter.exportObject(point, context);
  });
}

function exportShapes(context: TikzExportContext): void {
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
    } catch (error) {
      context.warnings.push({
        code: "TIKZ_EXPORT_FAILED",
        message:
          error instanceof Error
            ? error.message
            : `Object "${object.id}" could not be exported.`,
        objectId: object.id,
      });
    }
  });
}

function resolveTikzOptions(modeOrOptions: TikzMode | TikzOptions): TikzOptions {
  if (typeof modeOrOptions === "string") {
    return getTikzOptions(modeOrOptions);
  }

  return {
    ...getTikzOptions(modeOrOptions.mode),
    ...modeOrOptions,
  };
}

export function generateTikz(
  objects: GeometryObjectRecord,
  modeOrOptions: TikzMode | TikzOptions = "academic",
): TikzGeneratedOutput {
  const options = resolveTikzOptions(modeOrOptions);
  const scene = buildTikzScene(objects, options);
  const warnings: TikzWarning[] = [];
  const context: TikzExportContext = {
    colorRegistry: new TikzColorRegistry(),
    nameRegistry: new TikzNameRegistry(),
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
  const code = formatTikzDocument({
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
