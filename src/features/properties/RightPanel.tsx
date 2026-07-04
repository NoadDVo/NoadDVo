import { Lock, SlidersHorizontal } from "lucide-react";

import { Divider, IconButton, Panel } from "../../ui/primitives";

const appearanceRows = [
  ["Stroke", "#DDEEFF"],
  ["Width", "2 px"],
  ["Opacity", "100%"],
  ["Dash", "Solid"],
] as const;

export function RightPanel() {
  return (
    <Panel
      actions={
        <>
          <IconButton label="Inspector Options" size="sm">
            <SlidersHorizontal size={16} strokeWidth={2} />
          </IconButton>
          <IconButton label="Lock Panel" size="sm">
            <Lock size={16} strokeWidth={2} />
          </IconButton>
        </>
      }
      className="min-h-0 overflow-hidden max-lg:hidden"
      eyebrow="Inspector"
      title="Properties"
    >
      <div className="flex h-full min-h-0 flex-col px-5 py-4">
        <div className="rounded-[16px] border border-white/8 bg-white/[0.035] px-4 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-arctic-muted">
            Selection
          </p>
          <p className="mt-2 text-sm font-semibold text-arctic-text">
            No object selected
          </p>
        </div>

        <Divider className="my-5" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-arctic-text">
            Appearance
          </h3>
          <div className="mt-4 space-y-3">
            {appearanceRows.map(([label, value]) => (
              <div className="flex h-10 items-center justify-between rounded-[12px] border border-white/8 bg-white/[0.035] px-3" key={label}>
                <span className="text-xs font-medium text-arctic-muted">
                  {label}
                </span>
                <span className="font-mono text-xs text-arctic-text">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <Divider className="my-5" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-arctic-text">
            Geometry
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[12px] border border-white/8 bg-white/[0.035] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-arctic-muted">
                X
              </p>
              <p className="mt-1 font-mono text-xs text-arctic-text">0.000</p>
            </div>
            <div className="rounded-[12px] border border-white/8 bg-white/[0.035] px-3 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-arctic-muted">
                Y
              </p>
              <p className="mt-1 font-mono text-xs text-arctic-text">0.000</p>
            </div>
          </div>
        </section>
      </div>
    </Panel>
  );
}
