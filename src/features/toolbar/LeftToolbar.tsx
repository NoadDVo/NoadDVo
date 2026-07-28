import { useState, useRef, useEffect } from "react";
import {
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
  Lasso,
  Maximize,
  Minus,
  MousePointer2,
  Move,
  Hand,
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
  Gauge,
  Compass,
  Ruler,
  Radius
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { useTranslation } from "../../lib/useTranslation";
import { toolManager } from "../../core/tools/ToolManager";
import type { GeometryToolId } from "../../core/geometry";
import { IconButton } from "../../ui/primitives";
import { clsx } from "clsx";

type ToolbarItem = {
  readonly id: GeometryToolId;
  readonly label: string;
  readonly labelKey: string;
  readonly icon: LucideIcon;
};

type ToolbarGroup = {
  readonly id: string;
  readonly label: string;
  readonly labelKey: string;
  readonly icon: LucideIcon;
  readonly items: readonly ToolbarItem[];
};

export const toolGroups = [
  {
    id: "action",
    label: "Actions",
    labelKey: "toolgroup.action",
    icon: MousePointer2,
    items: [
      { id: "select", label: "Select", labelKey: "tool.select", icon: MousePointer2 },
      { id: "pan", label: "Pan", labelKey: "tool.select", icon: Hand },
      { id: "move", label: "Move", labelKey: "tool.select", icon: Move },
      { id: "lasso", label: "Lasso", labelKey: "tool.select", icon: Lasso },
    ],
  },
  {
    id: "point",
    label: "Point",
    labelKey: "toolgroup.point",
    icon: CircleDot,
    items: [
      { id: "point", label: "Point", labelKey: "tool.point", icon: Dot },
      { id: "midpoint", label: "Midpoint", labelKey: "tool.midpoint", icon: GripHorizontal },
      { id: "intersection", label: "Intersection", labelKey: "tool.intersect", icon: Combine },
    ],
  },
  {
    id: "line",
    label: "Line",
    labelKey: "toolgroup.line",
    icon: Slash,
    items: [
      { id: "line", label: "Line", labelKey: "tool.line", icon: GitCommit },
      { id: "segment", label: "Segment", labelKey: "tool.segment", icon: Minus },
      { id: "ray", label: "Ray", labelKey: "tool.ray", icon: ArrowUpRight },
      { id: "vector", label: "Vector", labelKey: "tool.line", icon: MoveRight },
      { id: "parallel", label: "Parallel Line", labelKey: "tool.parallel", icon: Equal },
      { id: "perpendicular", label: "Perpendicular Line", labelKey: "tool.perpendicular", icon: Plus },
      { id: "perpendicular-bisector", label: "Perpendicular Bisector", labelKey: "tool.perpendicularBisector", icon: Diameter },
      { id: "angle-bisector", label: "Angle Bisector", labelKey: "tool.angleBisector", icon: Scissors },
    ],
  },
  {
    id: "shape",
    label: "Circle & Polygon",
    labelKey: "toolgroup.shape",
    icon: Circle,
    items: [
      { id: "polygon", label: "Polygon", labelKey: "tool.polygon", icon: Pentagon },
      { id: "circle", label: "Circle", labelKey: "tool.circle", icon: Circle },
      { id: "three-point-arc", label: "Arc", labelKey: "tool.arc", icon: Radius },
      { id: "elliptical-arc", label: "Elliptical Arc", labelKey: "tool.arc", icon: Radius },
      { id: "circumcircle", label: "Circumcircle", labelKey: "tool.circle", icon: CircleDashed },
      { id: "incircle", label: "Incircle", labelKey: "tool.circle", icon: CircleDot },
    ],
  },
  {
    id: "conic",
    label: "Conic",
    labelKey: "toolgroup.conic",
    icon: Orbit,
    items: [
      { id: "ellipse", label: "Ellipse", labelKey: "tool.circle", icon: Orbit },
      { id: "hyperbola", label: "Hyperbola", labelKey: "tool.line", icon: Wifi },
      { id: "polynomial", label: "Polynomial", labelKey: "tool.line", icon: Spline },
    ],
  },
  {
    id: "transform",
    label: "Transform",
    labelKey: "toolgroup.transform",
    icon: FlipHorizontal,
    items: [
      { id: "reflect-line", label: "Reflect about Line", labelKey: "tool.line", icon: FlipHorizontal },
      { id: "reflect-point", label: "Reflect about Point", labelKey: "tool.point", icon: Target },
      { id: "rotate-point", label: "Rotate around Point", labelKey: "tool.point", icon: RotateCcw },
      { id: "dilate-point", label: "Dilate from Point", labelKey: "tool.point", icon: Maximize },
    ],
  },
  {
    id: "measure",
    label: "Measure & Utilities",
    labelKey: "toolgroup.measure",
    icon: Gauge,
    items: [
      { id: "angle", label: "Angle", labelKey: "tool.angle", icon: DraftingCompass },
      { id: "angle-given-size", label: "Construct Angle (Given Size)", labelKey: "tool.angle", icon: Compass },
      { id: "point-by-distance", label: "Point By Distance", labelKey: "tool.point", icon: Ruler },
      { id: "distance", label: "Distance", labelKey: "tool.distance", icon: MoveDiagonal },
      { id: "area", label: "Area", labelKey: "tool.area", icon: Square },
      { id: "text", label: "Text", labelKey: "tool.text", icon: Type },
      { id: "image", label: "Image", labelKey: "tool.text", icon: Image },
      { id: "slider", label: "Slider", labelKey: "tool.slider", icon: SlidersHorizontal },
      { id: "trim", label: "Trim", labelKey: "tool.delete", icon: Eraser },
      { id: "fill", label: "Fill", labelKey: "tool.area", icon: PaintBucket },
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
  const { t } = useTranslation();

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
        "absolute left-4 top-4 pointer-events-auto inline-flex flex-col w-[52px] z-10 items-center py-3",
        appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] shadow-brutal" : "",
        appTheme === "theme2" ? "rounded-xl border border-zinc-800/60 bg-[#18191E]/90 backdrop-blur-md shadow-2xl" : ""
      )}
    >
      <div className="flex flex-col items-center gap-1.5 px-1.5">
        {toolGroups.map((group) => {
          const isGroupActive = activeGroupId === group.id;
          const hasActiveTool = group.items.some(item => item.id === activeTool);
          const GroupIcon = group.icon;
          const groupLabel = t(group.labelKey as Parameters<typeof t>[0]);

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
                aria-label={groupLabel}
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
                  {group.items.map(({ id, labelKey, icon: Icon }) => (
                    <IconButton
                      active={activeTool === id}
                      className="size-10 border-transparent"
                      key={id}
                      label={t(labelKey as Parameters<typeof t>[0])}
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
