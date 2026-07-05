import { useEffect, useSyncExternalStore, type ComponentType } from "react";
import {
  Circle,
  Clipboard,
  Copy,
  EyeOff,
  FileCode2,
  Gauge,
  Grid3X3,
  LockKeyhole,
  MapPin,
  Maximize2,
  PanelRight,
  Pencil,
  Pentagon,
  Plus,
  RotateCcw,
  Ruler,
  Settings2,
  Trash2,
} from "lucide-react";
import clsx from "clsx";

import { contextMenuManager, type ContextMenuItem } from "../../core/context";

type IconComponent = ComponentType<{
  readonly size?: number | string;
  readonly strokeWidth?: number | string;
}>;

const icons: Record<string, IconComponent> = {
  angle: Gauge,
  area: Pentagon,
  clipboard: Clipboard,
  coordinates: MapPin,
  delete: Trash2,
  duplicate: Copy,
  grid: Grid3X3,
  hide: EyeOff,
  length: Ruler,
  lock: LockKeyhole,
  paste: Clipboard,
  perimeter: Pentagon,
  plus: Plus,
  properties: PanelRight,
  radius: Circle,
  rename: Pencil,
  "reset-view": RotateCcw,
  settings: Settings2,
  tikz: FileCode2,
  "zoom-fit": Maximize2,
};

function getIcon(icon: string): IconComponent {
  return icons[icon] ?? Plus;
}

function ActionRow({ item }: { readonly item: Extract<ContextMenuItem, { readonly type: "action" }> }) {
  const Icon = getIcon(item.icon);

  return (
    <button
      className={clsx(
        "group flex min-h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-left transition",
        item.disabled
          ? "cursor-default text-arctic-muted/55"
          : "text-arctic-text hover:bg-arctic-ice/10 hover:text-arctic-ice",
      )}
      disabled={item.disabled}
      onClick={() => void contextMenuManager.execute(item.actionId)}
      title={item.disabled ? item.detail ?? "Coming soon" : undefined}
      type="button"
    >
      <span
        className={clsx(
          "flex size-7 shrink-0 items-center justify-center rounded-[9px] border",
          item.disabled
            ? "border-white/5 bg-white/[0.025]"
            : "border-arctic-ice/15 bg-arctic-ice/[0.075] group-hover:border-arctic-ice/35",
        )}
      >
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-bold uppercase tracking-[0.12em]">
          {item.label}
        </span>
        {item.detail && (
          <span className="mt-0.5 block truncate font-mono text-[10px] normal-case tracking-normal text-arctic-muted">
            {item.detail}
          </span>
        )}
      </span>
      {item.shortcut && (
        <span className="shrink-0 rounded-[7px] border border-white/8 bg-white/[0.035] px-1.5 py-0.5 font-mono text-[10px] text-arctic-muted">
          {item.shortcut}
        </span>
      )}
    </button>
  );
}

export function ContextMenuOverlay() {
  const state = useSyncExternalStore(
    contextMenuManager.subscribe,
    contextMenuManager.getSnapshot,
    contextMenuManager.getSnapshot,
  );

  useEffect(() => {
    if (!state.open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        contextMenuManager.close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state.open]);

  if (!state.open) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-30"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          contextMenuManager.close();
        }
      }}
    >
      <div
        className="absolute w-64 overflow-hidden rounded-[18px] border border-white/10 bg-[#101b24]/95 p-1.5 shadow-[0_26px_70px_rgb(0_0_0/0.42)] backdrop-blur-panel"
        onPointerDown={(event) => event.stopPropagation()}
        style={{
          left: state.position.x,
          top: state.position.y,
        }}
      >
        {state.items.map((item) =>
          item.type === "separator" ? (
            <div
              className="my-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
              key={item.id}
            />
          ) : (
            <ActionRow item={item} key={item.id} />
          ),
        )}
      </div>
    </div>
  );
}

