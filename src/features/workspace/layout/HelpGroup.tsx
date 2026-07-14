import { CircleHelp } from "lucide-react";

import { useUiStore } from "../../../app/store/uiStore";
import { Button } from "../../../ui/primitives";

export function HelpGroup() {
  const setOpenDialog = useUiStore((state) => state.setOpenDialog);
  const openDialog = useUiStore((state) => state.openDialog);

  return (
    <Button
      icon={<CircleHelp size={16} strokeWidth={2} />}
      onClick={() => setOpenDialog("help")}
      size="sm"
      variant="topbar"
      active={openDialog === "help"}
    >
      Help
    </Button>
  );
}
