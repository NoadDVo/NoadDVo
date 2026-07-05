import { Redo2, Undo2 } from "lucide-react";

import { useGeometryStore } from "../../../app/store/geometryStore";
import { IconButton } from "../../../ui/primitives";

export function UndoRedoGroup() {
  const canUndo = useGeometryStore((state) => state.canUndo);
  const canRedo = useGeometryStore((state) => state.canRedo);

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <IconButton
        disabled={!canUndo}
        label="Undo"
        onClick={() => useGeometryStore.getState().undo()}
      >
        <Undo2 size={18} strokeWidth={2} />
      </IconButton>
      <IconButton
        disabled={!canRedo}
        label="Redo"
        onClick={() => useGeometryStore.getState().redo()}
      >
        <Redo2 size={18} strokeWidth={2} />
      </IconButton>
    </div>
  );
}

