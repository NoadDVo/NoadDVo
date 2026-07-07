"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Panel = Panel;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = require("clsx");
function Panel({ title, eyebrow, actions, children, className, ...props }) {
    return ((0, jsx_runtime_1.jsxs)("section", { className: (0, clsx_1.clsx)("flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-arctic-border/8 bg-arctic-surface/82 shadow-[0_20px_60px_rgb(0_0_0/0.24)] backdrop-blur-panel", className), ...props, children: [(title || eyebrow || actions) && ((0, jsx_runtime_1.jsxs)("header", { className: "flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-arctic-border/8 px-5", children: [(0, jsx_runtime_1.jsxs)("div", { className: "min-w-0", children: [eyebrow && ((0, jsx_runtime_1.jsx)("p", { className: "text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-ice/80", children: eyebrow })), title && ((0, jsx_runtime_1.jsx)("h2", { className: "truncate text-sm font-bold uppercase tracking-[0.12em] text-arctic-text", children: title }))] }), actions && (0, jsx_runtime_1.jsx)("div", { className: "flex items-center gap-2", children: actions })] })), (0, jsx_runtime_1.jsx)("div", { className: "min-h-0 flex-1 overflow-hidden", children: children })] }));
}
