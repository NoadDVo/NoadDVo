import { Check, Clipboard, FileCode2, WrapText } from "lucide-react";

import { Button, IconButton, Panel } from "../../ui/primitives";

const placeholderTikz = String.raw`\begin{tikzpicture}[scale=1]

% Coordinates
\coordinate (A) at (0,0);
\coordinate (B) at (4,0);
\coordinate (C) at (1.5,3);

% Geometry
\draw (A) -- (B) -- (C) -- cycle;

% Points
\fill (A) circle (1.5pt);
\fill (B) circle (1.5pt);
\fill (C) circle (1.5pt);

\end{tikzpicture}`;

export function TikzPanel() {
  return (
    <Panel
      actions={
        <>
          <Button icon={<Clipboard size={15} strokeWidth={2} />} size="sm" variant="ghost">
            Copy
          </Button>
          <IconButton label="Wrap Document" size="sm">
            <WrapText size={16} strokeWidth={2} />
          </IconButton>
          <IconButton label="Export TEX" size="sm">
            <FileCode2 size={16} strokeWidth={2} />
          </IconButton>
        </>
      }
      className="min-h-0 overflow-hidden"
      eyebrow="Realtime"
      title="TikZ"
    >
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_32px]">
        <pre className="min-h-0 overflow-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-arctic-text/88">
          <code>{placeholderTikz}</code>
        </pre>
        <footer className="flex items-center justify-between border-t border-white/8 px-5 font-mono text-[11px] text-arctic-muted">
          <span>Lines 15</span>
          <span className="inline-flex items-center gap-2 text-arctic-ice">
            <Check size={14} strokeWidth={2} />
            Generated
          </span>
        </footer>
      </div>
    </Panel>
  );
}
