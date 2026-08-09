import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";

/**
 * Returns a key that uniquely identifies the form currently being edited in the designer, or `""`
 * when it cannot be determined. The returned key is NEVER the empty string for a real form: it
 * resolves from (in order of preference):
 * 0. `XFC_METADATA.currentProject.id` — Formcycle's always-present numeric form/project ID (see
 *    https://docs.formcycle.eu/current/javascript/en/interfaces/Formcycle.XfcMetadata.html#currentproject),
 *    prefixed with `project-` so it stays distinguishable from technical-name keys,
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

  // 0) XFC_METADATA.currentProject.id — the numeric form/project ID. Unlike the technical name,
  //    keyless forms always have this, so the change log/history can be scoped per form reliably.
  const xfc = (
    window as unknown as {
      XFC_METADATA?: {
        currentProject?: { id?: number | string; currentForm?: { id?: number | string } };
      };
    }
  )?.XFC_METADATA;
  const projectId = xfc?.currentProject?.id;
  if (projectId !== undefined && projectId !== null && String(projectId).trim() !== "") {
    return `project-${String(projectId).trim()}`;
  }
  const formId = xfc?.currentProject?.currentForm?.id;
  if (formId !== undefined && formId !== null && String(formId).trim() !== "") {
    return `project-${String(formId).trim()}`;
  }

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
