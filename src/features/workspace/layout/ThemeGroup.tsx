import { Moon, Settings } from "lucide-react";

import { useUiStore, type ThemeMode } from "../../../app/store/uiStore";
import { IconButton } from "../../../ui/primitives";

const themeOrder: readonly ThemeMode[] = ["dark-arctic", "dark", "light", "system"];

export function ThemeGroup() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const setOpenDialog = useUiStore((state) => state.setOpenDialog);
  const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length] ?? "dark-arctic";

  return (
    <>
      <IconButton
        label={`Theme: ${theme}`}
        onClick={() => setTheme(nextTheme)}
      >
        <Moon size={18} strokeWidth={2} />
      </IconButton>
      <IconButton label="Settings" onClick={() => setOpenDialog("settings")}>
        <Settings size={18} strokeWidth={2} />
      </IconButton>
    </>
  );
}
