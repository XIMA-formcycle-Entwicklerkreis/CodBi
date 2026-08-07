/**
 * Small helpers to persist, restore and drag the on-screen position of the CodBi PrimeNG dialogs
 * (AI assistant, prompt manager, change log). Positions are kept in `localStorage` keyed per dialog,
 * so the browser remembers where the user last placed them.
 */

export interface DialogPosition {
  left: number;
  top: number;
  /** Optional width/height — persisted when a dialog was docked/resized. */
  width?: number;
  height?: number;
  /** Which screen half the dialog is docked to (`"left"`/`"right"`), or `null` when floating. */
  docked?: "left" | "right" | null;
}

/** Reads a previously saved dialog position, or `null` when none is stored / parseable. */
export function loadDialogPosition(storageKey: string): DialogPosition | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<DialogPosition>;
    if (typeof p.left === "number" && typeof p.top === "number" && Number.isFinite(p.left) && Number.isFinite(p.top)) {
      const pos: DialogPosition = { left: p.left, top: p.top };
      if (typeof p.width === "number" && Number.isFinite(p.width)) pos.width = p.width;
      if (typeof p.height === "number" && Number.isFinite(p.height)) pos.height = p.height;
      if (p.docked === "left" || p.docked === "right") pos.docked = p.docked;
      return pos;
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
  el.style.transform = "none";
  if (position.docked) {
    // Remember the pre-dock size so un-snapping restores it. When a dialog is restored as docked
    // from a saved position (or was never floated in this session), lastFloatingSizes is empty —
    // capture the rendered size here before it is overwritten by the dock size. The inline width
    // may be a CSS unit (e.g. "85vw"), so use getBoundingClientRect (px) — parsing the string
    // would yield a tiny pixel value.
    if (!lastFloatingSizes.has(styleClass)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        lastFloatingSizes.set(styleClass, {
          width: Math.max(480, Math.round(rect.width)),
          height: Math.round(rect.height) > 0 ? Math.round(rect.height) : Math.round(window.innerHeight * 0.85),
        });
      }
    }
    // Restore the docked (snapped) state: half window, full height, content fills.
    el.classList.add("cb-docked");
    el.style.left = position.docked === "left" ? "0px" : "50vw";
    el.style.top = "0px";
    el.style.width = "50vw";
    el.style.height = "100vh";
    el.style.maxHeight = "100vh";
  } else {
    el.classList.remove("cb-docked");
    el.style.left = `${position.left}px`;
    el.style.top = `${position.top}px`;
    if (typeof position.width === "number") el.style.width = `${position.width}px`;
    if (typeof position.height === "number") el.style.height = `${position.height}px`;
  }
}

/** Reads the current viewport position of the `.p-dialog` element identified by its `styleClass`. */
export function readDialogPosition(styleClass: string): DialogPosition | null {
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { left: Math.round(rect.left), top: Math.round(rect.top) };
}

/**
 * Registers a dialog (identified by its `styleClass`) as draggable via its header. Dragging is
 * handled by a single global, capture-phase listener that resolves the dialog from the actual event
 * target at drag time — so it works regardless of render/animation timing or how many times the
 * dialog is shown, even inside Angular Elements custom components embedded in the Formcycle
 * designer. PrimeNG's own drag is disabled via `[draggable]="false"` to avoid double-handling.
 * When the drag ends, the position is persisted under `storageKey` and [onMoved] (if given) is
 * invoked.
 *
 * @returns A cleanup function that unregisters the dialog.
 */
export function enableDialogDrag(
  styleClass: string,
  storageKey: string,
  onMoved?: (position: DialogPosition) => void,
): () => void {
  console.log(`[CodBiDrag] enableDialogDrag('${styleClass}', '${storageKey}')`);
  installGlobalDragCoordinator();
  installGlobalPositionRestore();
  dialogDragRegistry.set(styleClass, { storageKey, onMoved });
  console.log(`[CodBiDrag] registered '${styleClass}' -> '${storageKey}' (total ${dialogDragRegistry.size})`);
  return () => {
    console.log(`[CodBiDrag] unregister '${styleClass}'`);
    dialogDragRegistry.delete(styleClass);
  };
}

interface DialogDragRegistration {
  storageKey: string;
  onMoved?: (position: DialogPosition) => void;
}

interface DragSession {
  dialog: HTMLElement;
  styleClass: string;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  /** Floating (un-docked) size, restored when a docked dialog is dragged away. */
  floatingWidth: number;
  floatingHeight: number;
  /** max-height the dialog had before docking (e.g. "85vh"), restored on un-dock. */
  originalMaxHeight: string;
  snapped: "left" | "right" | null;
}

/** Registered dialogs: `styleClass` → where to store the position. */
const dialogDragRegistry = new Map<string, DialogDragRegistration>();

/** Distance from the viewport edge (px) that triggers docking to the left/right half. */
const SNAP_THRESHOLD = 40;

/** Last floating size of each dialog, so dragging a docked dialog un-docks it at its prior size. */
const lastFloatingSizes = new Map<string, { width: number; height: number }>();

/** The in-flight drag session, or `null`. */
let dragSession: DragSession | null = null;

let dragCoordinatorInstalled = false;

/** Installs the single global drag coordinator (once per page). */
function installGlobalDragCoordinator(): void {
  if (dragCoordinatorInstalled) {
    console.log("[CodBiDrag] coordinator already installed");
    return;
  }
  dragCoordinatorInstalled = true;
  document.addEventListener("mousedown", onGlobalMouseDown, true);
  document.addEventListener("mousemove", onGlobalMouseMove, true);
  document.addEventListener("mouseup", onGlobalMouseUp, true);
  console.log("[CodBiDrag] global coordinator installed (capture listeners on document)");
}

/** Resolves the dragged dialog + storage key from the event target, or `null`. */
function resolveDraggable(target: EventTarget | null): { dialog: HTMLElement; styleClass: string } | null {
  const el = target as HTMLElement | null;
  if (!el) return null;
  const header = el.closest(".p-dialog-header") as HTMLElement | null;
  console.log(
    `[CodBiDrag] mousedown target: <${el.tagName}> class="${el.className}" | .p-dialog-header found: ${!!header}`,
  );
  if (!header) {
    const dlg = el.closest(".p-dialog") as HTMLElement | null;
    console.log(
      `[CodBiDrag]   no .p-dialog-header. closest .p-dialog: ${
        dlg ? dlg.className : "NONE"
      } | path: ${el.className} -> ${el.parentElement?.className} -> ${el.parentElement?.parentElement?.className}`,
    );
    return null;
  }
  const dialog = header.closest(".p-dialog") as HTMLElement | null;
  console.log(
    `[CodBiDrag]   header <${header.tagName}> class="${header.className}" | .p-dialog found: ${!!dialog} | dialog class="${dialog?.className}"`,
  );
  if (!dialog) return null;
  for (const styleClass of dialogDragRegistry.keys()) {
    if (dialog.classList.contains(styleClass)) {
      console.log(`[CodBiDrag]   matched dialog styleClass: '${styleClass}'`);
      return { dialog, styleClass };
    }
  }
  console.log(
    `[CodBiDrag]   no match! dialog class="${dialog.className}" | registered: ${JSON.stringify([...dialogDragRegistry.keys()])}`,
  );
  return null;
}

function onGlobalMouseDown(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  // Never start a drag from the maximize / close buttons.
  if (target?.closest(".p-dialog-header-icon, .p-dialog-maximize-icon, .p-dialog-header-close-icon")) {
    console.log("[CodBiDrag] mousedown ignored (icon button)");
    return;
  }
  const hit = resolveDraggable(target);
  if (!hit) {
    console.log("[CodBiDrag] mousedown: no draggable dialog started");
    return;
  }
  // Do not drag a maximized dialog around.
  if (hit.dialog.classList.contains("p-dialog-maximized")) {
    console.log("[CodBiDrag] mousedown ignored (maximized)");
    return;
  }
  // Disable CSS transitions while dragging so the dialog follows the mouse immediately (the change
  // log / prompt manager dialogs animate top/left/width/height otherwise).
  hit.dialog.style.transition = "none";
  // Dragging a docked (snapped) dialog un-docks it at its last floating size, but never smaller
  // than a reasonable minimum (capped to the viewport).
  if (hit.dialog.style.width === "50vw") {
    const last = lastFloatingSizes.get(hit.styleClass);
    if (last) {
      const w = Math.min(window.innerWidth - 20, Math.max(480, last.width));
      const h = Math.min(window.innerHeight - 60, Math.max(300, last.height));
      hit.dialog.style.width = `${w}px`;
      hit.dialog.style.height = `${h}px`;
    }
  }
  const rect = hit.dialog.getBoundingClientRect();
  dragSession = {
    dialog: hit.dialog,
    styleClass: hit.styleClass,
    startX: e.clientX,
    startY: e.clientY,
    originLeft: rect.left,
    originTop: rect.top,
    floatingWidth: rect.width,
    floatingHeight: rect.height,
    originalMaxHeight: hit.dialog.style.maxHeight,
    // Record which side an already-docked dialog is snapped to, so that dragging it away actually
    // un-docks it (removes the `cb-docked` class → rounded corners return). Without this the
    // `if (s.snapped)` un-dock branch below never fires when the drag starts on a docked dialog.
    snapped: hit.dialog.classList.contains("cb-docked") ? (hit.dialog.style.left === "0px" ? "left" : "right") : null,
  };
  console.log(
    `[CodBiDrag] SESSION START styleClass='${hit.styleClass}' start=(${e.clientX},${e.clientY}) origin=(${rect.left},${rect.top}) size=(${rect.width}x${rect.height})`,
  );
  e.preventDefault();
}

function onGlobalMouseMove(e: MouseEvent): void {
  const s = dragSession;
  if (!s) return;
  const viewportWidth = window.innerWidth;
  const left = s.originLeft + (e.clientX - s.startX);
  const top = s.originTop + (e.clientY - s.startY);

  // Dock to the left / right half of the window when the dialog is dragged onto an edge.
  let nextSnap: "left" | "right" | null = null;
  if (left <= SNAP_THRESHOLD) nextSnap = "left";
  else if (left + s.floatingWidth >= viewportWidth - SNAP_THRESHOLD) nextSnap = "right";

  s.dialog.style.position = "fixed";
  s.dialog.style.transform = "none";

  if (nextSnap) {
    s.snapped = nextSnap;
    s.dialog.classList.add("cb-docked");
    // Remember the floating size just before docking, so un-snapping restores it.
    if (!lastFloatingSizes.has(s.styleClass)) {
      lastFloatingSizes.set(s.styleClass, {
        width: Math.round(s.floatingWidth),
        height: Math.round(s.floatingHeight),
      });
    }
    s.dialog.style.width = "50vw";
    s.dialog.style.left = nextSnap === "left" ? "0px" : "50vw";
    s.dialog.style.top = "0px";
    s.dialog.style.height = "100vh";
    // Override the dialog's own max-height (e.g. "85vh") so the docked dialog fills the viewport.
    s.dialog.style.maxHeight = "100vh";
    console.log(`[CodBiDrag] DOCK ${nextSnap}`);
  } else {
    if (s.snapped) {
      s.snapped = null;
      s.dialog.classList.remove("cb-docked");
      s.dialog.style.width = `${Math.round(s.floatingWidth)}px`;
      s.dialog.style.height = `${Math.round(s.floatingHeight)}px`;
      s.dialog.style.maxHeight = s.originalMaxHeight;
      console.log("[CodBiDrag] UNDOCK");
    }
    s.dialog.style.left = `${Math.round(left)}px`;
    s.dialog.style.top = `${Math.round(top)}px`;
    console.log(`[CodBiDrag] move -> left=${Math.round(left)} top=${Math.round(top)}`);
  }
}

function onGlobalMouseUp(): void {
  const s = dragSession;
  if (!s) return;
  dragSession = null;
  const rect = s.dialog.getBoundingClientRect();
  const position: DialogPosition = {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    docked: s.snapped,
  };
  if (!s.snapped) {
    lastFloatingSizes.set(s.styleClass, { width: position.width, height: position.height });
  }
  // Re-enable the dialog's own CSS transitions (they were disabled while dragging).
  s.dialog.style.transition = "";
  const reg = dialogDragRegistry.get(s.styleClass);
  console.log(
    `[CodBiDrag] SESSION END styleClass='${s.styleClass}' final=(${position.left},${position.top}) size=(${position.width}x${position.height}) docked=${s.snapped} storageKey='${reg?.storageKey ?? s.styleClass}'`,
  );
  saveDialogPosition(reg?.storageKey ?? s.styleClass, position);
  reg?.onMoved?.(position);
}

// #region Position restore (without relying on PrimeNG's (onShow), which only fires after the open
// animation — animations are not enabled in this app, so (onShow) never runs).

let restoreObserverInstalled = false;
/** styleClasses for which the saved position has already been applied while visible. */
const restoredStyleClasses = new Set<string>();

/** Installs a MutationObserver that applies each registered dialog's saved position when it opens. */
function installGlobalPositionRestore(): void {
  if (restoreObserverInstalled) return;
  restoreObserverInstalled = true;
  const observer = new MutationObserver(() => restoreVisibleDialogPositions());
  observer.observe(document.body, { childList: true, subtree: true });
  // Also cover the case where a dialog is already open when the module loads.
  restoreVisibleDialogPositions();
}

/** Applies the saved position to every registered dialog that is currently visible (once per open). */
function restoreVisibleDialogPositions(): void {
  if (dragSession) return; // never fight an active drag
  const visibleNow = new Set<string>();
  for (const styleClass of dialogDragRegistry.keys()) {
    const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
    if (!el) continue;
    const mask = el.closest(".p-dialog-mask");
    const visible = mask ? getComputedStyle(mask).display !== "none" : false;
    if (!visible) continue;
    visibleNow.add(styleClass);
    if (!restoredStyleClasses.has(styleClass)) {
      const reg = dialogDragRegistry.get(styleClass);
      const pos = reg ? loadDialogPosition(reg.storageKey) : null;
      if (pos) {
        applyDialogPosition(styleClass, pos);
      }
      restoredStyleClasses.add(styleClass);
    }
  }
  // Keep the flag only for dialogs that are still visible, so a reopened dialog restores again.
  restoredStyleClasses.clear();
  for (const s of visibleNow) restoredStyleClasses.add(s);
}

// #endregion
