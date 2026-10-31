import { getJQuery, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { codbiManagerCacheSuffix } from "./CodbiManagerBundle.js";

/**
 * Loads the `cb-manager.js` Angular bundle (which also defines `cb-ai-assistant`) and wires the
 * ALT+A hotkey to dispatch a `codbi:ai-assistant:open` event.
 *
 * The hotkey only opens the assistant when the "CodBi" checkbox (the
 * `codbi-prop-enable` form property) is enabled for the currently edited form.
 *
 * All dialog logic has been moved to the `AiAssistant` Angular component inside
 * the `codbi-apidoc` Angular project. The change log is now an inline side panel of that
 * assistant dialog (no separate `cb-ai-assistant-log` element is mounted anymore); the assistant
 * component itself handles the automatic popup when the last inference used sensitive elements
 * that are not marked as checked yet.
 */
export function enableAICodBiAssistantDialog(): void {
  const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const resourceBase = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/`;
  // Cache-bust the manager bundle with the plugin's build token (its URL carries no version, so a
  // rebuilt bundle would otherwise never replace the browser's cached copy).
  const cacheSuffix = codbiManagerCacheSuffix();

  const scriptSrc = `${resourceBase}cb-manager.js${cacheSuffix}`;
  const cssSrc = `${resourceBase}cb-manager.css${cacheSuffix}`;

  // Load cb-manager.js (defines both cb-manager and cb-ai-assistant)
  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement("script");

    script.src = scriptSrc;
    document.head.appendChild(script);
  }

  // Load shared styles
  if (!document.querySelector(`link[href="${cssSrc}"]`)) {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = cssSrc;
    document.head.appendChild(link);
  }

  // Mount the custom elements once. cb-ai-assistant is mounted here (and not only on demand) so
  // that its ngOnInit runs on every designer page load: after a workflow-triggered form reload it
  // re-opens the change-log side panel when the last inference used sensitive elements that are not
  // marked as checked yet (both via a pending localStorage value and by checking the database).
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  if (!document.querySelector("cb-prompt-manager")) {
    document.body.appendChild(document.createElement("cb-prompt-manager"));
  }

  // Phase-2d Mirror push listener (source-save hook): wrap the designer's server publish() so that
  // the instant a source form/workflow is saved and published, the backend is told to re-push the
  // latest source lane into every registered reflecting form. This is what makes a Mirror execute on
  // the FIRST run (the reflecting form's designer never has to be opened). Best-effort wrapper — it
  // must never break the designer's own save flow.
  installMirrorPushListener();

  // ALT+A => show the AI assistant (only when CodBi is enabled for the current form). The
  // assistant focuses the prompt textarea automatically on open.
  document.addEventListener("keyup", (event) => {
    if (event.altKey && event.key.toLowerCase() === "a" && isCodBiEnabled()) {
      openAssistant();
    }
  });
  // ALT+S (while ALT is still held, e.g. right after ALT+A) => activate the assistant's speech
  // input (only when CodBi is enabled for the current form).
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "s" && isCodBiEnabled()) {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:speech"));
    }
  });
  // ALT+T toggles the dialog transparency for all CodBi PrimeNG dialogs (opacity .25). Not
  // persisted — the dialogs are never transparent by default and the state resets on page load.
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "t") {
      event.preventDefault();
      setDialogTransparent(!isDialogTransparent());
    }
  });
  // Inject a small transparency switch into the header of every PrimeNG dialog, left of the close
  // button, so the user can toggle the .25 transparency with the mouse as well.
  installDialogTransparencySwitches();
  // PrimeNG v20 maximized-dialog quirk: in the maximized state the header-action buttons can
  // overlap, so a click meant for the close button or the transparency (eye) switch can land on the
  // maximize/restore button instead — unmaximizing the dialog on the FIRST click. Normalize this so
  // the first click on the close button closes the dialog and the first click on the eye toggles the
  // transparency, for every CodBi dialog.
  let normalizingMaximizedClose = false;
  document.addEventListener(
    "click",
    (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const dlg = target.closest(".p-dialog") as HTMLElement | null;
      if (!dlg || !dlg.classList.contains("p-dialog-maximized")) return;
      if (normalizingMaximizedClose) return;
      const isClose =
        target.closest('.p-dialog-close-button, [data-pc-name="dialog-close"], .p-dialog-header-close-icon') !== null;
      const isEye = target.closest(".cb-dialog-transparency-switch") !== null;
      if (!isClose && !isEye) return;
      event.stopPropagation();
      event.preventDefault();
      if (isClose) {
        // Close on this same click: unmaximize first (so the restore icon no longer covers the
        // close button), then click the close button once more to actually close the dialog.
        normalizingMaximizedClose = true;
        const maxBtn = dlg.querySelector<HTMLElement>(".p-dialog-maximize-button, .p-dialog-maximize-icon");
        if (dlg.classList.contains("p-dialog-maximized")) maxBtn?.click();
        setTimeout(() => {
          normalizingMaximizedClose = false;
          const closeBtn = dlg.querySelector<HTMLElement>(
            '.p-dialog-close-button, [data-pc-name="dialog-close"], .p-dialog-header-close-icon',
          );
          closeBtn?.click();
        }, 0);
      } else {
        setDialogTransparent(!isDialogTransparent());
      }
    },
    true,
  );
}

/**
 * Phase-2d Mirror push listener (source-save hook).
 *
 * Runs on every designer page load. When the currently edited form is a SOURCE of one or more
 * Mirror nodes, it wraps the designer's server-save (`publish()`) so that after a successful save
 * the backend's `MirrorPush` servlet action is called with the just-saved `workflowVersionId`; the
 * backend then re-pushes the latest source lane into every reflecting form immediately.
 *
 * This is the "listener" that makes a Mirror run correctly on the FIRST reflecting submit: a client
 * submit runs the frozen reflecting lane only until the source is saved+published, at which point
 * this hook fires the push and re-materializes the reflecting form's lane.
 *
 * It is strictly best-effort: if the designer/config/publish is unavailable it simply does nothing
 * and never alters the designer's own save flow (the original `publish` is always invoked with the
 * same receiver/arguments and its return value is passed through untouched).
 */
interface DesignerWithSave {
  config?: { workflowVersionId?: string | number };
  publish?: () => Promise<unknown>;
}

/**
 * @returns the designer instance, or `undefined` while it has not been created yet. The designer's
 * `instance()` **throws** until the form designer is fully initialized, so every access is guarded.
 */
function designerInstanceForMirrorHook(): DesignerWithSave | undefined {
  try {
    return getDesignerInstance() as unknown as DesignerWithSave | undefined;
  } catch {
    return undefined;
  }
}

function installMirrorPushListener(): void {
  const RETRY_DELAY_MS = 250;
  // ~60 s: designer.js is evaluated BEFORE the designer instance exists (it is injected into
  // <head>), so a single install attempt at script evaluation time always found `undefined` and
  // silently did nothing — the source-save push therefore never fired.
  const MAX_ATTEMPTS = 240;
  let attempts = 0;
  let installed = false;

  const tryInstall = (): void => {
    if (installed) {
      return;
    }
    attempts += 1;
    try {
      const designer = designerInstanceForMirrorHook();
      if (!designer || typeof designer.publish !== "function") {
        if (attempts < MAX_ATTEMPTS) {
          window.setTimeout(tryInstall, RETRY_DELAY_MS);
        }
        return;
      }
      installed = true;

      const publish = designer.publish;
      const $ = getJQuery();
      const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;

      // Coalesce rapid consecutive saves (e.g. auto-save + manual save) into a single push.
      let debounceHandle: number | undefined;
      const schedulePush = (): void => {
        if (debounceHandle) {
          window.clearTimeout(debounceHandle);
        }
        debounceHandle = window.setTimeout(() => {
          // Read the id at SAVE time: `config` may be filled (or replaced) after this hook was
          // installed, and the designer can switch forms without a page reload.
          const workflowVersionId = designer.config?.workflowVersionId;
          if (workflowVersionId === undefined || workflowVersionId === null || `${workflowVersionId}` === "") {
            return;
          }
          $.ajax({
            url: `${baseURL}plugin?name=CodBi_AICodBiAssistant`,
            type: "GET",
            headers: {
              "X-Action": "MirrorPush",
            },
            data: {
              workflowVersionId: String(workflowVersionId),
            },
            dataType: "json",
          }).fail(() => {
            /* fire-and-forget: the reflecting lazy re-sync still converges on the next submit */
          });
        }, 400);
      };

      const wrapped: typeof publish = function (this: unknown) {
        const result = publish.apply(this);
        if (result !== undefined && typeof (result as Promise<unknown>).then === "function") {
          (result as Promise<unknown>).then(schedulePush).catch(() => {});
        } else {
          schedulePush();
        }
        return result;
      };
      designer.publish = wrapped;
    } catch {
      // Best-effort — never break the designer's save flow.
      if (attempts < MAX_ATTEMPTS) {
        window.setTimeout(tryInstall, RETRY_DELAY_MS);
      }
    }
  };

  tryInstall();
}

/**
 * Opens the AI assistant.
 *
 * The designer re-renders its DOM when a form is loaded in-place (inference-driven form load
 * without a page reload) and can tear down the body-level `<cb-ai-assistant>` element. When it is
 * missing, a fresh element is mounted and the `codbi:ai-assistant:open` event is dispatched until
 * the PrimeNG dialog actually becomes visible — Angular's custom-element bootstrap is asynchronous,
 * so a single fixed-delay dispatch can be lost right after such a run.
 *
 * Also remembers the manual open so {@link isCodBiEnabled} can fall back to it while the
 * form-property model is stale (see below). */
/** True once the assistant dialog has been rendered on screen at least once in this session, which
 *  tells us the Angular `cb-ai-assistant` host is already bootstrapped and the models are loaded.
 *  On such reopens the dialog opens fast, so the full-screen loading overlay is never needed. */
let assistantOpenedOnce = false;

function openAssistant(): void {
  // Already visible — just (re)dispatch so the prompt gets focus; never touch the mounted element
  // while the dialog is open.
  if (document.querySelector(".cb-ai-assistant-dialog")) {
    document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    return;
  }

  // Show a loading indicator (CodBi logo + animated ring) only after a longer grace period and only
  // while the dialog is still missing, so a fast / moderately slow open (bundle already loaded) never
  // flashes it. It is removed (with a short fade-out) as soon as the dialog is actually on screen, on
  // click, or after a safety timeout.
  let indicatorShown = false;
  const watchStart = Date.now();

  /** True once the assistant dialog is actually on screen (element rendered and mask not display:none). */
  const assistantDialogVisible = (): boolean => {
    const el = document.querySelector<HTMLElement>(".cb-ai-assistant-dialog");
    if (!el) return false;
    const mask = el.closest(".p-dialog-mask") as HTMLElement | null;
    if (mask && getComputedStyle(mask).display === "none") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const watchForDialog = (): void => {
    if (assistantDialogVisible()) {
      assistantOpenedOnce = true;
      hideAssistantLoadingIndicator();
      return;
    }
    if (!indicatorShown && Date.now() - watchStart > 1000) {
      indicatorShown = true;
      showAssistantLoadingIndicator();
    }
    if (Date.now() - watchStart > 15000) {
      hideAssistantLoadingIndicator();
      return;
    }
    setTimeout(watchForDialog, 150);
  };

  // Only show the full-screen loading overlay during the very first bootstrap (cb-manager.js still
  // downloading / Angular host not yet rendered). On reopens of an already-loaded host the dialog
  // appears immediately and the overlay would just linger for seconds over a fast open — so skip it.
  // Hide any leftover overlay regardless, then start the watcher only when the host has not yet
  // proven itself (a fresh page or the designer re-mounted the element).
  if (!assistantOpenedOnce) {
    hideAssistantLoadingIndicator();
    setTimeout(watchForDialog, 150);
  } else {
    hideAssistantLoadingIndicator();
  }

  // Angular's custom-element bootstrap is asynchronous — poll until the dialog is visible (capped
  // at 4s), dispatching the open event only while it is not. The first dispatch happens right away
  // and the poll ticks fast (~120ms) so the dialog opens within a single tick once the Angular
  // listener is registered. Re-dispatches while the dialog is already opening are harmless because
  // AiAssistant.open() ignores re-entry (visible is already true).
  const startedAt = Date.now();
  let lastDispatch = 0;
  let freshMounted = false;

  const tryOpen = (): void => {
    if (document.querySelector(".cb-ai-assistant-dialog") || Date.now() - startedAt > 4000) {
      return;
    }
    if (document.querySelector("cb-ai-assistant") && Date.now() - lastDispatch > 120) {
      lastDispatch = Date.now();
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    }
    // A stale host (its Angular component was destroyed by an inference-driven in-place form load)
    // silently swallows the open event. Give it a generous window to respond; only if the dialog is
    // still not visible do we re-mount a fresh element ONCE. A healthy host opens within ~250ms with
    // the fast poll above, so a host still invisible after the grace is treated as stale.
    if (!freshMounted && Date.now() - startedAt > 3000) {
      freshMounted = true;
      const stale = document.querySelector("cb-ai-assistant");

      if (stale) {
        stale.remove();
      }
      document.body.appendChild(document.createElement("cb-ai-assistant"));
    }
    setTimeout(tryOpen, 120);
  };

  // Try the existing (possibly live) host first; only create one when none is mounted.
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  // Dispatch once immediately so a ready listener opens the dialog with no artificial delay.
  tryOpen();
}

/**
 * Localized texts for the assistant-loading overlay (title + click-to-dismiss line), following the
 * Formcycle UI language via `XFC_METADATA.currentLanguage` (fallback English).
 */
function assistantLoadingTexts(): { title: string; dismiss: string; dismissTitle: string } {
  const lang = (window as unknown as { XFC_METADATA?: { currentLanguage?: string } })?.XFC_METADATA?.currentLanguage;
  switch (lang) {
    case "de":
      return { title: "Formular-Assistent", dismiss: "zum Schließen klicken", dismissTitle: "Zum Schließen klicken" };
    case "it":
      return { title: "Assistente Modulo", dismiss: "clicca per chiudere", dismissTitle: "Clicca per chiudere" };
    case "nl":
      return { title: "Formulierassistent", dismiss: "klik om te sluiten", dismissTitle: "Klik om te sluiten" };
    default:
      return { title: "Form Assistant", dismiss: "click to dismiss", dismissTitle: "Click to dismiss" };
  }
}

/**
 * Shows a lightweight "assistant is loading" indicator (CodBi logo + animated ring) while the
 * Angular `cb-manager.js` bundle is still downloading / bootstrapping, so ALT+A gives immediate
 * visual feedback instead of a silent multi-second pause. Self-contained in the designer bundle
 * (plain DOM + a scoped <style>); it does NOT depend on cb-manager.js. It is removed (with a short
 * fade-out) as soon as the assistant dialog is actually on screen, on click, or after a safety
 * timeout (see openAssistant).
 */
function showAssistantLoadingIndicator(): void {
  // Instantly remove any previous indicator (no fade — the new overlay replaces it right away).
  document.getElementById("codbi-assistant-loading")?.remove();
  const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const styleId = "codbi-assistant-loading-style";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;
    style.textContent =
      ".codbi-assistant-loading{" +
      "position:fixed;inset:0;z-index:1900;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:14px;" +
      "background:rgba(255,255,255,.55);backdrop-filter:blur(1px);cursor:pointer;" +
      "opacity:0;animation:codbi-assistant-fade-in .3s ease-out forwards}" +
      ".codbi-assistant-loading__ring{position:relative;width:104px;height:104px;" +
      "display:flex;align-items:center;justify-content:center}" +
      // The ring is a rotating darkorange ARC ("slash"), not a full circle: only the top segment of
      // the border is colored, the rest stays transparent, so a darkorange slash spins around the logo.
      '.codbi-assistant-loading__ring::before{content:"";position:absolute;inset:0;' +
      "border-radius:50%;border:4px solid transparent;border-top-color:darkorange;" +
      "animation:codbi-assistant-spin 1s linear infinite}" +
      ".codbi-assistant-loading__logo{width:58px;height:58px;opacity:.95}" +
      // "FORM ASSISTANT": uppercase, monospace (technical) — no serif/humanist UI font.
      ".codbi-assistant-loading__label{color:#374151;font-weight:600;font-size:13px;line-height:1.4;" +
      "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;" +
      "letter-spacing:.04em;text-transform:uppercase}" +
      ".codbi-assistant-loading__dismiss{font:400 11px/1.4 " +
      'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.03em;' +
      "animation:codbi-assistant-rainbow 1.1s linear infinite}" +
      ".codbi-assistant-loading--hiding{opacity:1;" +
      "animation:codbi-assistant-fade-out .25s ease-in forwards}" +
      "@keyframes codbi-assistant-spin{to{transform:rotate(360deg)}}" +
      "@keyframes codbi-assistant-fade-in{to{opacity:1}}" +
      "@keyframes codbi-assistant-fade-out{to{opacity:0}}" +
      // "< click to dismiss >" cycles through the rainbow colors while the overlay is shown.
      "@keyframes codbi-assistant-rainbow{0%{color:#ef4444}14%{color:#f97316}" +
      "28%{color:#eab308}43%{color:#22c55e}57%{color:#3b82f6}71%{color:#8b5cf6}" +
      "86%{color:#ec4899}100%{color:#ef4444}}";
    document.head.appendChild(style);
  }

  const host = document.createElement("div");

  host.id = "codbi-assistant-loading";
  host.className = "codbi-assistant-loading";
  host.innerHTML =
    `<div class="codbi-assistant-loading__ring">` +
    `<img class="codbi-assistant-loading__logo" ` +
    `src="${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg" ` +
    `alt="CodBi" /></div>` +
    `<div class="codbi-assistant-loading__label"></div>` +
    `<div class="codbi-assistant-loading__dismiss"></div>`;
  // Fill the localized texts via textContent (avoids HTML-escaping the "< … >" brackets).
  const texts = assistantLoadingTexts();
  const labelEl = host.querySelector<HTMLElement>(".codbi-assistant-loading__label");
  if (labelEl) labelEl.textContent = texts.title;
  const dismissEl = host.querySelector<HTMLElement>(".codbi-assistant-loading__dismiss");
  if (dismissEl) dismissEl.textContent = `< ${texts.dismiss} >`;
  host.title = texts.dismissTitle;
  host.addEventListener("click", () => hideAssistantLoadingIndicator());
  document.body.appendChild(host);
}

/**
 * Removes the assistant-loading indicator with a short fade-out (no-op when it is not shown or
 * already fading). The full-screen overlay stays in place for the ~220ms it takes to fade, so the
 * removal never looks like an abrupt "pop".
 */
function hideAssistantLoadingIndicator(): void {
  const host = document.getElementById("codbi-assistant-loading");
  if (!host || host.classList.contains("codbi-assistant-loading--hiding")) return;
  host.classList.add("codbi-assistant-loading--hiding");
  setTimeout(() => host.remove(), 220);
}

/**
 * Whether the "CodBi" checkbox (`codbi-prop-enable`) is set for the currently edited form.
 *
 * Order of the two AUTHORITATIVE sources (never a "remembered" open): the live checkbox in the form
 * properties first — it also covers the case where the property model is stale right after an
 * inference-driven in-place form load — and then the designer's property model.
 *
 * The previous implementation had a third fallback: "a manual ALT+A open within the last 10 minutes
 * counts as enabled" (localStorage `codbi-assistant-last-opened`). Because {@link openAssistant}
 * writes that value on EVERY open, the first ALT+A enabled the hotkey for the next 10 minutes, so
 * ALT+A kept opening the assistant on forms where CodBi is DISABLED. It is therefore gone: when
 * neither source confirms the checkbox, the assistant stays closed.
 */
function isCodBiEnabled(): boolean {
  // The live checkbox is the most reliable signal (it is what the user sees and toggles).
  const checkbox = document.querySelector<HTMLInputElement>("#form-codbi-prop-enable-input");

  if (checkbox) {
    return checkbox.checked === true;
  }
  const designer = getDesignerInstance();

  if (designer) {
    try {
      const value = designer.getFormPropertyValueForCurrentLang("codbi-prop-enable");
      return value === "1" || value === 1 || value === true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Whether the global dialog-transparency mode is currently active. */
function isDialogTransparent(): boolean {
  return document.body.classList.contains("cb-dialog-transparent");
}

/** Turns dialog transparency on/off for all CodBi PrimeNG dialogs (opacity .25). Not persisted. */
function setDialogTransparent(on: boolean): void {
  document.body.classList.toggle("cb-dialog-transparent", on);
  // Keep every injected switch's icon in sync with the current state.
  document.querySelectorAll<HTMLElement>(".cb-dialog-transparency-switch i").forEach((icon) => {
    const want = on ? "pi-eye-slash" : "pi-eye";
    const have = on ? "pi-eye" : "pi-eye-slash";
    if (icon.classList.contains(have)) icon.classList.remove(have);
    if (!icon.classList.contains(want)) icon.classList.add(want);
  });
}

/**
 * Injects a small transparency switch (checkbox) into the header of every PrimeNG dialog, placed
 * left of the dialog's close button. The local API doc manager is NOT a PrimeNG dialog (custom
 * divs), so it is automatically excluded. A MutationObserver keeps the switches in sync when
 * PrimeNG mounts/unmounts dialogs dynamically.
 */
function installDialogTransparencySwitches(): void {
  const ensureSwitch = (dialog: HTMLElement): void => {
    if (dialog.querySelector(".cb-dialog-transparency-switch")) return;
    const actions = dialog.querySelector<HTMLElement>(".p-dialog-header-actions");
    const closeBtn = dialog.querySelector<HTMLElement>('[data-pc-name="dialog-close"]');
    // The switch must sit grouped with the close button on the RIGHT side of the header — insert it
    // as the first element of the PrimeNG header-actions container (or right before the close
    // button when that container is absent), never in the middle of the header.
    const host = actions ?? closeBtn?.parentElement;
    if (!host) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cb-dialog-transparency-switch";
    btn.title = "Toggle dialog transparency (.25) — shortcut ALT+T";
    btn.setAttribute("aria-label", "Toggle dialog transparency");
    btn.addEventListener("click", () => setDialogTransparent(!isDialogTransparent()));
    const icon = document.createElement("i");
    icon.className = "pi " + (isDialogTransparent() ? "pi-eye-slash" : "pi-eye");
    btn.appendChild(icon);
    host.insertBefore(btn, actions ? host.firstChild : (closeBtn ?? null));
  };
  const scan = (): void => {
    document.querySelectorAll<HTMLElement>(".p-dialog").forEach(ensureSwitch);
  };
  scan();
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
}
