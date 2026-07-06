import { Moon, Settings } from "lucide-react";

import { IconButton } from "../../../ui/primitives";

export function ThemeGroup() {
  return (
    <>
      <IconButton disabled label="Coming soon">
        <Moon size={18} strokeWidth={2} />
      </IconButton>
      <IconButton disabled label="Coming soon">
        <Settings size={18} strokeWidth={2} />
      </IconButton>
    </>
  );
}
