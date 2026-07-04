import { useGeometryStore } from "../../../app/store/geometryStore";
import { useViewportStore } from "../../../app/store/viewportStore";

function formatCoordinate(value: number): string {
  const rounded = Number(value.toFixed(3));

  return Object.is(rounded, -0) ? "0.000" : rounded.toFixed(3);
}

export function StatusBar() {
  const viewport = useViewportStore((state) => state.viewport);
  const pointerWorld = useViewportStore((state) => state.pointerWorld);
  const snapEnabled = useViewportStore((state) => state.snapEnabled);
  const gridSize = useViewportStore((state) => state.gridSize);
  const selectionCount = useGeometryStore(
    (state) => state.selectedObjectIds.length,
  );
  const statusItems = [
    ["Zoom", `${Math.round((viewport.scale / 48) * 100)}%`],
    ["X", formatCoordinate(pointerWorld.x)],
    ["Y", formatCoordinate(pointerWorld.y)],
    ["Selection", String(selectionCount)],
    ["Snap", snapEnabled ? `Grid ${gridSize}` : "Off"],
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
