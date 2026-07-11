"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IconButton = IconButton;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = require("clsx");
const Tooltip_1 = require("./Tooltip");
const sizeClasses = {
    sm: "size-9",
    md: "size-10",
    lg: "size-11",
    toolbar: "size-12",
};
function IconButton({ label, children, size = "md", active = false, className, type = "button", ...props }) {
    return ((0, jsx_runtime_1.jsx)(Tooltip_1.Tooltip, { label: label, children: (0, jsx_runtime_1.jsx)("button", { "aria-label": label, className: (0, clsx_1.clsx)("inline-flex shrink-0 items-center justify-center rounded-[14px] border border-arctic-border/8 bg-arctic-surface/65 text-arctic-muted transition duration-150 ease-out hover:border-arctic-ice/30 hover:bg-arctic-ice/10 hover:text-arctic-text hover:shadow-[0_0_22px_rgb(168_216_255/0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arctic-ice active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40", sizeClasses[size], active &&
                "border-arctic-ice/70 bg-arctic-ice/24 text-arctic-text shadow-[0_0_0_1px_rgb(168_216_255/0.22),0_0_28px_rgb(168_216_255/0.28),inset_0_1px_0_rgb(255_255_255/0.08)]", className), type: type, ...props, children: children }) }));
}
