"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const clsx_1 = require("clsx");
const variantClasses = {
    primary: "border-arctic-ice/40 bg-arctic-ice/16 text-arctic-text shadow-[0_0_24px_rgb(168_216_255/0.16)] hover:bg-arctic-ice/22",
    secondary: "border-arctic-border/10 bg-arctic-surface/70 text-arctic-text hover:border-arctic-border/18 hover:bg-arctic-surface",
    ghost: "border-transparent bg-transparent text-arctic-muted hover:border-arctic-border/10 hover:bg-arctic-surface/55 hover:text-arctic-text",
    outline: "border-arctic-border/12 bg-transparent text-arctic-text hover:border-arctic-ice/35 hover:bg-arctic-ice/10",
};
const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
};
exports.Button = (0, react_1.forwardRef)(function Button({ children, icon, variant = "secondary", size = "md", active = false, className, type = "button", ...props }, ref) {
    return ((0, jsx_runtime_1.jsxs)("button", { className: (0, clsx_1.clsx)("inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border font-semibold uppercase tracking-[0.08em] transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arctic-ice active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40", variantClasses[variant], sizeClasses[size], active && "border-arctic-ice/60 bg-arctic-ice/18 text-arctic-text", className), ref: ref, type: type, ...props, children: [icon, (0, jsx_runtime_1.jsx)("span", { children: children })] }));
});
