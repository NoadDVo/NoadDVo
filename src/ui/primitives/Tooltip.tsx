import type { ReactNode } from "react";

type TooltipProps = {
  readonly label: string;
  readonly children: ReactNode;
};

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-50 -translate-x-1/2 whitespace-nowrap rounded-[12px] border border-white/10 bg-[#13212c]/95 px-2.5 py-1.5 text-[11px] font-medium text-arctic-text opacity-0 shadow-[0_10px_30px_rgb(0_0_0/0.28)] backdrop-blur-sm transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}
