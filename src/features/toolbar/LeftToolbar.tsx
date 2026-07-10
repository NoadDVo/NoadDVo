import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Circle,
  CircleDashed,
  CircleDot,
  Combine,
  Diameter,
  Dot,
  DraftingCompass,
  Equal,
  Eraser,
  FlipHorizontal,
  GitCommit,
  GripHorizontal,
  Image,
  Maximize,
  Minus,
  MousePointer2,
  Move,
  MoveDiagonal,
  MoveRight,
  Orbit,
  PaintBucket,
  Pentagon,
  Plus,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  Spline,
  Square,
  Target,
  Triangle,
  Type,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { toolManager } from "../../core/tools/ToolManager";
import type { GeometryToolId } from "../../core/geometry";
import { Divider, IconButton } from "../../ui/primitives";

type ToolbarItem = {
  readonly id: GeometryToolId;
  readonly label: string;
  readonly icon: LucideIcon;
};

type ToolbarGroup = {
  readonly id: string;
  readonly items: readonly ToolbarItem[];
};

export const toolGroups = [
  {
    id: "selection",
    items: [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "move", label: "Move", icon: Move },
    ],
  },
  {
    id: "linear",
    items: [
  { id: "point", label: "Point", icon: Dot },
  { id: "segment", label: "Segment", icon: Minus },
  { id: "line", label: "Line", icon: GitCommit },
  { id: "ray", label: "Ray", icon: ArrowUpRight },
  { id: "vector", label: "Vector", icon: MoveRight },
    ],
  },
  {
    id: "shape",
    items: [
  { id: "circle", label: "Circle", icon: Circle },
  { id: "polygon", label: "Polygon", icon: Pentagon },
  { id: "angle", label: "Angle", icon: DraftingCompass },
    ],
  },
  {
    id: "construction",
    items: [
  { id: "midpoint", label: "Midpoint", icon: GripHorizontal },
  { id: "intersection", label: "Intersection", icon: Combine },
  { id: "parallel", label: "Parallel Line", icon: Equal },
  { id: "perpendicular", label: "Perpendicular Line", icon: Plus },
  { id: "perpendicular-bisector", label: "Perpendicular Bisector", icon: Diameter },
  { id: "angle-bisector", label: "Angle Bisector", icon: Scissors },
  { id: "median", label: "Median", icon: Triangle },
  { id: "altitude", label: "Altitude", icon: ArrowDownToLine },
  { id: "circumcircle", label: "Circumcircle", icon: CircleDashed },
  { id: "incircle", label: "Incircle", icon: CircleDot },
    ],
  },
  {
    id: "conic",
    items: [
      { id: "ellipse", label: "Ellipse", icon: Orbit },
      { id: "hyperbola", label: "Hyperbola", icon: Wifi },
      { id: "polynomial", label: "Polynomial", icon: Spline },
    ],
  },
  {
    id: "annotation",
    items: [
      { id: "text", label: "Text", icon: Type },
      { id: "image", label: "Image", icon: Image },
      { id: "distance", label: "Distance", icon: MoveDiagonal },
      { id: "area", label: "Area", icon: Square },
      { id: "slider", label: "Slider", icon: SlidersHorizontal },
      { id: "trim", label: "Trim", icon: Eraser },
      { id: "fill", label: "Fill", icon: PaintBucket },
    ],
  },
  {
    id: "transformation",
    items: [
      { id: "reflect-line", label: "Reflect about Line", icon: FlipHorizontal },
      { id: "reflect-point", label: "Reflect about Point", icon: Target },
      { id: "rotate-point", label: "Rotate around Point", icon: RotateCcw },
      { id: "translate-vector", label: "Translate by Vector", icon: ArrowRight },
      { id: "dilate-point", label: "Dilate from Point", icon: Maximize },
    ],
  },
] satisfies readonly ToolbarGroup[];

export function getVisibleToolbarItems(): readonly ToolbarItem[] {
  return toolGroups.flatMap((group): readonly ToolbarItem[] => group.items);
}

function isActiveGroup(group: ToolbarGroup, activeTool: GeometryToolId): boolean {
  return group.items.some((item) => item.id === activeTool);
}

export function LeftToolbar() {
  const activeTool = useGeometryStore((state) => state.activeTool);

  return (
    <aside className="flex min-h-0 w-24 flex-col items-center gap-2 rounded-[20px] border border-arctic-border/8 bg-arctic-surface/72 py-2 shadow-[0_20px_60px_rgb(0_0_0/0.18)] backdrop-blur-panel">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
        {toolGroups.map((group, groupIndex) => (
          <div
            className="w-full"
            key={group.id}
          >
            {groupIndex > 0 && <Divider className="w-7" />}
            <div
              className={
                isActiveGroup(group, activeTool)
                  ? "grid grid-cols-2 gap-1.5 rounded-[16px] border border-arctic-ice/16 bg-arctic-ice/8 p-1.5 shadow-[inset_0_0_0_1px_rgb(168_216_255/0.12),0_0_24px_rgb(168_216_255/0.08)]"
                  : "grid grid-cols-2 gap-1.5 p-1.5"
              }
            >
              {group.items.map(({ id, label, icon: Icon }) => (
                <IconButton
                  active={activeTool === id}
                  className="size-9 rounded-[12px]"
                  key={label}
                  label={label}
                  onClick={() => toolManager.activateTool(id)}
                  size="sm"
                >
                  <Icon size={19} strokeWidth={2.1} />
                </IconButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
