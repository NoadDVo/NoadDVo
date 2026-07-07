import {
  Circle,
  Compass,
  CornerUpRight,
  Diameter,
  Minus,
  MousePointer2,
  Move,
  PaintBucket,
  Pentagon,
  Ruler,
  Slash,
  Type,
  VectorSquare,
  Triangle,
  Eraser,
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
  { id: "point", label: "Point", icon: Compass },
  { id: "segment", label: "Segment", icon: Slash },
  { id: "line", label: "Line", icon: Minus },
  { id: "ray", label: "Ray", icon: CornerUpRight },
  { id: "vector", label: "Vector", icon: VectorSquare },
    ],
  },
  {
    id: "shape",
    items: [
  { id: "circle", label: "Circle", icon: Circle },
  { id: "polygon", label: "Polygon", icon: Pentagon },
  { id: "angle", label: "Angle", icon: Ruler },
    ],
  },
  {
    id: "construction",
    items: [
  { id: "midpoint", label: "Midpoint", icon: Compass },
  { id: "intersection", label: "Intersection", icon: Ruler },
  { id: "parallel", label: "Parallel Line", icon: Minus },
  { id: "perpendicular", label: "Perpendicular Line", icon: Slash },
  { id: "perpendicular-bisector", label: "Perpendicular Bisector", icon: Diameter },
  { id: "angle-bisector", label: "Angle Bisector", icon: Ruler },
  { id: "median", label: "Median", icon: Triangle },
  { id: "altitude", label: "Altitude", icon: Slash },
  { id: "circumcircle", label: "Circumcircle", icon: Circle },
  { id: "incircle", label: "Incircle", icon: Compass },
    ],
  },
  {
    id: "annotation",
    items: [
      { id: "text", label: "Text", icon: Type },
      { id: "trim", label: "Trim", icon: Eraser },
      { id: "fill", label: "Fill", icon: PaintBucket },
      { id: "measure", label: "Measure", icon: Ruler },
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
