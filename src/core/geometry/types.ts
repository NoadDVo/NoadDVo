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
  | "polygon"
  | "angle";

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
  | "midpoint"
  | "intersection"
  | "parallel"
  | "perpendicular";

export type DashStyle = "solid" | "dashed" | "dotted";

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

export type AngleObject = BaseGeometryObject & {
  readonly type: "angle";
  readonly pointAId: string;
  readonly vertexPointId: string;
  readonly pointCId: string;
  readonly radius: number;
  readonly label?: string;
  readonly showRightAngleMarker: boolean;
};

export type GeometryObject =
  | PointObject
  | SegmentObject
  | LineObject
  | RayObject
  | VectorObject
  | CircleObject
  | PolygonObject
  | AngleObject;

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
