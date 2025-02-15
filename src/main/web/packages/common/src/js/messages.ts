// Common JavaScript logic that can be used by both the form and the designer package

import { Messages } from "./localization.js";

export type TMessages = typeof Messages;

export type TLanguage = keyof TMessages;

export type TMessageKey = keyof TMessages[TLanguage];

export type TI18N = (key: TMessageKey) => string;

function parseLang(lang: string): TLanguage {
  return lang in Messages ? (lang as TLanguage) : "en";
}

/**
 * Maps internal plugin message keys to I18N variable keys configured in the formcycle
 * backend (`files & templates` -> `I18N variables`). All localized messages that are used for frontend forms should be customizable
 * by backend users.
 */
const MessageKeyToI18nVariable: Partial<Record<TMessageKey, string>> = {
  "form.test_string": "testString",
};

/**
 * Gets the translation for a given key, taken from the localized messages
 * in the properties files of the plugin. Falls back to English when no
 * translation was found for the given language.
 *
 * This should only be used for the backend, i.e. the form designer. For the
 * frontend, i.e. forms, use {@link formMessage}.
 * @param lang Target language
 * @param key Message key.
 * @returns Localized message.
 */
export function pluginMessage(lang: string, key: TMessageKey): string {
  const actualLang = parseLang(lang);
  const messages = Messages[actualLang];
  return messages[key] ?? `?${key}?`;
}

/**
 * Similar to {@link pluginMessage}, but attempts to take the localized message from
 * the I18N variables configured in the formcycle application, if available.
 *
 * This allows users to add custom translations for other languages that
 * frontend forms should support.
 * @param lang Target language
 * @param key Message key.
 * @param formI18n Map with the I18N variables configured in the formcycle application.
 * @returns Localized message.
 */
export function formMessage(lang: string, key: TMessageKey, formI18n: Record<string, string>): string {
  return formI18n[MessageKeyToI18nVariable[key] ?? ""] ?? pluginMessage(lang, key);
}
