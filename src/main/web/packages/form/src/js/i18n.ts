import { getXfcMetaData, getXmFormI18n } from "@de-xima/fc-form-renderer";
import { type TMessageKey, formMessage } from "codbi-common";

/**
 * Finds the localized message for the given key. Uses the current locale of
 * the opened form.
 * @param key The key of the message to find.
 * @returns The localized message, a default such as `?key?` if no localization
 * is found.
 */
export function i18n(key: TMessageKey): string {
  return formMessage(getXfcMetaData().currentLanguage, key, getXmFormI18n());
}
