import { FileText, GitBranch } from "lucide-react";

import { DependencyGraph, type GeometryObject } from "../../core/geometry";
import { getObjectDisplayName } from "./objectTreeUtils";

type DependencySummaryProps = {
  readonly graph: DependencyGraph | null;
  readonly objects: Record<string, GeometryObject>;
  readonly selectedObject: GeometryObject | null;
};

export function DependencySummary({
  graph,
  objects,
  selectedObject,
}: DependencySummaryProps) {
  if (!selectedObject || !graph) {
    return (
      <div className="border-t border-white/8 px-4 py-3 text-[11px] font-semibold text-arctic-muted">
        Select an object to inspect dependency links.
      </div>
    );
  }

  const parents = graph.getParents(selectedObject.id);
  const children = graph.getChildren(selectedObject.id);
  const chain = graph.getDependentIds(selectedObject.id);

  return (
    <div className="border-t border-white/8 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-arctic-muted">
        <GitBranch size={13} strokeWidth={2} />
        Dependencies
      </div>
      <DependencyLine label="Parents" objectIds={parents} objects={objects} />
      <DependencyLine label="Children" objectIds={children} objects={objects} />
      <DependencyLine label="Chain" objectIds={chain} objects={objects} />
    </div>
  );
}

function DependencyLine({
  label,
  objectIds,
  objects,
}: {
  readonly label: string;
  readonly objectIds: readonly string[];
  readonly objects: Record<string, GeometryObject>;
}) {
  return (
    <div className="mt-1 flex items-start gap-2 text-[11px]">
      <span className="w-14 shrink-0 font-bold uppercase tracking-[0.1em] text-arctic-muted/80">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-arctic-text/85">
        {objectIds.length === 0
          ? "None"
          : objectIds.map((objectId) => displayObjectId(objectId, objects)).join(" -> ")}
      </span>
    </div>
  );
}

export function EmptySearchState() {
  return (
    <div className="rounded-[14px] border border-white/8 bg-white/[0.035] px-4 py-4">
      <FileText size={18} strokeWidth={2} className="text-arctic-ice/80" />
      <p className="mt-2 text-sm font-bold text-arctic-text">No matching objects</p>
      <p className="mt-1 text-xs font-semibold text-arctic-muted">
        Try another search or filter.
      </p>
    </div>
  );
}

function displayObjectId(
  objectId: string,
  objects: Record<string, GeometryObject>,
): string {
  const object = objects[objectId];

  return object ? getObjectDisplayName(object) : objectId;
}
