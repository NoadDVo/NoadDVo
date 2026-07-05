import { useGeometryStore } from "../../../app/store/geometryStore";
import { useUiStore } from "../../../app/store/uiStore";
import { useViewportStore } from "../../../app/store/viewportStore";

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
  const effectiveSnapEnabled = snapEnabled && !snapTemporarilyDisabled;
  const modeLabel =
    keyboardModeHint === "pan"
      ? "Pan"
      : keyboardModeHint === "snap-off"
        ? "Snap Off"
        : keyboardModeHint === "constraint"
          ? "Constraint"
          : "Ready";
  const statusItems = [
    ["Zoom", `${Math.round((viewport.scale / 48) * 100)}%`],
    ["X", formatCoordinate(pointerWorld.x)],
    ["Y", formatCoordinate(pointerWorld.y)],
    ["Selection", String(selectionCount)],
    ["Snap", effectiveSnapEnabled ? `Grid ${gridSize}` : "Off"],
    ["Mode", modeLabel],
    ["TikZ", "Ready"],
  ] as const;

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-white/8 bg-[#0d1720]/78 px-4 font-mono text-[11px] text-arctic-muted backdrop-blur-panel">
      {statusItems.map(([label, value]) => (
        <div className="flex items-center gap-1.5" key={label}>
          <span className="uppercase tracking-[0.12em] text-arctic-muted/70">
            {label}
          </span>
          <span className="text-arctic-text/90">{value}</span>
        </div>
      ))}
    </footer>
  );
}
