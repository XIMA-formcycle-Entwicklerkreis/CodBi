/**
 * Small helpers to persist and restore the on-screen position of the CodBi PrimeNG dialogs
 * (AI assistant, prompt manager, change log). Positions are kept in `localStorage` keyed per dialog,
 * so the browser remembers where the user last placed them.
 */

export interface DialogPosition {
  left: number;
  top: number;
}

/** Reads a previously saved dialog position, or `null` when none is stored / parseable. */
export function loadDialogPosition(storageKey: string): DialogPosition | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DialogPosition>;
    if (typeof p.left === "number" && typeof p.top === "number" && Number.isFinite(p.left) && Number.isFinite(p.top)) {
      return { left: p.left, top: p.top };
    }
  } catch {
    // Ignore malformed payload / unavailable storage.
  }
  return null;
}

/** Persists the dialog position for later sessions. */
export function saveDialogPosition(storageKey: string, position: DialogPosition): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(position));
  } catch {
    // Ignore storage errors (private mode etc.).
  }
}

/**
 * Applies a remembered position to the visible `.p-dialog` element identified by its `styleClass`.
 * `position: fixed` + explicit `left`/`top` place the dialog at the remembered viewport spot; the
 * `transform: none` neutralizes PrimeNG's centering transform so the coordinates are not offset.
 */
export function applyDialogPosition(styleClass: string, position: DialogPosition | null): void {
  if (!position) return;
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) return;
  el.style.position = "fixed";
  el.style.left = `${position.left}px`;
  el.style.top = `${position.top}px`;
  el.style.transform = "none";
}

/** Reads the current viewport position of the `.p-dialog` element identified by its `styleClass`. */
export function readDialogPosition(styleClass: string): DialogPosition | null {
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { left: Math.round(rect.left), top: Math.round(rect.top) };
}
