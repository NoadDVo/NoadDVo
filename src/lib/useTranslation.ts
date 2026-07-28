import { useUiStore } from "../app/store/uiStore";
import { t } from "../lib/i18n";
import type { TranslationKey } from "../lib/i18n";

export function useTranslation() {
  const language = useUiStore((state) => state.language);

  return {
    language,
    t: (key: TranslationKey) => t(key, language),
  };
}
