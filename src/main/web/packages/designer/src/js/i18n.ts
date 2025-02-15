import { getLanguage } from "@de-xima/fc-form-designer";

import { type TMessageKey, pluginMessage } from "codbi-common";

/**
 * Finds the localized message for the given key. Uses the current locale of
 * the form designer.
 * @param key The key of the message to find.
 * @returns The localized message, a default such as `?key?` if no localization
 * is found.
 */
export function i18n(key: TMessageKey): string {
  return pluginMessage(getLanguage(), key);
}
