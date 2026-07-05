import type {
  GeometryObject,
  GeometryObjectRecord,
  GeometryStyle,
  Point2D,
  PointObject,
} from "../geometry";
import type { TikzColorRegistry } from "./TikzColorRegistry";
import type { TikzNameRegistry } from "./TikzNameRegistry";
import type { TikzOptions } from "./TikzOptions";

export type TikzMode = "minimal" | "academic" | "colorful" | "olympiad";

export type TikzSectionName = "coordinates" | "shapes" | "points" | "labels";

export type TikzSceneSections = Record<TikzSectionName, string[]>;

export type TikzScene = {
  readonly objects: GeometryObjectRecord;
  readonly orderedObjects: readonly GeometryObject[];
  readonly points: readonly PointObject[];
  readonly sections: TikzSceneSections;
};

export type TikzExportContext = {
  readonly colorRegistry: TikzColorRegistry;
  readonly nameRegistry: TikzNameRegistry;
  readonly options: TikzOptions;
  readonly scene: TikzScene;
};

export type TikzObjectExporter<TObject extends GeometryObject = GeometryObject> = {
  readonly objectType: TObject["type"];
  readonly exportObject: (object: TObject, context: TikzExportContext) => void;
};

export type TikzStyleParts = {
  readonly draw?: string | undefined;
  readonly fill?: string | undefined;
  readonly lineWidth?: string | undefined;
  readonly strokeOpacity?: number | undefined;
  readonly fillOpacity?: number | undefined;
  readonly dash?: GeometryStyle["dash"] | undefined;
};

export type TikzGeneratedOutput = {
  readonly code: string;
  readonly metadata: {
    readonly generatedAt: number;
    readonly mode: TikzMode;
    readonly objectCount: number;
  };
};

export type TikzPointLike = Point2D;
