import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { useUiStore } from "../../app/store/uiStore";

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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={clsx(
          "inline-flex shrink-0 items-center justify-center transition-colors duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
          appTheme === "theme1" ? "border-[3px] border-black text-black" : "",
          appTheme === "theme1" && active ? "bg-[#F4D04C] text-black" : "",
          appTheme === "theme1" && !active ? "bg-transparent hover:bg-[#F17A3C] hover:text-black" : "",

          appTheme === "theme2" ? "border border-zinc-800/60 rounded-md text-zinc-400" : "",
          appTheme === "theme2" && active ? "bg-[#1A252C] text-[#00F5FF] border-[#00F5FF]/40 shadow-[0_0_12px_rgba(0,245,255,0.15)]" : "",
          appTheme === "theme2" && !active ? "bg-[#18191E] hover:bg-[#2C2D35] hover:text-zinc-200" : "",

          sizeClasses[size],
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
