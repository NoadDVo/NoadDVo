import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { useUiStore } from "../../app/store/uiStore";

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
  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <section
      className={clsx(
        "flex min-h-0 flex-col overflow-hidden",
        appTheme === "theme1" ? "rounded-none border-[3px] border-black bg-[#F4EFE6] shadow-none" : "",
        appTheme === "theme2" ? "rounded-md border border-zinc-800/60 bg-[#18191E] shadow-none" : "",
        className,
      )}
      {...props}
    >
      {(title || eyebrow || actions) && (
        <header className={clsx(
          "flex min-h-14 shrink-0 items-center justify-between gap-4 px-5",
          appTheme === "theme1" ? "border-b-[3px] border-black bg-[#F17A3C]" : "",
          appTheme === "theme2" ? "border-b border-zinc-800/60 bg-[#18191E]" : ""
        )}>
          <div className="min-w-0">
            {eyebrow && (
              <p className={clsx(
                "text-[10px] font-bold uppercase tracking-[0.18em]",
                appTheme === "theme1" ? "text-black" : "text-zinc-500"
              )}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className={clsx(
                "truncate text-sm font-bold uppercase tracking-[0.12em]",
                appTheme === "theme1" ? "text-black" : "text-zinc-200"
              )}>
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
