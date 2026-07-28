import { Redo2, Undo2 } from "lucide-react";

import { useGeometryStore } from "../../../app/store/geometryStore";
import { useTranslation } from "../../../lib/useTranslation";
import { IconButton } from "../../../ui/primitives";

export function UndoRedoGroup() {
  const canUndo = useGeometryStore((state) => state.canUndo);
  const canRedo = useGeometryStore((state) => state.canRedo);
  const { t } = useTranslation();

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <IconButton
        disabled={!canUndo}
        label={t("btn.undo")}
        onClick={() => useGeometryStore.getState().undo()}
      >
        <Undo2 size={18} strokeWidth={2} />
      </IconButton>
      <IconButton
        disabled={!canRedo}
        label={t("btn.redo")}
        onClick={() => useGeometryStore.getState().redo()}
      >
        <Redo2 size={18} strokeWidth={2} />
      </IconButton>
    </div>
  );
}

