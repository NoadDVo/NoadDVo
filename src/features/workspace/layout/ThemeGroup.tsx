import { Palette } from "lucide-react";

import { useUiStore } from "../../../app/store/uiStore";
import { Button } from "../../../ui/primitives";

export function ThemeGroup() {
  const appTheme = useUiStore((state) => state.appTheme);
  const setAppTheme = useUiStore((state) => state.setAppTheme);

  const handleToggle = () => {
    setAppTheme(appTheme === "theme1" ? "theme2" : "theme1");
  };

  return (
    <Button
      icon={<Palette size={16} strokeWidth={2} />}
      onClick={handleToggle}
      size="sm"
      title={appTheme === "theme1" ? "Switch to Tactical Dark" : "Switch to Neo-Brutalism"}
      variant="topbar"
    >
      Theme
    </Button>
  );
}
