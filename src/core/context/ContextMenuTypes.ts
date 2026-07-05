import type {
  GeometryObject,
  GeometryObjectRecord,
  GeometryObjectType,
  Point2D,
  ScreenPoint,
} from "../geometry";
import type { Viewport } from "../geometry/viewport";

export type ContextMenuTarget =
  | {
      readonly kind: "canvas";
      readonly screenPoint: ScreenPoint;
      readonly worldPoint: Point2D;
    }
  | {
      readonly kind: "object";
      readonly objectId: string;
      readonly objectType: GeometryObjectType;
      readonly screenPoint: ScreenPoint;
      readonly worldPoint: Point2D;
    };

export type ContextMenuViewportBounds = {
  readonly width: number;
  readonly height: number;
};

export type ContextMenuActionContext = {
  readonly objects: GeometryObjectRecord;
  readonly selectedObjectIds: readonly string[];
  readonly target: ContextMenuTarget;
  readonly viewport: Viewport;
};

export type ContextMenuAction = {
  readonly id: string;
  readonly icon: string;
  readonly targets: readonly ("canvas" | GeometryObjectType)[];
  readonly shortcut?: string;
  readonly execute: (context: ContextMenuActionContext) => void | Promise<void>;
  readonly getDetail?: (context: ContextMenuActionContext) => string | null;
  readonly getLabel?: (context: ContextMenuActionContext) => string;
  readonly isEnabled?: (context: ContextMenuActionContext) => boolean;
};

export type ContextMenuItem =
  | {
      readonly type: "action";
      readonly id: string;
      readonly actionId: string;
      readonly icon: string;
      readonly label: string;
      readonly disabled: boolean;
      readonly shortcut?: string;
      readonly detail?: string;
    }
  | {
      readonly type: "separator";
      readonly id: string;
    };

export type ContextMenuState = {
  readonly open: boolean;
  readonly items: readonly ContextMenuItem[];
  readonly position: ScreenPoint;
  readonly target: ContextMenuTarget | null;
};

export type ContextMenuObjectTarget = Extract<
  ContextMenuTarget,
  { readonly kind: "object" }
>;

export type ContextMenuObject = GeometryObject;
