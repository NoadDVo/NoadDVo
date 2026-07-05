import {
  Circle,
  Compass,
  CornerUpRight,
  Minus,
  MousePointer2,
  Move,
  PaintBucket,
  Pentagon,
  Ruler,
  Slash,
  Type,
  VectorSquare,
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

type FutureToolbarItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly disabled: true;
};

type ToolbarGroup = {
  readonly id: string;
  readonly items: readonly (ToolbarItem | FutureToolbarItem)[];
};

const toolGroups = [
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
  { id: "ray", label: "Ray", icon: CornerUpRight, disabled: true },
  { id: "vector", label: "Vector", icon: VectorSquare, disabled: true },
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
  { id: "parallel", label: "Parallel", icon: Minus },
  { id: "perpendicular", label: "Perpendicular", icon: Slash },
    ],
  },
  {
    id: "annotation",
    items: [
      { id: "text", label: "Text", icon: Type, disabled: true },
      { id: "fill", label: "Fill", icon: PaintBucket, disabled: true },
      { id: "measure", label: "Measure", icon: Ruler, disabled: true },
    ],
  },
] satisfies readonly ToolbarGroup[];

function isActiveGroup(group: ToolbarGroup, activeTool: GeometryToolId): boolean {
  return group.items.some((item) => "disabled" in item ? false : item.id === activeTool);
}

export function LeftToolbar() {
  const activeTool = useGeometryStore((state) => state.activeTool);

  return (
    <aside className="flex min-h-0 w-16 flex-col items-center gap-2 rounded-[20px] border border-white/8 bg-white/[0.045] py-2 shadow-[0_20px_60px_rgb(0_0_0/0.18)] backdrop-blur-panel">
      <div className="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-1.5">
        {toolGroups.map((group, groupIndex) => (
          <div
            className="contents"
            key={group.id}
          >
            {groupIndex > 0 && <Divider className="w-7" />}
            <div
              className={
                isActiveGroup(group, activeTool)
                  ? "flex flex-col items-center gap-2 rounded-[16px] bg-arctic-ice/8 p-1 shadow-[inset_0_0_0_1px_rgb(168_216_255/0.14)]"
                  : "flex flex-col items-center gap-2 p-1"
              }
            >
              {group.items.map(({ label, icon: Icon, ...item }) => (
                <IconButton
                  active={!("disabled" in item) && activeTool === item.id}
                  disabled={"disabled" in item}
                  key={label}
                  label={"disabled" in item ? `${label} - Coming soon` : label}
                  onClick={
                    "disabled" in item
                      ? undefined
                      : () => toolManager.activateTool(item.id)
                  }
                  size="toolbar"
                >
                  <Icon size={22} strokeWidth={2} />
                </IconButton>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
