import { t } from "../lib/i18n";
import type { TranslationKey } from "../lib/i18n";

export function useTranslation() {
  return {
    t: (key: TranslationKey) => t(key),
  };
}
