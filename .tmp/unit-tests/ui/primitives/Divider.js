"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Divider = Divider;
const jsx_runtime_1 = require("react/jsx-runtime");
const clsx_1 = require("clsx");
function Divider({ orientation = "horizontal", className, }) {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, clsx_1.clsx)("bg-arctic-border/8", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className), role: "separator" }));
}
