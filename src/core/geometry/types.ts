import type { Viewport } from "./viewport";

export type Point2D = {
  readonly x: number;
  readonly y: number;
};

export type ScreenPoint = {
  readonly x: number;
  readonly y: number;
};

export type Vector2D = {
  readonly x: number;
  readonly y: number;
};

export type BoundingBox = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

export type GeometryObjectType =
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "vector"
  | "circle"
  | "arc"
  | "polygon"
  | "angle"
  | "text"
  | "image"
  | "region"
  | "measurement";

export type GeometryToolId =
  | "select"
  | "move"
  | "point"
  | "segment"
  | "line"
  | "ray"
  | "vector"
  | "circle"
  | "polygon"
  | "angle"
  | "text"
  | "trim"
  | "fill"
  | "measure"
  | "midpoint"
  | "intersection"
  | "parallel"
  | "perpendicular"
  | "perpendicular-bisector"
  | "angle-bisector"
  | "median"
  | "altitude"
  | "circumcircle"
  | "incircle";

export type DashStyle = "solid" | "dashed" | "dotted";

export type TextMode =
  | "plain"
  | "math"
  | "latex"
  | "coordinate-label"
  | "object-label"
  | "measurement-label";

export type TextAlignment = "left" | "center" | "right";

export type MeasurementType =
  | "segment-length"
  | "polygon-perimeter"
  | "polygon-area"
  | "circle-radius"
  | "circle-diameter"
  | "circle-circumference"
  | "circle-area"
  | "arc-length"
  | "region-area"
  | "angle-value"
  | "point-distance"
  | "coordinate-display";

export type LabelPosition =
  | "above"
  | "below"
  | "left"
  | "right"
  | "above-left"
  | "above-right"
  | "below-left"
  | "below-right";

export type GeometryStyle = {
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly strokeOpacity: number;
  readonly fill: string;
  readonly fillOpacity: number;
  readonly dash: DashStyle;
  readonly pointSize: number;
  readonly labelVisible: boolean;
  readonly labelPosition: LabelPosition;
  readonly labelSize: number;
};

export const DEFAULT_GEOMETRY_STYLE: GeometryStyle = {
  stroke: "#0b0f14",
  strokeWidth: 2,
  strokeOpacity: 1,
  fill: "transparent",
  fillOpacity: 0,
  dash: "solid",
  pointSize: 5,
  labelVisible: true,
  labelPosition: "above-right",
  labelSize: 12,
};

export type BaseGeometryObject = {
  readonly id: string;
  readonly type: GeometryObjectType;
  readonly name?: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly layerId?: string;
  readonly style: GeometryStyle;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly dependencies: readonly string[];
  readonly dependents: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
};

export type ConstructionDefinition =
  | {
      readonly type: "midpoint";
      readonly pointAId: string;
      readonly pointBId: string;
    }
  | {
      readonly type: "intersection";
      readonly sourceAId: string;
      readonly sourceBId: string;
      readonly index: number;
    }
  | {
      readonly type: "parallel-line-point";
      readonly pointId: string;
      readonly lineId: string;
    }
  | {
      readonly type: "perpendicular-line-point";
      readonly pointId: string;
      readonly lineId: string;
    }
  | {
      readonly type: "perpendicular-bisector-point";
      readonly pointAId: string;
      readonly pointBId: string;
    }
  | {
      readonly type: "angle-bisector-point";
      readonly pointAId: string;
      readonly vertexPointId: string;
      readonly pointCId: string;
    }
  | {
      readonly type: "projection-point";
      readonly pointId: string;
      readonly linePointAId: string;
      readonly linePointBId: string;
    }
  | {
      readonly type: "incenter";
      readonly pointAId: string;
      readonly pointBId: string;
      readonly pointCId: string;
    }
  | {
      readonly type: "inradius-point";
      readonly centerPointId: string;
      readonly sidePointAId: string;
      readonly sidePointBId: string;
    };

export type PointObject = BaseGeometryObject & {
  readonly type: "point";
  readonly x: number;
  readonly y: number;
  readonly pointKind: "free" | "derived";
  readonly construction?: ConstructionDefinition;
};

export type SegmentObject = BaseGeometryObject & {
  readonly type: "segment";
  readonly startPointId: string;
  readonly endPointId: string;
};

export type LineObject = BaseGeometryObject & {
  readonly type: "line";
  readonly pointAId: string;
  readonly pointBId: string;
};

export type RayObject = BaseGeometryObject & {
  readonly type: "ray";
  readonly startPointId: string;
  readonly throughPointId: string;
};

export type VectorObject = BaseGeometryObject & {
  readonly type: "vector";
  readonly startPointId: string;
  readonly endPointId: string;
};

export type CircleObject =
  | (BaseGeometryObject & {
      readonly type: "circle";
      readonly circleKind: "center-radius";
      readonly centerPointId: string;
      readonly radius: number;
    })
  | (BaseGeometryObject & {
      readonly type: "circle";
      readonly circleKind: "center-point";
      readonly centerPointId: string;
      readonly radiusPointId: string;
    })
  | (BaseGeometryObject & {
      readonly type: "circle";
      readonly circleKind: "three-points";
      readonly pointAId: string;
      readonly pointBId: string;
      readonly pointCId: string;
    });

export type PolygonObject = BaseGeometryObject & {
  readonly type: "polygon";
  readonly pointIds: readonly string[];
  readonly closed: true;
};

export type ArcObject = BaseGeometryObject & {
  readonly type: "arc";
  readonly centerPointId: string;
  readonly startPointId: string;
  readonly endPointId: string;
  readonly direction: "clockwise" | "counterclockwise";
};

export type AngleObject = BaseGeometryObject & {
  readonly type: "angle";
  readonly pointAId: string;
  readonly vertexPointId: string;
  readonly pointCId: string;
  readonly radius: number;
  readonly label?: string;
  readonly showRightAngleMarker: boolean;
};

export type TextObject = BaseGeometryObject & {
  readonly type: "text";
  readonly x: number;
  readonly y: number;
  readonly content: string;
  readonly textMode: TextMode;
};

export type ImageObject = BaseGeometryObject & {
  readonly type: "image";
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly src: string;
  readonly mimeType: string;
  readonly opacity: number;
  readonly preserveAspectRatio: boolean;
};

export type BoundaryEdgeKind =
  | "segment"
  | "line"
  | "ray"
  | "circle"
  | "arc"
  | "polygon-edge";

export type BoundaryEdge = {
  readonly objectId: string;
  readonly edgeKind: BoundaryEdgeKind;
  readonly direction: "forward" | "reverse";
  readonly sourcePrimitiveId?: string;
  readonly startPointId?: string;
  readonly endPointId?: string;
  readonly startParameter?: number;
  readonly endParameter?: number;
};

export type BoundaryLoop = {
  readonly edges: readonly BoundaryEdge[];
  readonly closed: boolean;
};

export type RegionObject = BaseGeometryObject & {
  readonly type: "region";
  readonly regionKind?: "polygon" | "boundary";
  readonly boundaryPointIds: readonly string[];
  readonly loops?: readonly BoundaryLoop[];
};

export type MeasurementObject = BaseGeometryObject & {
  readonly type: "measurement";
  readonly measurementType: MeasurementType;
  readonly targetObjectId: string;
  readonly labelPosition: LabelPosition;
  readonly precision?: number;
};

export type GeometryObject =
  | PointObject
  | SegmentObject
  | LineObject
  | RayObject
  | VectorObject
  | CircleObject
  | ArcObject
  | PolygonObject
  | AngleObject
  | TextObject
  | ImageObject
  | RegionObject
  | MeasurementObject;

export type GeometryObjectRecord = Readonly<Record<string, GeometryObject>>;

export type GeometryScene = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly activeTool: GeometryToolId;
  readonly viewport: Viewport;
};

export type GeometryError = {
  readonly code: string;
  readonly message: string;
  readonly objectId?: string;
  readonly severity: "info" | "warning" | "error";
};

export type ValidationResult =
  | { readonly valid: true }
  | { readonly valid: false; readonly error: GeometryError };
