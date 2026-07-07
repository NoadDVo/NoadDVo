"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolGroups = void 0;
exports.getVisibleToolbarItems = getVisibleToolbarItems;
exports.LeftToolbar = LeftToolbar;
const jsx_runtime_1 = require("react/jsx-runtime");
const lucide_react_1 = require("lucide-react");
const geometryStore_1 = require("../../app/store/geometryStore");
const ToolManager_1 = require("../../core/tools/ToolManager");
const primitives_1 = require("../../ui/primitives");
exports.toolGroups = [
    {
        id: "selection",
        items: [
            { id: "select", label: "Select", icon: lucide_react_1.MousePointer2 },
            { id: "move", label: "Move", icon: lucide_react_1.Move },
        ],
    },
    {
        id: "linear",
        items: [
            { id: "point", label: "Point", icon: lucide_react_1.Compass },
            { id: "segment", label: "Segment", icon: lucide_react_1.Slash },
            { id: "line", label: "Line", icon: lucide_react_1.Minus },
            { id: "ray", label: "Ray", icon: lucide_react_1.CornerUpRight },
            { id: "vector", label: "Vector", icon: lucide_react_1.VectorSquare },
        ],
    },
    {
        id: "shape",
        items: [
            { id: "circle", label: "Circle", icon: lucide_react_1.Circle },
            { id: "polygon", label: "Polygon", icon: lucide_react_1.Pentagon },
            { id: "angle", label: "Angle", icon: lucide_react_1.Ruler },
        ],
    },
    {
        id: "construction",
        items: [
            { id: "midpoint", label: "Midpoint", icon: lucide_react_1.Compass },
            { id: "intersection", label: "Intersection", icon: lucide_react_1.Ruler },
            { id: "parallel", label: "Parallel Line", icon: lucide_react_1.Minus },
            { id: "perpendicular", label: "Perpendicular Line", icon: lucide_react_1.Slash },
            { id: "perpendicular-bisector", label: "Perpendicular Bisector", icon: lucide_react_1.Diameter },
            { id: "angle-bisector", label: "Angle Bisector", icon: lucide_react_1.Ruler },
            { id: "median", label: "Median", icon: lucide_react_1.Triangle },
            { id: "altitude", label: "Altitude", icon: lucide_react_1.Slash },
            { id: "circumcircle", label: "Circumcircle", icon: lucide_react_1.Circle },
            { id: "incircle", label: "Incircle", icon: lucide_react_1.Compass },
        ],
    },
    {
        id: "annotation",
        items: [
            { id: "text", label: "Text", icon: lucide_react_1.Type },
            { id: "trim", label: "Trim", icon: lucide_react_1.Eraser },
            { id: "fill", label: "Fill", icon: lucide_react_1.PaintBucket },
            { id: "measure", label: "Measure", icon: lucide_react_1.Ruler },
        ],
    },
];
function getVisibleToolbarItems() {
    return exports.toolGroups.flatMap((group) => group.items);
}
function isActiveGroup(group, activeTool) {
    return group.items.some((item) => item.id === activeTool);
}
function LeftToolbar() {
    const activeTool = (0, geometryStore_1.useGeometryStore)((state) => state.activeTool);
    return ((0, jsx_runtime_1.jsx)("aside", { className: "flex min-h-0 w-24 flex-col items-center gap-2 rounded-[20px] border border-arctic-border/8 bg-arctic-surface/72 py-2 shadow-[0_20px_60px_rgb(0_0_0/0.18)] backdrop-blur-panel", children: (0, jsx_runtime_1.jsx)("div", { className: "flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-2", children: exports.toolGroups.map((group, groupIndex) => ((0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [groupIndex > 0 && (0, jsx_runtime_1.jsx)(primitives_1.Divider, { className: "w-7" }), (0, jsx_runtime_1.jsx)("div", { className: isActiveGroup(group, activeTool)
                            ? "grid grid-cols-2 gap-1.5 rounded-[16px] border border-arctic-ice/16 bg-arctic-ice/8 p-1.5 shadow-[inset_0_0_0_1px_rgb(168_216_255/0.12),0_0_24px_rgb(168_216_255/0.08)]"
                            : "grid grid-cols-2 gap-1.5 p-1.5", children: group.items.map(({ id, label, icon: Icon }) => ((0, jsx_runtime_1.jsx)(primitives_1.IconButton, { active: activeTool === id, className: "size-9 rounded-[12px]", label: label, onClick: () => ToolManager_1.toolManager.activateTool(id), size: "sm", children: (0, jsx_runtime_1.jsx)(Icon, { size: 19, strokeWidth: 2.1 }) }, label))) })] }, group.id))) }) }));
}
