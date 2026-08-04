import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";

/**
 * Returns the technical name/key of the form that is currently being edited in the designer, or
 * `""` when it cannot be determined.
 *
 * The form key is resolved from (in order of preference):
 * 1. the designer config (`config.formKey` / `config.key` / `config.name`), and
 * 2. the persist JSON — Formcycle stores the form identity in the root `metadata` object, so
 *    `metadata.name` / `metadata.key` / `metadata.formKey` are checked first, followed by the
 *    root-level `name` / `key` / `formKey` fields.
 */
export function getCurrentFormKey(): string {
  const designer = getDesignerInstance();
  if (!designer) {
    return "";
  }
  const d = designer as unknown as Record<string, unknown>;

  // 1) Designer config candidates.
  const cfg = d["config"] as Record<string, unknown> | undefined;
  if (cfg) {
    for (const candidate of ["formKey", "key", "name"]) {
      const value = cfg[candidate];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  // 2) Persist JSON (full persist includes the `metadata` identity object).
  try {
    const persist = designer.getPersist?.() as unknown as Record<string, unknown> | undefined;
    const innerJson =
      typeof persist?.["persist"] === "string"
        ? (persist["persist"] as string)
        : persist
          ? JSON.stringify(persist)
          : null;
    if (innerJson) {
      const root = JSON.parse(innerJson) as Record<string, unknown>;
      const meta = (root["metadata"] ?? {}) as Record<string, unknown>;
      for (const candidate of ["name", "key", "formKey", "technicalName"]) {
        const value = meta[candidate];
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
      for (const candidate of ["name", "key", "formKey"]) {
        const value = root[candidate];
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
    }
  } catch {
    // Ignore parse errors — fall back to the designer-config candidates only.
  }
  return "";
}
