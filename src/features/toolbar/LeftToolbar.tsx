import {
  Circle,
  Compass,
  CornerUpRight,
  Minus,
  MousePointer2,
  Move,
  Pentagon,
  Ruler,
  Slash,
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

const primaryTools = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "move", label: "Move", icon: Move },
  { id: "point", label: "Point", icon: Compass },
  { id: "segment", label: "Segment", icon: Slash },
  { id: "line", label: "Line", icon: Minus },
  { id: "ray", label: "Ray", icon: CornerUpRight },
  { id: "vector", label: "Vector", icon: VectorSquare },
  { id: "circle", label: "Circle", icon: Circle },
  { id: "polygon", label: "Polygon", icon: Pentagon },
  { id: "angle", label: "Angle", icon: Ruler },
] satisfies readonly ToolbarItem[];

export function LeftToolbar() {
  const activeTool = useGeometryStore((state) => state.activeTool);

  return (
    <aside className="flex min-h-0 w-[72px] flex-col items-center gap-3 rounded-[24px] border border-white/8 bg-white/[0.045] py-3 shadow-[0_20px_60px_rgb(0_0_0/0.18)] backdrop-blur-panel">
      {primaryTools.slice(0, 2).map(({ id, label, icon: Icon }) => (
        <IconButton
          active={activeTool === id}
          key={label}
          label={label}
          onClick={() => toolManager.activateTool(id)}
          size="toolbar"
        >
          <Icon size={22} strokeWidth={2} />
        </IconButton>
      ))}
      <Divider className="w-8" />
      <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-2">
        {primaryTools.slice(2).map(({ id, label, icon: Icon }) => (
          <IconButton
            active={activeTool === id}
            key={label}
            label={label}
            onClick={() => toolManager.activateTool(id)}
            size="toolbar"
          >
            <Icon size={22} strokeWidth={2} />
          </IconButton>
        ))}
      </div>
    </aside>
  );
}
