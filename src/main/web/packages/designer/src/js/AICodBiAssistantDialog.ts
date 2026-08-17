import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";

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

  const scriptSrc = `${resourceBase}cb-manager.js`;
  const cssSrc = `${resourceBase}cb-manager.css`;

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
function openAssistant(): void {
  // Remember this manual open — a strong signal that CodBi is enabled for the current form, used
  // by isCodBiEnabled() while the form-property model is stale right after an inference-driven
  // in-place form load.
  try {
    localStorage.setItem("codbi-assistant-last-opened", String(Date.now()));
  } catch {
    // ignore storage errors
  }

  // Already visible — just (re)dispatch so the prompt gets focus; never touch the mounted element
  // while the dialog is open.
  if (document.querySelector(".cb-ai-assistant-dialog")) {
    document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    return;
  }

  // Show a loading indicator (CodBi logo + animated ring) only after a short grace period and only
  // while the dialog is still missing, so a fast open (bundle already loaded) does not flash it.
  // It is removed as soon as the dialog appears, on click, or after a safety timeout.
  let indicatorShown = false;
  const watchStart = Date.now();

  const watchForDialog = (): void => {
    if (document.querySelector(".cb-ai-assistant-dialog")) {
      hideAssistantLoadingIndicator();
      return;
    }
    if (!indicatorShown && Date.now() - watchStart > 300) {
      indicatorShown = true;
      showAssistantLoadingIndicator();
    }
    if (Date.now() - watchStart > 15000) {
      hideAssistantLoadingIndicator();
      return;
    }
    setTimeout(watchForDialog, 150);
  };

  setTimeout(watchForDialog, 150);

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
    // silently swallows the open event. Give it a short window to respond; only if the dialog is
    // still not visible, re-mount a fresh element ONCE. A healthy host opens within ~250ms with the
    // fast poll above, so anything still invisible after 1200ms is treated as stale. Preferring the
    // existing host avoids destroying a healthy component on every reopen — that teardown/reboot
    // cycle used to race the drag coordinator's global registry and leave the dialog undraggable
    // (see the generation guard in dialog-position.ts).
    if (!freshMounted && Date.now() - startedAt > 1200) {
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
 * Shows a lightweight "assistant is loading" indicator (CodBi logo + animated ring) while the
 * Angular `cb-manager.js` bundle is still downloading / bootstrapping, so ALT+A gives immediate
 * visual feedback instead of a silent multi-second pause. Self-contained in the designer bundle
 * (plain DOM + a scoped <style>); it does NOT depend on cb-manager.js. It is removed as soon as the
 * assistant dialog appears, on click, or after a safety timeout (see openAssistant).
 */
function showAssistantLoadingIndicator(): void {
  hideAssistantLoadingIndicator();
  const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const styleId = "codbi-assistant-loading-style";

  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");

    style.id = styleId;
    style.textContent =
      ".codbi-assistant-loading{" +
      "position:fixed;inset:0;z-index:1900;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:18px;" +
      "background:rgba(255,255,255,.55);backdrop-filter:blur(1px);cursor:pointer}" +
      ".codbi-assistant-loading__ring{position:relative;width:104px;height:104px;" +
      "display:flex;align-items:center;justify-content:center}" +
      '.codbi-assistant-loading__ring::before{content:"";position:absolute;inset:0;' +
      "border-radius:50%;border:4px solid rgba(11,107,203,.18);border-top-color:#0b6bcb;" +
      "animation:codbi-assistant-spin 1s linear infinite}" +
      ".codbi-assistant-loading__logo{width:58px;height:58px;opacity:.95}" +
      ".codbi-assistant-loading__label{color:#374151;font:500 13px/1.4 " +
      'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;letter-spacing:.02em}' +
      "@keyframes codbi-assistant-spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
  }

  const host = document.createElement("div");

  host.id = "codbi-assistant-loading";
  host.className = "codbi-assistant-loading";
  host.title = "Click to dismiss";
  host.innerHTML =
    `<div class="codbi-assistant-loading__ring">` +
    `<img class="codbi-assistant-loading__logo" ` +
    `src="${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg" ` +
    `alt="CodBi" /></div>` +
    `<div class="codbi-assistant-loading__label">AI Form Assistant …</div>`;
  host.addEventListener("click", () => hideAssistantLoadingIndicator());
  document.body.appendChild(host);
}

/** Removes the assistant-loading indicator (no-op when it is not shown). */
function hideAssistantLoadingIndicator(): void {
  document.getElementById("codbi-assistant-loading")?.remove();
}

/** Whether the "CodBi" checkbox (`codbi-prop-enable`) is set for the currently edited form. */
function isCodBiEnabled(): boolean {
  const designer = getDesignerInstance();

  if (designer) {
    try {
      const value = designer.getFormPropertyValueForCurrentLang("codbi-prop-enable");
      if (value === "1" || value === 1 || value === true) {
        return true;
      }
    } catch {
      // fall through to the DOM checkbox check below
    }
  }
  // After an inference-driven form load (no page reload) the property model can be stale even
  // though the live "CodBi" checkbox is still checked — trust the checkbox in that case.
  const checkbox = document.querySelector<HTMLInputElement>("#form-codbi-prop-enable-input");

  if (checkbox && checkbox.checked === true) {
    return true;
  }
  // Neither the (possibly stale) property model nor a checked live checkbox confirm it — e.g. right
  // after an inference-driven in-place form load, when the checkbox may still show the pre-load
  // state. A manual ALT+A open within the last few minutes is a strong signal that CodBi is enabled
  // for the currently edited form.
  try {
    const lastOpened = Number(localStorage.getItem("codbi-assistant-last-opened") ?? "0");
    return lastOpened > 0 && Date.now() - lastOpened < 10 * 60 * 1000;
  } catch {
    return false;
  }
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
