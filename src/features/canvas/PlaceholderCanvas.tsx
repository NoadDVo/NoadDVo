import { Maximize2 } from "lucide-react";

import { IconButton } from "../../ui/primitives";

export function PlaceholderCanvas() {
  return (
    <section className="relative min-h-0 overflow-hidden rounded-[28px] border border-white/8 bg-arctic-canvas shadow-[0_20px_60px_rgb(0_0_0/0.26)]">
      <div className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.045)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgb(111_169_216/0.1)_1px,transparent_1px),linear-gradient(90deg,rgb(111_169_216/0.1)_1px,transparent_1px)] bg-[size:160px_160px]" />
      <div className="absolute left-1/2 top-0 h-full w-px bg-[#6fa9d8]/25" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-[#6fa9d8]/25" />
      <div className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-arctic-ice/50 bg-arctic-canvas shadow-[0_0_18px_rgb(168_216_255/0.35)]" />

      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 1000 640"
      >
        <path
          d="M312 420 L604 174 L728 432 Z"
          fill="rgb(168 216 255 / 0.1)"
          stroke="rgb(221 238 255 / 0.7)"
          strokeWidth="2"
        />
        <path
          d="M604 174 L520 421"
          stroke="rgb(180 220 255 / 0.38)"
          strokeDasharray="10 10"
          strokeWidth="2"
        />
        <circle cx="312" cy="420" fill="white" r="7" />
        <circle cx="604" cy="174" fill="white" r="7" />
        <circle cx="728" cy="432" fill="white" r="7" />
        <circle
          cx="520"
          cy="421"
          fill="rgb(168 216 255 / 0.35)"
          r="5"
          stroke="rgb(168 216 255)"
          strokeWidth="2"
        />
      </svg>

      <div className="absolute right-4 top-4">
        <IconButton label="Fit View" size="sm">
          <Maximize2 size={16} strokeWidth={2} />
        </IconButton>
      </div>

      <div className="absolute bottom-4 left-4 rounded-[16px] border border-white/8 bg-[#101b24]/72 px-4 py-3 backdrop-blur-panel">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-arctic-ice/80">
          Workspace
        </p>
        <p className="mt-1 text-sm font-semibold text-arctic-text">
          NoadDVo Geometry Studio
        </p>
      </div>
    </section>
  );
}
