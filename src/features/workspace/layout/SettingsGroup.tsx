import { Settings } from "lucide-react";

import { useUiStore } from "../../../app/store/uiStore";
import { useTranslation } from "../../../lib/useTranslation";
import { Button } from "../../../ui/primitives";

export function SettingsGroup() {
  const activeTopBarMenu = useUiStore((state) => state.activeTopBarMenu);
  const openDialog = useUiStore((state) => state.openDialog);
  const setOpenDialog = useUiStore((state) => state.setOpenDialog);
  const { t } = useTranslation();

  const isDisabled = activeTopBarMenu !== null || openDialog !== null;

  return (
    <Button
      icon={<Settings size={16} strokeWidth={2} />}
      onClick={() => setOpenDialog("settings")}
      size="sm"
      variant="topbar"
      disabled={isDisabled}
    >
      {t("settings.title")}
    </Button>
  );
}
