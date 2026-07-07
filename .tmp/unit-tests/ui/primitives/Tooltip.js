"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = Tooltip;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const OverlayPortal_1 = require("../overlay/OverlayPortal");
function Tooltip({ label, children }) {
    const anchorRef = (0, react_1.useRef)(null);
    const [open, setOpen] = (0, react_1.useState)(false);
    const [style, setStyle] = (0, react_1.useState)(null);
    (0, react_1.useLayoutEffect)(() => {
        if (!open) {
            setStyle(null);
            return undefined;
        }
        const updatePosition = () => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (!rect) {
                return;
            }
            setStyle({
                left: rect.left + rect.width / 2,
                position: "fixed",
                top: rect.bottom + 8,
                transform: "translateX(-50%)",
                zIndex: 2147483647,
            });
        };
        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [open]);
    return ((0, jsx_runtime_1.jsxs)("span", { className: "inline-flex", onBlur: () => setOpen(false), onFocus: () => setOpen(true), onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false), ref: anchorRef, children: [children, open && style && ((0, jsx_runtime_1.jsx)(OverlayPortal_1.FixedOverlay, { className: "pointer-events-none whitespace-nowrap rounded-[12px] border border-arctic-border/10 bg-arctic-surface/95 px-2.5 py-1.5 text-[11px] font-medium text-arctic-text shadow-[0_10px_30px_rgb(0_0_0/0.28)] backdrop-blur-sm", style: style, children: label }))] }));
}
