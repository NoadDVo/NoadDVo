import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { FixedOverlay } from "../overlay/OverlayPortal";

type TooltipProps = {
  readonly label: string;
  readonly children: ReactNode;
};

export function Tooltip({ label, children }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
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

  return (
    <span
      className="inline-flex"
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={anchorRef}
    >
      {children}
      {open && style && (
        <FixedOverlay
          className="pointer-events-none whitespace-nowrap rounded-[12px] border border-arctic-border/10 bg-arctic-surface/95 px-2.5 py-1.5 text-[11px] font-medium text-arctic-text shadow-[0_10px_30px_rgb(0_0_0/0.28)] backdrop-blur-sm"
          style={style}
        >
          {label}
        </FixedOverlay>
      )}
    </span>
  );
}
