"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OverlayPortal = OverlayPortal;
exports.FixedOverlay = FixedOverlay;
exports.AnchoredOverlay = AnchoredOverlay;
exports.clampOverlayPosition = clampOverlayPosition;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const OVERLAY_ROOT_ID = "ndv-overlay-root";
const VIEWPORT_PADDING = 10;
function getOverlayRoot() {
    if (typeof document === "undefined") {
        return null;
    }
    const existingRoot = document.getElementById(OVERLAY_ROOT_ID);
    if (existingRoot) {
        return existingRoot;
    }
    const root = document.createElement("div");
    root.id = OVERLAY_ROOT_ID;
    root.style.position = "relative";
    root.style.zIndex = "2147483647";
    document.body.appendChild(root);
    return root;
}
function OverlayPortal({ children }) {
    const root = getOverlayRoot();
    return root ? (0, react_dom_1.createPortal)(children, root) : null;
}
function FixedOverlay({ children, className, style }) {
    return ((0, jsx_runtime_1.jsx)(OverlayPortal, { children: (0, jsx_runtime_1.jsx)("div", { className: className, style: style, children: children }) }));
}
function AnchoredOverlay({ align = "right", anchorRef, children, open, width, }) {
    const [style, setStyle] = (0, react_1.useState)(null);
    (0, react_1.useLayoutEffect)(() => {
        if (!open) {
            setStyle(null);
            return undefined;
        }
        const updatePosition = () => {
            const anchor = anchorRef.current;
            if (!anchor) {
                return;
            }
            const rect = anchor.getBoundingClientRect();
            const left = align === "right"
                ? rect.right - width
                : rect.left;
            const top = Math.min(window.innerHeight - VIEWPORT_PADDING, rect.bottom + 8);
            setStyle({
                left: Math.min(window.innerWidth - width - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, left)),
                maxHeight: window.innerHeight - top - VIEWPORT_PADDING,
                overflowY: "auto",
                position: "fixed",
                top,
                width,
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
    }, [align, anchorRef, open, width]);
    if (!open || !style) {
        return null;
    }
    return (0, jsx_runtime_1.jsx)(FixedOverlay, { style: style, children: children });
}
function clampOverlayPosition(x, y, width, height) {
    return {
        left: Math.min(window.innerWidth - width - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, x)),
        position: "fixed",
        top: Math.min(window.innerHeight - height - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, y)),
        zIndex: 2147483647,
    };
}
