import { useGeometryStore } from "../../../app/store/geometryStore";
import { useUiStore } from "../../../app/store/uiStore";
import { useViewportStore } from "../../../app/store/viewportStore";
import { useTranslation } from "../../../lib/useTranslation";
import clsx from "clsx";

function formatCoordinate(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0.000" : rounded.toFixed(3);
}

export function StatusBar() {
  const viewport = useViewportStore((state) => state.viewport);
  const pointerWorld = useViewportStore((state) => state.pointerWorld);
  const snapEnabled = useViewportStore((state) => state.snapEnabled);
  const snapTemporarilyDisabled = useViewportStore(
    (state) => state.snapTemporarilyDisabled,
  );
  const gridSize = useViewportStore((state) => state.gridSize);
  const keyboardModeHint = useUiStore((state) => state.keyboardModeHint);
  const selectionCount = useGeometryStore(
    (state) => state.selectedObjectIds.length,
  );
  const { t } = useTranslation();

  const effectiveSnapEnabled = snapEnabled && !snapTemporarilyDisabled;
  const modeLabel =
    keyboardModeHint === "pan"
      ? t("statusbar.pan")
      : keyboardModeHint === "snap-off"
        ? t("statusbar.snapOff")
        : keyboardModeHint === "constraint"
          ? t("statusbar.constraint")
          : t("statusbar.ready");
  const statusItems = [
    [t("statusbar.zoom"), `${Math.round((viewport.scale / 48) * 100)}%`],
    ["X", formatCoordinate(pointerWorld.x)],
    ["Y", formatCoordinate(pointerWorld.y)],
    [t("statusbar.selection"), String(selectionCount)],
    [t("statusbar.snap"), effectiveSnapEnabled ? `Grid ${gridSize}` : t("statusbar.snapOff")],
    [t("statusbar.mode"), modeLabel],
    [t("statusbar.tikz"), t("statusbar.ready")],
  ] as [string, string][];

  const appTheme = useUiStore((state) => state.appTheme);

  return (
    <footer className={clsx(
      "flex h-7 shrink-0 items-center gap-4 border-t px-4 font-mono text-[11px] backdrop-blur-panel",
      appTheme === "theme1" ? "border-black/10 bg-[#F4EFE6] text-black" : "",
      appTheme === "theme2" ? "border-zinc-800 bg-[#0D0E12] text-zinc-400" : ""
    )}>
      {statusItems.map(([label, value]) => (
        <div className="flex items-center gap-1.5" key={label}>
          <span className={clsx(
            "uppercase tracking-[0.12em]",
            appTheme === "theme1" ? "text-black/60" : "text-zinc-500"
          )}>
            {label}
          </span>
          <span className={clsx(
            appTheme === "theme1" ? "text-black" : "text-zinc-300"
          )}>{value}</span>
        </div>
      ))}
    </footer>
  );
}
