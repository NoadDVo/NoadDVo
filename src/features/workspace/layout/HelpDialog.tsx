import { ExternalLink, X } from "lucide-react";

import { useUiStore } from "../../../app/store/uiStore";
import { IconButton } from "../../../ui/primitives";

const shortcuts = [
  ["Ctrl+C", "Copy selection"],
  ["Ctrl+X", "Cut selection"],
  ["Ctrl+V", "Paste geometry"],
  ["Ctrl+D", "Duplicate selection"],
  ["Ctrl+K", "Open command palette"],
  ["Delete", "Delete selected objects"],
  ["Space", "Temporary pan"],
  ["Alt", "Temporarily disable snap"],
];

export function HelpDialog() {
  const open = useUiStore((state) => state.openDialog === "help");
  const close = useUiStore((state) => state.setOpenDialog);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-5 backdrop-blur-sm">
      <div className="w-[640px] max-w-full overflow-hidden rounded-[22px] border border-arctic-border/10 bg-arctic-background/96 shadow-[0_24px_80px_rgb(0_0_0/0.42)]">
        <header className="flex items-center justify-between border-b border-arctic-border/8 px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-arctic-muted">
              NoadDVo Geometry Studio
            </p>
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-arctic-text">
              Help
            </h2>
          </div>
          <IconButton label="Close help" onClick={() => close(null)} size="sm">
            <X size={16} />
          </IconButton>
        </header>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <section className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/45 p-3">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-arctic-ice">
              Keyboard Shortcuts
            </h3>
            <div className="grid gap-2">
              {shortcuts.map(([keys, label]) => (
                <div className="flex items-center justify-between gap-3 text-[11px]" key={keys}>
                  <span className="text-arctic-muted">{label}</span>
                  <kbd className="rounded-[7px] border border-arctic-border/10 bg-arctic-surface/70 px-2 py-1 font-mono text-arctic-text">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/45 p-3">
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-arctic-ice">
              Resources
            </h3>
            <div className="grid gap-2">
              <HelpLink href="docs/PROJECT_SPEC.md" label="Documentation" />
              <HelpLink href="https://github.com/" label="GitHub Repository" />
              <div className="mt-2 rounded-[12px] border border-arctic-border/8 bg-arctic-surface/55 p-3 text-[11px] leading-5 text-arctic-muted">
                <strong className="block text-arctic-text">About</strong>
                Professional geometry workspace for interactive construction and clean TikZ output.
                <span className="mt-2 block font-mono">Version 0.0.0</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function HelpLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <a
      className="flex items-center justify-between rounded-[10px] border border-arctic-border/8 bg-arctic-surface/55 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-arctic-text hover:bg-arctic-surface/80"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink size={14} />
    </a>
  );
}
