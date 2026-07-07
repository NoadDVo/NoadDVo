import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

type PanelProps = HTMLAttributes<HTMLElement> & {
  readonly title?: string;
  readonly eyebrow?: string;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
};

export function Panel({
  title,
  eyebrow,
  actions,
  children,
  className,
  ...props
}: PanelProps) {
  return (
    <section
      className={clsx(
        "flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-arctic-border/8 bg-arctic-surface/82 shadow-[0_20px_60px_rgb(0_0_0/0.24)] backdrop-blur-panel",
        className,
      )}
      {...props}
    >
      {(title || eyebrow || actions) && (
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-arctic-border/8 px-5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-ice/80">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="truncate text-sm font-bold uppercase tracking-[0.12em] text-arctic-text">
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
