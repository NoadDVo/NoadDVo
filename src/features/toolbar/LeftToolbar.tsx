import { useState, useRef, useEffect } from "react";
import {
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
  Type,
  Wifi,
  Slash,
  Gauge
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { toolManager } from "../../core/tools/ToolManager";
import type { GeometryToolId } from "../../core/geometry";
import { IconButton } from "../../ui/primitives";
import { clsx } from "clsx";

type ToolbarItem = {
  readonly id: GeometryToolId;
  readonly label: string;
  readonly icon: LucideIcon;
};

type ToolbarGroup = {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly items: readonly ToolbarItem[];
};

export const toolGroups = [
  {
    id: "action",
    label: "Thao tác",
    icon: MousePointer2,
    items: [
      { id: "select", label: "Select", icon: MousePointer2 },
      { id: "move", label: "Move", icon: Move },
    ],
  },
  {
    id: "point",
    label: "Điểm",
    icon: CircleDot,
    items: [
      { id: "point", label: "Point", icon: Dot },
      { id: "midpoint", label: "Midpoint", icon: GripHorizontal },
      { id: "intersection", label: "Intersection", icon: Combine },
    ],
  },
  {
    id: "line",
    label: "Đường thẳng",
    icon: Slash,
    items: [
      { id: "line", label: "Line", icon: GitCommit },
      { id: "segment", label: "Segment", icon: Minus },
      { id: "ray", label: "Ray", icon: ArrowUpRight },
      { id: "vector", label: "Vector", icon: MoveRight },
      { id: "parallel", label: "Parallel Line", icon: Equal },
      { id: "perpendicular", label: "Perpendicular Line", icon: Plus },
      { id: "perpendicular-bisector", label: "Perpendicular Bisector", icon: Diameter },
      { id: "angle-bisector", label: "Angle Bisector", icon: Scissors },
    ],
  },
  {
    id: "shape",
    label: "Hình tròn & Đa giác",
    icon: Circle,
    items: [
      { id: "polygon", label: "Polygon", icon: Pentagon },
      { id: "circle", label: "Circle", icon: Circle },
      { id: "circumcircle", label: "Circumcircle", icon: CircleDashed },
      { id: "incircle", label: "Incircle", icon: CircleDot },
    ],
  },
  {
    id: "conic",
    label: "Đường conic",
    icon: Orbit,
    items: [
      { id: "ellipse", label: "Ellipse", icon: Orbit },
      { id: "hyperbola", label: "Hyperbola", icon: Wifi },
      { id: "polynomial", label: "Polynomial", icon: Spline },
    ],
  },
  {
    id: "transform",
    label: "Phép biến hình",
    icon: FlipHorizontal,
    items: [
      { id: "reflect-line", label: "Reflect about Line", icon: FlipHorizontal },
      { id: "reflect-point", label: "Reflect about Point", icon: Target },
      { id: "rotate-point", label: "Rotate around Point", icon: RotateCcw },
      { id: "translate-vector", label: "Translate by Vector", icon: ArrowRight },
      { id: "dilate-point", label: "Dilate from Point", icon: Maximize },
    ],
  },
  {
    id: "measure",
    label: "Đo lường & Tiện ích",
    icon: Gauge,
    items: [
      { id: "angle", label: "Angle", icon: DraftingCompass },
      { id: "distance", label: "Distance", icon: MoveDiagonal },
      { id: "area", label: "Area", icon: Square },
      { id: "text", label: "Text", icon: Type },
      { id: "image", label: "Image", icon: Image },
      { id: "slider", label: "Slider", icon: SlidersHorizontal },
      { id: "trim", label: "Trim", icon: Eraser },
      { id: "fill", label: "Fill", icon: PaintBucket },
    ],
  },
] satisfies readonly ToolbarGroup[];

export function getVisibleToolbarItems(): readonly ToolbarItem[] {
  return toolGroups.flatMap((group): readonly ToolbarItem[] => group.items);
}

export function LeftToolbar() {
  const activeTool = useGeometryStore((state) => state.activeTool);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActiveGroupId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <aside
      ref={toolbarRef}
      className={clsx(
        "fixed left-5 top-[76px] pointer-events-auto inline-flex flex-col w-[52px] z-50 items-center py-3",
        appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] shadow-brutal" : "",
        appTheme === "theme2" ? "rounded-xl border border-zinc-800/60 bg-[#18191E]/90 backdrop-blur-md shadow-2xl" : ""
      )}
    >
      <div className="flex flex-col items-center gap-1.5 px-1.5">
        {toolGroups.map((group) => {
          const isGroupActive = activeGroupId === group.id;
          const hasActiveTool = group.items.some(item => item.id === activeTool);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className="relative w-full">
              <button
                className={clsx(
                  "relative flex size-10 items-center justify-center transition-all duration-150 ease-out",
                  appTheme === "theme1" ? "rounded-none border-[3px] border-black" : "",
                  appTheme === "theme1" && hasActiveTool ? "bg-[#F17A3C] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5" : "",
                  appTheme === "theme1" && !hasActiveTool ? "bg-[#F4EFE6] text-black hover:bg-[#F4D04C] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "",
                  appTheme === "theme1" && isGroupActive && !hasActiveTool && "bg-[#F4D04C] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-0.5 -translate-y-0.5",
                  
                  appTheme === "theme2" ? "rounded-md border border-transparent" : "",
                  appTheme === "theme2" && hasActiveTool ? "bg-[#1A252C] text-[#00F5FF] border border-[#00F5FF]/40 shadow-[0_0_12px_rgba(0,245,255,0.15)]" : "",
                  appTheme === "theme2" && !hasActiveTool ? "bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200" : "",
                  appTheme === "theme2" && isGroupActive && !hasActiveTool && "bg-zinc-800/50 text-zinc-200"
                )}
                onClick={() => setActiveGroupId(isGroupActive ? null : group.id)}
                aria-label={group.label}
              >
                <GroupIcon size={24} strokeWidth={hasActiveTool ? 3 : 2.5} />
                
                <div className="absolute bottom-1 right-1 size-0 border-b-[4px] border-r-[4px] border-b-current border-r-transparent border-t-transparent border-l-transparent rotate-90 opacity-60" />
              </button>

              {isGroupActive && (
                <div className={clsx(
                  "absolute left-full top-0 ml-4 z-50 flex flex-row items-center gap-2 p-2",
                  appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] shadow-brutal" : "",
                  appTheme === "theme2" ? "rounded-lg border border-zinc-800/60 bg-[#18191E] shadow-2xl" : ""
                )}>
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <IconButton
                      active={activeTool === id}
                      className="size-10 border-transparent"
                      key={id}
                      label={label}
                      onClick={() => {
                        toolManager.activateTool(id);
                        setActiveGroupId(null);
                      }}
                      size="sm"
                    >
                      <Icon size={18} strokeWidth={2} />
                    </IconButton>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
