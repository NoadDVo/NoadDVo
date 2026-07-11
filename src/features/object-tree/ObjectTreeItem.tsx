import { useState } from "react";
import {
  Circle,
  Eye,
  EyeOff,
  Gauge,
  Lock,
  MousePointer2,
  Pentagon,
  Ruler,
  Slash,
  Type,
  Unlock,
} from "lucide-react";
import clsx from "clsx";

import type { GeometryObject } from "../../core/geometry";
import { useUiStore } from "../../app/store/uiStore";
import { IconButton } from "../../ui/primitives";
import { getObjectDisplayName } from "./objectTreeUtils";

function iconForObject(object: GeometryObject) {
  if (object.type === "point") {
    return <MousePointer2 size={14} strokeWidth={2} />;
  }

  if (["segment", "line", "ray", "vector"].includes(object.type)) {
    return <Slash size={14} strokeWidth={2} />;
  }

  if (object.type === "circle") {
    return <Circle size={14} strokeWidth={2} />;
  }

  if (object.type === "polygon") {
    return <Pentagon size={14} strokeWidth={2} />;
  }

  if (object.type === "angle") {
    return <Gauge size={14} strokeWidth={2} />;
  }

  if (object.type === "text") {
    return <Type size={14} strokeWidth={2} />;
  }

  return <Ruler size={14} strokeWidth={2} />;
}

type ObjectTreeItemProps = {
  readonly hovered: boolean;
  readonly object: GeometryObject;
  readonly onRename: (object: GeometryObject, name: string) => void;
  readonly renaming: boolean;
  readonly selected: boolean;
  readonly selectObject: (objectId: string, additive?: boolean) => void;
  readonly setHoveredObject: (objectId: string | null) => void;
  readonly setRenamingId: (objectId: string | null) => void;
  readonly updateObject: (objectId: string, object: GeometryObject) => boolean;
};

export function ObjectTreeItem({
  hovered,
  object,
  onRename,
  renaming,
  selected,
  selectObject,
  setHoveredObject,
  setRenamingId,
  updateObject,
}: ObjectTreeItemProps) {
  const [draftName, setDraftName] = useState(getObjectDisplayName(object));
  const appTheme = useUiStore((state) => state.appTheme);
  const isDark = appTheme === "theme2";

  return (
    <div
      className={clsx(
        "group flex min-h-10 items-center gap-2 rounded-[12px] border px-2 transition",
        isDark
          ? selected
            ? "border-orange-500/40 bg-orange-500/10 text-zinc-100"
            : hovered
              ? "border-zinc-600/50 bg-zinc-700/30 text-zinc-200"
              : "border-transparent bg-zinc-800/40 text-zinc-300 hover:bg-zinc-700/50"
          : selected
            ? "border-arctic-ice/35 bg-arctic-ice/13 text-arctic-text shadow-[0_0_18px_rgb(168_216_255/0.12)]"
            : hovered
              ? "border-arctic-ice/20 bg-arctic-ice/8 text-arctic-text"
              : "border-transparent bg-arctic-surface/35 text-arctic-muted hover:bg-arctic-surface/65"
      )}
      onDoubleClick={() => {
        setDraftName(getObjectDisplayName(object));
        setRenamingId(object.id);
      }}
      onMouseEnter={() => setHoveredObject(object.id)}
      onMouseLeave={() => setHoveredObject(null)}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
        onClick={(event) => selectObject(object.id, event.ctrlKey || event.metaKey)}
        type="button"
      >
        <span className={clsx(
          "flex size-7 shrink-0 items-center justify-center rounded-[9px] border",
          isDark
            ? "border-zinc-700/60 bg-zinc-700/50 text-orange-400"
            : "border-arctic-border/8 bg-arctic-surface/55 text-arctic-ice"
        )}>
          {iconForObject(object)}
        </span>
        {renaming ? (
          <input
            autoFocus
            className="min-w-0 flex-1 rounded-[8px] border border-arctic-ice/30 bg-arctic-surface px-2 py-1 text-[12px] font-semibold text-arctic-text outline-none"
            onBlur={() => onRename(object, draftName)}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onRename(object, draftName);
              }

              if (event.key === "Escape") {
                setRenamingId(null);
              }
            }}
            value={draftName}
          />
        ) : (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-bold">
              {getObjectDisplayName(object)}
            </span>
            <span className={clsx(
              "block truncate font-mono text-[9px] uppercase tracking-[0.1em]",
              isDark ? "text-zinc-500" : "text-arctic-muted/75"
            )}>
              {object.type}
            </span>
          </span>
        )}
      </button>
      <IconButton
        className="size-7 rounded-[9px] opacity-70 group-hover:opacity-100"
        label={object.visible ? "Hide object" : "Show object"}
        onClick={() =>
          updateObject(object.id, {
            ...object,
            updatedAt: Date.now(),
            visible: !object.visible,
          })
        }
        size="sm"
      >
        {object.visible ? <Eye size={13} strokeWidth={2} /> : <EyeOff size={13} strokeWidth={2} />}
      </IconButton>
      <IconButton
        className="size-7 rounded-[9px] opacity-70 group-hover:opacity-100"
        label={object.locked ? "Unlock object" : "Lock object"}
        onClick={() =>
          updateObject(object.id, {
            ...object,
            locked: !object.locked,
            updatedAt: Date.now(),
          })
        }
        size="sm"
      >
        {object.locked ? <Lock size={13} strokeWidth={2} /> : <Unlock size={13} strokeWidth={2} />}
      </IconButton>
    </div>
  );
}
