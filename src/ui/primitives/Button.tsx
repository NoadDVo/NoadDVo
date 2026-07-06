import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly children: ReactNode;
  readonly icon?: ReactNode;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly active?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-arctic-ice/40 bg-arctic-ice/16 text-arctic-text shadow-[0_0_24px_rgb(168_216_255/0.16)] hover:bg-arctic-ice/22",
  secondary:
    "border-arctic-border/10 bg-arctic-surface/70 text-arctic-text hover:border-arctic-border/18 hover:bg-arctic-surface",
  ghost:
    "border-transparent bg-transparent text-arctic-muted hover:border-arctic-border/10 hover:bg-arctic-surface/55 hover:text-arctic-text",
  outline:
    "border-arctic-border/12 bg-transparent text-arctic-text hover:border-arctic-ice/35 hover:bg-arctic-ice/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
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
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] border font-semibold uppercase tracking-[0.08em] transition duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-arctic-ice active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        active && "border-arctic-ice/60 bg-arctic-ice/18 text-arctic-text",
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
