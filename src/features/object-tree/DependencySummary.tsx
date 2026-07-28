import { FileText, GitBranch } from "lucide-react";
import clsx from "clsx";

import { DependencyGraph, type GeometryObject } from "../../core/geometry";
import { getObjectDisplayName } from "./objectTreeUtils";
import { useTranslation } from "../../lib/useTranslation";

type DependencySummaryProps = {
  readonly graph: DependencyGraph | null;
  readonly isDark?: boolean;
  readonly objects: Record<string, GeometryObject>;
  readonly selectedObject: GeometryObject | null;
};

export function DependencySummary({
  graph,
  isDark = false,
  objects,
  selectedObject,
}: DependencySummaryProps) {
  const { t } = useTranslation();

  if (!selectedObject || !graph) {
    return (
      <div className={clsx(
        "border-t px-4 py-3 text-[11px] font-semibold",
        isDark ? "border-zinc-700/60 text-zinc-500" : "border-arctic-border/8 text-arctic-muted"
      )}>
        {t("tree.selectToInspect")}
      </div>
    );
  }

  const parents = graph.getParents(selectedObject.id);
  const children = graph.getChildren(selectedObject.id);
  const chain = graph.getDependentIds(selectedObject.id);

  return (
    <div className={clsx(
      "border-t px-4 py-3",
      isDark ? "border-zinc-700/60" : "border-arctic-border/8"
    )}>
      <div className={clsx(
        "mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]",
        isDark ? "text-zinc-400" : "text-arctic-muted"
      )}>
        <GitBranch size={13} strokeWidth={2} />
        {t("adv.dependencies")}
      </div>
      <DependencyLine isDark={isDark} label={t("tree.parents")} objectIds={parents} objects={objects} />
      <DependencyLine isDark={isDark} label={t("tree.children")} objectIds={children} objects={objects} />
      <DependencyLine isDark={isDark} label={t("tree.chain")} objectIds={chain} objects={objects} />
    </div>
  );
}

function DependencyLine({
  isDark = false,
  label,
  objectIds,
  objects,
}: {
  readonly isDark?: boolean;
  readonly label: string;
  readonly objectIds: readonly string[];
  readonly objects: Record<string, GeometryObject>;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-1 flex items-start gap-2 text-[11px]">
      <span className={clsx(
        "w-14 shrink-0 font-bold uppercase tracking-[0.1em]",
        isDark ? "text-zinc-400" : "text-arctic-muted/80"
      )}>
        {label}
      </span>
      <span className={clsx(
        "min-w-0 flex-1 truncate font-mono",
        isDark ? "text-zinc-200" : "text-arctic-text/85"
      )}>
        {objectIds.length === 0
          ? t("adv.none")
          : objectIds.map((objectId) => displayObjectId(objectId, objects)).join(" -> ")}
      </span>
    </div>
  );
}

export function EmptySearchState() {
  const { t } = useTranslation();
  return (
    <div className="rounded-[14px] border border-arctic-border/8 bg-arctic-surface/55 px-4 py-4">
      <FileText size={18} strokeWidth={2} className="text-arctic-ice/80" />
      <p className="mt-2 text-sm font-bold text-arctic-text">{t("tree.emptySearch")}</p>
      <p className="mt-1 text-xs font-semibold text-arctic-muted">
        {t("tree.emptySearchDesc")}
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
