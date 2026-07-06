import { CircleHelp } from "lucide-react";

import { IconButton } from "../../../ui/primitives";

export function HelpGroup() {
  return (
    <IconButton disabled label="Coming soon">
      <CircleHelp size={18} strokeWidth={2} />
    </IconButton>
  );
}
