import { CircleHelp } from "lucide-react";

import { useUiStore } from "../../../app/store/uiStore";
import { IconButton } from "../../../ui/primitives";

export function HelpGroup() {
  const setOpenDialog = useUiStore((state) => state.setOpenDialog);

  return (
    <IconButton label="Help" onClick={() => setOpenDialog("help")}>
      <CircleHelp size={18} strokeWidth={2} />
    </IconButton>
  );
}
