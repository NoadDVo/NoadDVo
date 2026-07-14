import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { useUiStore, type AppTheme } from "../../app/store/uiStore";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "topbar" | "panel-toggle";
type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly active?: boolean;
};

const variantClasses: Record<ButtonVariant, Record<AppTheme, string>> = {
  primary: {
    theme1: "border-[3px] border-black bg-[#F17A3C] text-black shadow-brutal-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgb(var(--color-shadow)/1)] active:translate-x-0 active:translate-y-0 active:shadow-none",
    theme2: "border border-zinc-800/60 bg-[#2C2D35] text-zinc-200 rounded-md hover:bg-[#3C3D45]",
  },
  secondary: {
    theme1: "border-[3px] border-black bg-[#F4EFE6] text-black hover:bg-[#F4D04C] hover:text-black",
    theme2: "border border-zinc-800/60 bg-[#18191E] text-zinc-200 rounded-md hover:bg-[#2C2D35]",
  },
  ghost: {
    theme1: "border-[3px] border-transparent bg-transparent text-black hover:border-black hover:bg-[#F4D04C] hover:text-black",
    theme2: "border border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 rounded-md",
  },
  outline: {
    theme1: "border-[3px] border-black bg-transparent text-black hover:bg-[#F17A3C] hover:text-black",
    theme2: "border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 rounded-md",
  },
  topbar: {
    theme1: "border-[3px] border-black bg-transparent text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F17A3C] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none",
    theme2: "border border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 rounded-md",
  },
  "panel-toggle": {
    theme1: "border-[2px] border-black bg-transparent text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-[#F17A3C] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none",
    theme2: "border border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 rounded-md",
  },
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-7 px-2.5 text-[10px] gap-1.5",
  sm: "h-8 px-3 text-xs gap-2",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  children,
  icon,
  variant = "secondary",
  size = "md",
  active = false,
  className,
  type = "button",
  ...props
}, ref) {
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <button
      aria-pressed={active}
      className={clsx(
        "inline-flex items-center justify-center font-semibold uppercase tracking-[0.08em] transition-all duration-150 ease-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        active && appTheme === "theme1" ? "!bg-[#F4D04C] !text-black !shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-0 translate-y-0" : "",
        active && appTheme === "theme2" ? "bg-[#2C2D35] text-white" : "",
        variantClasses[variant][appTheme],
        sizeClasses[size],
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
});
