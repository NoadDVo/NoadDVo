import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const OVERLAY_ROOT_ID = "ndv-overlay-root";
const VIEWPORT_PADDING = 10;

type OverlayPortalProps = {
  readonly children: ReactNode;
};

type AnchoredOverlayProps = {
  readonly align?: "left" | "right";
  readonly anchorRef: RefObject<HTMLElement | null>;
  readonly children: ReactNode;
  readonly open: boolean;
  readonly width: number;
};

type FixedOverlayProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly style?: CSSProperties;
};

function getOverlayRoot(): HTMLElement | null {
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

export function OverlayPortal({ children }: OverlayPortalProps) {
  const root = getOverlayRoot();

  return root ? createPortal(children, root) : null;
}

export function FixedOverlay({ children, className, style }: FixedOverlayProps) {
  return (
    <OverlayPortal>
      <div className={className} style={style}>
        {children}
      </div>
    </OverlayPortal>
  );
}

export function AnchoredOverlay({
  align = "right",
  anchorRef,
  children,
  open,
  width,
}: AnchoredOverlayProps) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
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
      const left =
        align === "right"
          ? rect.right - width
          : rect.left;

      const top = Math.min(window.innerHeight - VIEWPORT_PADDING, rect.bottom + 8);

      setStyle({
        left: Math.min(
          window.innerWidth - width - VIEWPORT_PADDING,
          Math.max(VIEWPORT_PADDING, left),
        ),
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

  return <FixedOverlay style={style}>{children}</FixedOverlay>;
}

export function clampOverlayPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): CSSProperties {
  return {
    left: Math.min(window.innerWidth - width - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, x)),
    position: "fixed",
    top: Math.min(window.innerHeight - height - VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, y)),
    zIndex: 2147483647,
  };
}
