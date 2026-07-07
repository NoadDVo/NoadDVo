import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

import { Tooltip } from "./Tooltip";

type IconButtonSize = "sm" | "md" | "lg" | "toolbar";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly label: string;
  readonly children: ReactNode;
  readonly size?: IconButtonSize;
  readonly active?: boolean;
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "size-9",
  md: "size-10",
  lg: "size-11",
  toolbar: "size-12",
};

export function IconButton({
  label,
  children,
  size = "md",
  active = false,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={clsx(
          "inline-flex shrink-0 items-center justify-center rounded-[14px] border border-arctic-border/8 bg-arctic-surface/65 text-arctic-muted transition duration-150 ease-out hover:border-arctic-ice/30 hover:bg-arctic-ice/10 hover:text-arctic-text hover:shadow-[0_0_22px_rgb(168_216_255/0.14)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arctic-ice active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
          sizeClasses[size],
          active &&
            "border-arctic-ice/70 bg-arctic-ice/24 text-arctic-text shadow-[0_0_0_1px_rgb(168_216_255/0.22),0_0_28px_rgb(168_216_255/0.28),inset_0_1px_0_rgb(255_255_255/0.08)]",
          className,
        )}
        type={type}
        {...props}
      >
        {children}
      </button>
    </Tooltip>
  );
}
