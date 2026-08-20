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
  if (!position) {
    console.log(`[CodBiPos] apply '${styleClass}' called with NO saved position`);
    return;
  }
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) {
    console.log(`[CodBiPos] apply '${styleClass}' element NOT found`);
    return;
  }
  // Maximized dialogs intentionally fill the viewport — never apply a saved floating position/size
  // to them (clampRenderedToViewport and the drag coordinator skip maximized dialogs too).
  if (el.classList.contains("p-dialog-maximized")) {
    console.log(`[CodBiPos] apply '${styleClass}' SKIPPED (maximized)`);
    return;
  }
  el.style.position = "fixed";
  el.style.transform = "none";
  console.log(
    `[CodBiPos] apply '${styleClass}' saved=(${Math.round(position.left)},${Math.round(position.top)} ${typeof position.width === "number" ? Math.round(position.width) : "?"}x${typeof position.height === "number" ? Math.round(position.height) : "?"}) docked=${position.docked ?? "no"}`,
  );
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
          width: Math.max(minFloatingWidth(el), Math.round(rect.width)),
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
    const clamped = clampFloatingPosition(position);
    if (typeof clamped.width === "number") el.style.width = `${clamped.width}px`;
    if (typeof clamped.height === "number") el.style.height = `${clamped.height}px`;
    // Cap a CSS-driven size that still exceeds the usable viewport. The inline max-* overrides the
    // stylesheet's max-width/max-height (e.g. a JS-expanded assistant dialog on a small window).
    const rect = el.getBoundingClientRect();
    const maxW = Math.max(0, window.innerWidth - 2 * VIEWPORT_MARGIN);
    const maxH = Math.max(0, window.innerHeight - 2 * VIEWPORT_MARGIN);
    if (rect.width > maxW) {
      el.style.width = `${maxW}px`;
      el.style.maxWidth = `${maxW}px`;
    }
    if (rect.height > maxH) {
      el.style.height = `${maxH}px`;
      el.style.maxHeight = `${maxH}px`;
    }
    const finalRect = el.getBoundingClientRect();
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(clamped.left, window.innerWidth - finalRect.width - VIEWPORT_MARGIN),
    );
    const top = Math.max(
      VIEWPORT_MARGIN,
      Math.min(clamped.top, window.innerHeight - finalRect.height - VIEWPORT_MARGIN),
    );
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }
  console.log(
    `[CodBiPos] apply '${styleClass}' -> left=${el.style.left} top=${el.style.top} width=${el.style.width} height=${el.style.height} maximized=${el.classList.contains("p-dialog-maximized")}`,
  );
  // Re-check shortly after so the FINAL laid-out dialog is never off-screen: a stale/off-screen
  // saved position, a window resize, or a size change that happens between this apply and the actual
  // render could otherwise leave the header above the viewport or the right edge cut off.
  setTimeout(() => clampRenderedToViewport(styleClass), 80);
}

/** Ensures a rendered dialog stays fully inside the viewport (skips docked dialogs). Re-measures
 *  the final laid-out rect, so it works even when the apply ran before the dialog was rendered. */
export function clampRenderedToViewport(styleClass: string): void {
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) return;
  // Neutralize any scale/translate transform (e.g. the Formcycle designer's zoom) that would offset
  // a `position:fixed` dialog relative to the viewport. This must run for docked and maximized
  // dialogs too — otherwise a zoom transform scales them about their center and pushes the header
  // off-screen (e.g. a docked dialog at left:0 renders at a negative left/top).
  el.style.transform = "none";
  if (el.classList.contains("cb-docked")) return; // docked dialogs intentionally fill a half / full viewport
  if (el.classList.contains("p-dialog-maximized")) return; // maximized dialogs fill the viewport on purpose
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return; // not rendered yet
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.max(0, vw - 2 * VIEWPORT_MARGIN);
  const maxH = Math.max(0, vh - 2 * VIEWPORT_MARGIN);
  if (rect.width > maxW) {
    el.style.width = `${maxW}px`;
    el.style.maxWidth = `${maxW}px`;
  }
  if (rect.height > maxH) {
    el.style.height = `${maxH}px`;
    el.style.maxHeight = `${maxH}px`;
  }
  const finalRect = el.getBoundingClientRect();
  const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, vw - finalRect.width - VIEWPORT_MARGIN));
  const top = Math.max(VIEWPORT_MARGIN, Math.min(rect.top, vh - finalRect.height - VIEWPORT_MARGIN));
  console.log(
    `[CodBiPos] clamp '${styleClass}' rect=(${Math.round(rect.left)},${Math.round(rect.top)} ${Math.round(rect.width)}x${Math.round(rect.height)}) vw=${vw} vh=${vh} transform=${el.style.transform || "none"} -> left=${Math.round(left)} top=${Math.round(top)}`,
  );
  el.style.position = "fixed";
  el.style.transform = "none";
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
}

/** Reads the current viewport position of the `.p-dialog` element identified by its `styleClass`.
 *  Includes the rendered size so a saved position always has width/height — a saved position
 *  without dimensions would make `clampFloatingPosition` treat the size as 0 and misplace the
 *  dialog past the viewport edge on restore. */
export function readDialogPosition(styleClass: string): DialogPosition | null {
  const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

/** Small margin kept between a floating dialog and the viewport edges (px). */
const VIEWPORT_MARGIN = 8;

/**
 * Clamps a FLOATING (un-docked) dialog position so the dialog stays fully inside the viewport:
 * `left`/`top` never push it off screen and `width`/`height` never exceed the usable viewport.
 * Docked positions (`docked: "left" | "right"`) are intentionally returned unchanged — a docked
 * dialog fills half the window / full height by design.
 */
function clampFloatingPosition(position: DialogPosition): DialogPosition {
  const usableW = Math.max(0, window.innerWidth - 2 * VIEWPORT_MARGIN);
  const usableH = Math.max(0, window.innerHeight - 2 * VIEWPORT_MARGIN);
  let { left, top, width, height } = position;
  if (typeof width === "number") width = Math.min(width, usableW);
  if (typeof height === "number") height = Math.min(height, usableH);
  const w = typeof width === "number" ? width : 0;
  const h = typeof height === "number" ? height : 0;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - w - VIEWPORT_MARGIN));
  top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - h - VIEWPORT_MARGIN));
  return {
    left,
    top,
    ...(typeof width === "number" ? { width } : {}),
    ...(typeof height === "number" ? { height } : {}),
    docked: position.docked,
  };
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
  installViewportGuard();
  // The registry is shared globally and keyed only by styleClass, but the <cb-ai-assistant> /
  // <cb-prompt-manager> hosts can be destroyed and re-bootstrapped in place (e.g. the ALT+A
  // re-mount). Angular may run the OLD host's ngOnDestroy cleanup AFTER the NEW host's ngOnInit
  // re-registered — a bare delete() would then remove the NEW registration and leave the registry
  // empty, so the header still shows the move cursor but no drag session starts. Guarding by an
  // incrementing generation makes the cleanup a no-op once a newer registration exists.
  const generation = (dialogDragRegistry.get(styleClass)?.generation ?? 0) + 1;
  dialogDragRegistry.set(styleClass, { storageKey, onMoved, generation });
  console.log(
    `[CodBiDrag] registered '${styleClass}' -> '${storageKey}' (gen ${generation}, total ${dialogDragRegistry.size})`,
  );
  return () => {
    const current = dialogDragRegistry.get(styleClass);
    if (current && current.generation === generation) {
      console.log(`[CodBiDrag] unregister '${styleClass}' (gen ${generation})`);
      dialogDragRegistry.delete(styleClass);
    } else {
      console.log(
        `[CodBiDrag] skip unregister '${styleClass}': superseded by newer registration (current gen ${current?.generation}, own ${generation})`,
      );
    }
  };
}

interface DialogDragRegistration {
  storageKey: string;
  onMoved?: (position: DialogPosition) => void;
  /** Monotonic id so a re-created dialog's registration is never removed by a stale cleanup of a
   *  destroyed host (see the generation guard in enableDialogDrag). */
  generation: number;
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

/** Minimum floating width a dialog may restore to on un-snap. The prompt manager is much wider —
 *  its minimum is triple the shared minimum. */
function minFloatingWidth(dialog: HTMLElement): number {
  return dialog.classList.contains("cb-prompt-manager-dialog") ? 1440 : 480;
}

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
  // The clarification popup uses a custom header (.cb-ai-clarification-header) inside the dialog
  // body instead of PrimeNG's .p-dialog-header, so treat it as a move-drag handle as well.
  const header = el.closest(".p-dialog-header, .cb-ai-clarification-header") as HTMLElement | null;
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
  // Never start a drag (or an un-dock of a snapped dialog) from the header action buttons. PrimeNG
  // v20 renders these as .p-dialog-maximize-button / .p-dialog-close-button (the old
  // .p-dialog-maximize-icon / .p-dialog-header-close-icon classes no longer exist) plus the injected
  // .cb-dialog-transparency-switch — match all of them so clicking close on a snapped/docked dialog
  // closes it on the FIRST click instead of starting an un-dock drag.
  if (
    target?.closest(
      ".p-dialog-header-icon, .p-dialog-maximize-icon, .p-dialog-header-close-icon, " +
        ".p-dialog-maximize-button, .p-dialog-close-button, .cb-dialog-transparency-switch",
    )
  ) {
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
      const w = Math.min(window.innerWidth - 20, Math.max(minFloatingWidth(hit.dialog), last.width));
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
  const viewportHeight = window.innerHeight;
  const rect = s.dialog.getBoundingClientRect();
  // Keep the dialog fully inside the viewport while dragging: never let left/top push it off screen.
  let left = s.originLeft + (e.clientX - s.startX);
  let top = s.originTop + (e.clientY - s.startY);
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - rect.width - VIEWPORT_MARGIN));
  top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - rect.height - VIEWPORT_MARGIN));

  // Dock to the left / right half of the window when the dialog is dragged onto an edge.
  let nextSnap: "left" | "right" | null = null;
  if (left <= SNAP_THRESHOLD) nextSnap = "left";
  else if (left + rect.width >= viewportWidth - SNAP_THRESHOLD) nextSnap = "right";

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
  const raw: DialogPosition = {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    docked: s.snapped,
  };
  // Only clamp floating positions — a docked dialog intentionally sits at the edge / fills the half.
  const position = s.snapped ? raw : clampFloatingPosition(raw);
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
/** Last observed visibility of each registered dialog, so a saved position is restored only on a
 *  real hidden→visible transition (once per open) instead of on every DOM mutation while open. The
 *  old "restored set" approach cleared on every MutationObserver callback, so a transient "not yet
 *  visible" frame could re-apply a stale/off-screen saved position right after the dialog had been
 *  clamped back into the viewport — leaving the dialog out of view (and making ALT+A look like it
 *  needs two presses). */
const lastVisibleState = new Map<string, boolean>();

/** Installs a MutationObserver that applies each registered dialog's saved position when it opens. */
function installGlobalPositionRestore(): void {
  if (restoreObserverInstalled) return;
  restoreObserverInstalled = true;
  const observer = new MutationObserver(() => restoreVisibleDialogPositions());
  observer.observe(document.body, { childList: true, subtree: true });
  // Also cover the case where a dialog is already open when the module loads.
  restoreVisibleDialogPositions();
}

let viewportGuardInstalled = false;

/**
 * Installs a global guard (once per page) that makes it impossible for a registered dialog to end
 * up — or stay — outside the viewport: while any registered dialog is visible it is re-clamped
 * periodically and immediately on every window resize. Active drags and intentionally full-viewport
 * states (maximized / docked) are skipped (see clampRenderedToViewport). This is the safety net on
 * top of the clamps inside applyDialogPosition and the drag handling, covering races where a
 * PrimeNG re-render or a position restore could otherwise leave the header unreachable.
 */
function installViewportGuard(): void {
  if (viewportGuardInstalled) return;
  viewportGuardInstalled = true;
  console.log("[CodBiPos] viewport guard installed (periodic re-clamp + resize)");
  const guard = (): void => {
    if (dragSession) return; // never fight an active drag
    for (const styleClass of dialogDragRegistry.keys()) {
      const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
      if (!el) continue;
      const mask = el.closest(".p-dialog-mask") as HTMLElement | null;
      const visible = mask ? getComputedStyle(mask).display !== "none" : false;
      if (visible) {
        clampRenderedToViewport(styleClass);
      }
    }
  };
  window.addEventListener("resize", guard);
  const tick = (): void => {
    guard();
    window.setTimeout(tick, 600);
  };
  window.setTimeout(tick, 600);
}

/** Applies the saved position to every registered dialog that just became visible (once per open). */
function restoreVisibleDialogPositions(): void {
  if (dragSession) return; // never fight an active drag
  for (const styleClass of dialogDragRegistry.keys()) {
    const el = document.querySelector(`.${styleClass}`) as HTMLElement | null;
    if (!el) {
      // Dialog is not in the DOM (closed → PrimeNG removed its mask/dialog). Remember it as hidden
      // so the next open counts as a real hidden→visible transition and the saved position/size is
      // restored again. Without this, the stale "visible" flag from the previous open suppresses
      // the restore on every reopen (open → close → reopen would lose position and size).
      lastVisibleState.set(styleClass, false);
      continue;
    }
    const mask = el.closest(".p-dialog-mask");
    const visible = mask ? getComputedStyle(mask).display !== "none" : false;
    const wasVisible = lastVisibleState.get(styleClass) ?? false;
    lastVisibleState.set(styleClass, visible);
    if (visible && !wasVisible) {
      const reg = dialogDragRegistry.get(styleClass);
      const pos = reg ? loadDialogPosition(reg.storageKey) : null;
      console.log(`[CodBiPos] '${styleClass}' became visible; saved=${JSON.stringify(pos)}`);
      if (pos) {
        applyDialogPosition(styleClass, pos);
      }
    }
  }
}

// #endregion
