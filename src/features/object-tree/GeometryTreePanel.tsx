import { useMemo, useState } from "react";
import { Hash, Search } from "lucide-react";
import clsx from "clsx";

import { useGeometryStore } from "../../app/store/geometryStore";
import { useUiStore } from "../../app/store/uiStore";
import { DependencyGraph, type GeometryObject } from "../../core/geometry";
import { Panel } from "../../ui/primitives";
import { DependencySummary, EmptySearchState } from "./DependencySummary";
import { ObjectTreeItem } from "./ObjectTreeItem";
import {
  createObjectTreeSections,
  objectTreeFilters,
  type ObjectTreeFilter,
} from "./objectTreeUtils";

export function GeometryTreePanel() {
  const objects = useGeometryStore((state) => state.objects);
  const selectedObjectIds = useGeometryStore((state) => state.selectedObjectIds);
  const hoveredObjectId = useGeometryStore((state) => state.hoveredObjectId);
  const selectObject = useGeometryStore((state) => state.selectObject);
  const setHoveredObject = useGeometryStore((state) => state.setHoveredObject);
  const updateObject = useGeometryStore((state) => state.updateObject);
  const appTheme = useUiStore((state) => state.appTheme);
  const isDark = appTheme === "theme2";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ObjectTreeFilter>("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const sections = useMemo(
    () => createObjectTreeSections(objects, filter, query),
    [filter, objects, query],
  );
  const graph = useMemo(() => DependencyGraph.fromObjects(objects), [objects]);
  const selectedObject = selectedObjectIds[0] ? objects[selectedObjectIds[0]] : null;
  const objectCount = Object.keys(objects).length;

  const renameObject = (object: GeometryObject, name: string) => {
    const trimmedName = name.trim();
    const { name: _currentName, ...objectWithoutName } = object;

    updateObject(
      object.id,
      trimmedName
        ? {
            ...objectWithoutName,
            name: trimmedName,
            updatedAt: Date.now(),
          }
        : {
            ...objectWithoutName,
            updatedAt: Date.now(),
          },
    );
    setRenamingId(null);
  };

  return (
    <Panel
      className="h-full min-h-0 overflow-hidden max-lg:hidden"
      eyebrow="Workspace"
      title="Object Tree"
    >
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)_auto]">
      <div className="border-b border-arctic-border/8 px-3 py-2">
          <label className={clsx(
            "flex h-8 items-center gap-2 rounded-[12px] border px-2.5",
            isDark ? "border-zinc-700/60 bg-zinc-800/60" : "border-arctic-border/8 bg-arctic-surface/55"
          )}>
            <Search size={14} strokeWidth={2} className={isDark ? "text-zinc-500" : "text-arctic-muted"} />
            <input
              className={clsx(
                "min-w-0 flex-1 bg-transparent text-[12px] font-semibold outline-none",
                isDark ? "text-zinc-200 placeholder:text-zinc-500" : "text-arctic-text placeholder:text-arctic-muted"
              )}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search objects"
              value={query}
            />
          </label>
        </div>
        <FilterBar filter={filter} setFilter={setFilter} />
        <div className="min-h-0 overflow-y-auto px-3 py-2">
          {objectCount === 0 ? (
            <EmptyTreeState />
          ) : sections.length === 0 ? (
            <EmptySearchState />
          ) : (
            sections.map((section) => (
              <div className="mb-3" key={section.id}>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className={clsx(
                    "text-[10px] font-black uppercase tracking-[0.18em]",
                    isDark ? "text-zinc-400" : "text-arctic-muted"
                  )}>
                    {section.label}
                  </span>
                  <span className={clsx(
                    "font-mono text-[10px]",
                    isDark ? "text-zinc-500" : "text-arctic-muted/80"
                  )}>
                    {section.objects.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {section.objects.map((object) => (
                    <ObjectTreeItem
                      hovered={hoveredObjectId === object.id}
                      key={`${section.id}-${object.id}`}
                      object={object}
                      onRename={renameObject}
                      renaming={renamingId === object.id}
                      selected={selectedObjectIds.includes(object.id)}
                      setHoveredObject={setHoveredObject}
                      setRenamingId={setRenamingId}
                      selectObject={selectObject}
                      updateObject={updateObject}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <DependencySummary
          graph={graph.valid ? graph.value : null}
          isDark={isDark}
          objects={objects}
          selectedObject={selectedObject ?? null}
        />
      </div>
    </Panel>
  );
}

function FilterBar({
  filter,
  setFilter,
}: {
  readonly filter: ObjectTreeFilter;
  readonly setFilter: (filter: ObjectTreeFilter) => void;
}) {
  const appTheme = useUiStore((state) => state.appTheme);
  const isDark = appTheme === "theme2";

  return (
    <div className={clsx(
      "flex gap-1 overflow-x-auto px-3 py-2",
      isDark ? "border-b border-zinc-700/60 bg-[#18191E]" : "border-b-[3px] border-arctic-border bg-arctic-bg"
    )}>
      {objectTreeFilters.map((item) => (
        <button
          className={clsx(
            "shrink-0 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition",
            isDark
              ? clsx(
                  "rounded-md border",
                  filter === item.id
                    ? "border-zinc-600 bg-zinc-700 text-zinc-100"
                    : "border-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                )
              : clsx(
                  "rounded-none border-[3px] border-transparent",
                  filter === item.id
                    ? "bg-arctic-primary text-arctic-text border-arctic-border shadow-brutal"
                    : "text-arctic-muted hover:bg-arctic-primary-hover hover:text-arctic-text hover:border-arctic-border hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5"
                )
          )}
          key={item.id}
          onClick={() => setFilter(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function EmptyTreeState() {
  return (
    <div className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/55 px-4 py-4">
      <Hash size={18} strokeWidth={2} className="text-arctic-ice/80" />
      <p className="mt-2 text-sm font-bold text-arctic-text">No geometry objects</p>
      <p className="mt-1 text-xs font-semibold text-arctic-muted">
        Create a point or load an example to populate the tree.
      </p>
    </div>
  );
}
