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
  | "distance"
  | "area"
  | "ellipse"
  | "hyperbola"
  | "polynomial"
  | "slider"
  | "locus"
  | "sector"
  | "elliptical-arc";

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
  | "image"
  | "trim"
  | "fill"
  | "distance"
  | "area"
  | "slider"
  | "pan"
  | "midpoint"
  | "intersection"
  | "parallel"
  | "perpendicular"
  | "perpendicular-bisector"
  | "angle-bisector"
  | "median"
  | "altitude"
  | "circumcircle"
  | "incircle"
  | "reflect-line"
  | "reflect-point"
  | "rotate-point"
  | "translate-vector"
  | "dilate-point"
  | "regular-polygon"
  | "three-point-circle"
  | "three-point-arc"
  | "semicircle"
  | "circular-sector"
  | "compass"
  | "ellipse"
  | "hyperbola"
  | "polynomial"
  | "slider"
  | "locus"
  | "pan"
  | "distance"
  | "area"
  | "elliptical-arc";

export type DashStyle = "solid" | "dashed" | "dotted";

export type TextMode =
  | "plain"
  | "math"
  | "latex"
  | "coordinate-label"
  | "object-label"
  | "measurement-label";

export type TextAlignment = "left" | "center" | "right";


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
      readonly segmentId?: string;
    }
  | {
      readonly type: "angle-bisector-point";
      readonly pointAId: string;
      readonly vertexPointId: string;
      readonly pointCId: string;
      readonly sourceSegmentAId?: string;
      readonly sourceSegmentBId?: string;
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
    }
  | {
      readonly type: "reflect-line-point";
      readonly pointId: string;
      readonly lineId: string;
    }
  | {
      readonly type: "reflect-point-point";
      readonly pointId: string;
      readonly centerPointId: string;
    }
  | {
      readonly type: "rotate-point";
      readonly pointId: string;
      readonly centerPointId: string;
      readonly angle: number | string;
    }
  | {
      readonly type: "translate-vector-point";
      readonly pointId: string;
      readonly vectorId: string;
    }
  | {
      readonly type: "dilate-point";
      readonly pointId: string;
      readonly centerPointId: string;
      readonly factor: number | string;
    }
  | {
      readonly type: "angle-bisector-endpoint";
      readonly pointAId: string;
      readonly pointBId: string;
      readonly pointCId: string;
      readonly limitObjectId: string;
    }
  | {
      readonly type: "perpendicular-bisector-endpoint";
      readonly pointAId: string;
      readonly pointBId: string;
      readonly limitObjectId: string;
    }
  | {
      readonly type: "special-line-projection";
      readonly vertexId: string;
      readonly segmentId: string;
    }
  | {
      readonly type: "special-line-midpoint";
      readonly segmentId: string;
    }
  | {
      readonly type: "special-line-bisector";
      readonly vertexId: string;
      readonly segmentId: string;
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
  readonly specialLineKind?: "altitude" | "median" | "angle-bisector" | "perpendicular-bisector-3step";
};

export type LineObject = BaseGeometryObject & {
  readonly type: "line";
  readonly pointAId: string;
  readonly pointBId: string;
  readonly lineKind?:    | "parallel"
    | "perpendicular"
    | "perpendicular-bisector"
    | "angle-bisector"
    | "perpendicular-bisector-3step"
    | "angle-bisector-4step";
  readonly specialLineKind?: "altitude" | "median" | "angle-bisector" | "perpendicular-bisector-3step";
  readonly sourceLineId?: string;
  readonly anchorPointId?: string;
  readonly sourceSegmentId?: string;
  readonly sourceSegmentAId?: string;
  readonly sourceSegmentBId?: string;
  readonly vertexPointId?: string;
  readonly anglePointAId?: string;
  readonly anglePointBId?: string;
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

export type EllipticalArcObject = BaseGeometryObject & {
  readonly type: "elliptical-arc";
  readonly centerPointId: string;
  readonly startPointId: string;
  readonly endPointId: string;
  readonly ry: number;
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

export type EllipseObject = BaseGeometryObject & {
  readonly type: "ellipse";
  readonly focusAId: string;
  readonly focusBId: string;
  readonly pointOnEllipseId: string;
};

export type HyperbolaObject = BaseGeometryObject & {
  readonly type: "hyperbola";
  readonly focusAId: string;
  readonly focusBId: string;
  readonly pointOnHyperbolaId: string;
};

export type PolynomialObject = BaseGeometryObject & {
  readonly type: "polynomial";
  readonly pointIds: readonly string[];
};

export type SliderObject = BaseGeometryObject & {
  readonly type: "slider";
  readonly x: number;
  readonly y: number;
  readonly widthPx: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly variableName: string;
};

export type BoundaryEdgeKind =
  | "segment"
  | "line"
  | "ray"
  | "circle"
  | "arc"
  | "polygon-edge"
  | "ellipse"
  | "hyperbola"
  | "polynomial";

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

export type DistanceObject = BaseGeometryObject & {
  readonly type: "distance";
  readonly distanceKind: "two-points" | "segment";
  readonly pointAId?: string;
  readonly pointBId?: string;
  readonly segmentId?: string;
  readonly labelPosition: LabelPosition;
  readonly precision?: number;
};

export type AreaObject = BaseGeometryObject & {
  readonly type: "area";
  readonly polygonId: string;
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
  | EllipticalArcObject
  | PolygonObject
  | AngleObject
  | TextObject
  | ImageObject
  | RegionObject
  | DistanceObject
  | AreaObject
  | EllipseObject
  | HyperbolaObject
  | PolynomialObject
  | SliderObject;

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
