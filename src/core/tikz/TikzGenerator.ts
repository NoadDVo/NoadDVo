import type { GeometryObject, GeometryObjectRecord } from "../geometry";
import { AngleExporter } from "./exporters/AngleExporter";
import { CircleExporter } from "./exporters/CircleExporter";
import { LineExporter } from "./exporters/LineExporter";
import { PointExporter } from "./exporters/PointExporter";
import { PolygonExporter } from "./exporters/PolygonExporter";
import { SegmentExporter } from "./exporters/SegmentExporter";
import { formatTikzDocument } from "./TikzFormatter";
import { getTikzOptions, type TikzOptions } from "./TikzOptions";
import { TikzColorRegistry } from "./TikzColorRegistry";
import { TikzNameRegistry } from "./TikzNameRegistry";
import { buildTikzScene } from "./TikzScene";
import type {
  TikzExportContext,
  TikzGeneratedOutput,
  TikzMode,
} from "./TikzTypes";

type ExportHandler = (object: GeometryObject, context: TikzExportContext) => void;

const exporters: Partial<Record<GeometryObject["type"], ExportHandler>> = {
  angle: (object, context) => {
    if (object.type === "angle") {
      AngleExporter.exportObject(object, context);
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
  segment: (object, context) => {
    if (object.type === "segment") {
      SegmentExporter.exportObject(object, context);
    }
  },
};

function registerCoordinateNames(context: TikzExportContext): void {
  context.scene.points.forEach((point, index) => {
    context.nameRegistry.registerPoint(point, index);
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
      return;
    }

    exporter(object, context);
  });
}

export function generateTikz(
  objects: GeometryObjectRecord,
  modeOrOptions: TikzMode | TikzOptions = "academic",
): TikzGeneratedOutput {
  const options =
    typeof modeOrOptions === "string" ? getTikzOptions(modeOrOptions) : modeOrOptions;
  const scene = buildTikzScene(objects);
  const context: TikzExportContext = {
    colorRegistry: new TikzColorRegistry(),
    nameRegistry: new TikzNameRegistry(),
    options,
    scene,
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
    metadata: {
      generatedAt: Date.now(),
      mode: options.mode,
      objectCount: scene.orderedObjects.length,
    },
  };
}
