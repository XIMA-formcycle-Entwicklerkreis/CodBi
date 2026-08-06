/**
 * ## DE // Setzt ein Feld auf "true"/"false", abhängig davon, ob bestimmte
 *          Felder bestimmte Werte haben.
 *
 * Dieses Skript liest eine Liste von Quellfeldern (**SourceFields**) und eine
 * Liste erwarteter Werte (**ExpectedValues**) aus den formcycle-Globalvariablen.
 * Anschließend wird geprüft, ob die Quellfelder die erwarteten Werte enthalten.
 * Passt ein Selektor auf mehrere Elemente, werden **alle** passenden Elemente
 * gegen den zugehörigen erwarteten Wert geprüft. Je nach **MatchMode** müssen
 * entweder alle (Standard) oder mindestens eines der Felder übereinstimmen.
 * Trifft die Bedingung zu, wird das Zielfeld (**TargetField**) auf **TrueValue**
 * (Standard `"true"`) gesetzt, andernfalls auf **FalseValue** (Standard
 * `"false"`).
 *
 * Die Prüfung läuft beim Initialisieren des Skripts sowie bei jedem
 * `change`/`input` an den Quellfeldern, beim `ready`/`addRow`-Event des
 * Formulars und nach AJAX-Aufrufen. Zusätzlich kann über
 * **WatchSelectors** eine Liste weiterer Selektoren angegeben werden, deren
 * `change`/`input` ebenfalls eine Neuberechnung auslöst — es werden dabei
 * **alle** Elemente überwacht, die auf einen der Selektoren passen.
 *
 * ---
 *
 * ## EN // Sets a field to "true"/"false" depending on whether specified
 *          fields have specified values.
 *
 * This script reads a list of source fields (**SourceFields**) and a list of
 * expected values (**ExpectedValues**) from the formcycle global variables. It
 * then checks whether the source fields contain the expected values. If a
 * selector matches multiple elements, **all** matching elements are checked
 * against the corresponding expected value. Depending on **MatchMode** either
 * all (default) or at least one of the fields must match. If the condition is
 * met, the target field (**TargetField**) is set to **TrueValue** (default
 * `"true"`), otherwise to **FalseValue** (default `"false"`).
 *
 * The check runs on initialisation of the script as well as on every
 * `change`/`input` on the source fields, on the form's `ready`/`addRow` event
 * and after AJAX calls. Additionally, **WatchSelectors** can be used to
 * specify further selectors whose `change`/`input` also triggers a
 * recomputation — **all** elements matching one of these selectors are
 * watched.
 *
 * ---
 *
 * ### Global Variables (formcycle)
 *
 * | Variable | Purpose |
 * |---|---|
 * | `n12h_SetBooleanOnValues_TargetField` | CSS selector for the field that receives the true/false value. |
 * | `n12h_SetBooleanOnValues_SourceFields` | Comma-separated CSS selectors for the fields whose values are checked. Every element matching a selector is checked. |
 * | `n12h_SetBooleanOnValues_ExpectedValues` | Comma-separated expected values. All elements matching source selector at index *i* are compared with the expected value at index *i*. If fewer expected values than source fields are given, the surplus source fields are ignored. |
 * | `n12h_SetBooleanOnValues_MatchMode` | *(optional)* `"all"` (default) = every source must match; `"any"` = at least one source must match. |
 * | `n12h_SetBooleanOnValues_TrueValue` | *(optional)* Value written when the condition matches (default: `"true"`). |
 * | `n12h_SetBooleanOnValues_FalseValue` | *(optional)* Value written when the condition does not match (default: `"false"`). |
 * | `n12h_SetBooleanOnValues_Events` | *(optional)* Comma-separated event names watched on the source fields (default: `"change, input"`). |
 * | `n12h_SetBooleanOnValues_WatchSelectors` | *(optional)* Comma-separated CSS selectors. A `change`/`input` on **any** element matching one of these selectors triggers a re-evaluation, in addition to the source fields. All matching elements are watched. |
 * | `n12h_SetBooleanOnValues_States` | *(optional)* Comma-separated list of form states where the script runs (e.g. `"INIT, INWORK"`). If empty/not set, the script runs in all states. |
 *
 * ---
 *
 * ### Usage
 *
 * Include this script in your formcycle form (e.g. via **Eigene Skripte** or a
 * **JavaScript** form element). Set the global variables in formcycle's
 * **Globale Variablen** configuration.
 *
 * The script activates itself automatically.
 *
 * @example
 * // Global variables as configured in formcycle:
 * // n12h_SetBooleanOnValues_TargetField     → ".isCommercial"
 * // n12h_SetBooleanOnValues_SourceFields    → ".companyName, .vatId"
 * // n12h_SetBooleanOnValues_ExpectedValues  → "ABC GmbH, DE123456789"
 * // n12h_SetBooleanOnValues_MatchMode       → "any"
 * // n12h_SetBooleanOnValues_WatchSelectors  → ".orderType, .country"
 *
 * // Or set programmatically:
 * formcycle.global.set("n12h_SetBooleanOnValues_TargetField", ".isCommercial");
 * formcycle.global.set("n12h_SetBooleanOnValues_SourceFields", ".companyName, .vatId");
 * formcycle.global.set("n12h_SetBooleanOnValues_ExpectedValues", "ABC GmbH, DE123456789");
 * formcycle.global.set("n12h_SetBooleanOnValues_MatchMode", "any");
 * formcycle.global.set("n12h_SetBooleanOnValues_WatchSelectors", ".orderType, .country");
 */
(function () {
  "use strict";

  // #region Constants
  /** Maximum boot retry attempts before giving up. */
  var MAX_RETRIES = 20;
  /** Delay between boot retry attempts (ms). */
  var RETRY_MS = 500;
  /** Logging prefix — filterable in browser console. */
  var LOG_PREFIX = "[SetBooleanOnValues]";
  /** Default event names watched on the source fields. */
  var DEFAULT_EVENTS = "change, input";
  // #endregion Constants

  // #region Logging & State Check
  /** Logs a message to the console with a consistent prefix. */
  function log(msg) {
    if (typeof console !== "undefined") {
      console.log(LOG_PREFIX, msg);
    }
  }

  /**
   * Reads the current form status from `XFC_METADATA` (directly or from a
   * hidden field named `XFC_METADATA` as a fallback). Returns `null` when
   * unavailable. */
  function getFormStatus() {
    if (typeof XFC_METADATA !== "undefined" && XFC_METADATA.currentProcess) {
      return XFC_METADATA.currentProcess.status;
    }

    var metaEl = document.querySelector('[data-name="XFC_METADATA"]');

    if (metaEl) {
      try {
        var parsed = JSON.parse(metaEl.value);
        if (parsed.currentProcess && parsed.currentProcess.status) {
          return parsed.currentProcess.status;
        }
      } catch (e) {
        log("Fehler beim Parsen der XFC_METADATA: " + e.message);
      }
    }

    return null;
  }

  /**
   * Checks whether the script should run in the current form state. Reads
   * **n12h_SetBooleanOnValues_States** — if empty/not set the script runs in
   * all states; otherwise the current form status must appear in the
   * comma-separated list. */
  function shouldRun() {
    var statesVal = getGlobal("n12h_SetBooleanOnValues_States");

    if (!statesVal) return true;

    var formStatus = getFormStatus();

    if (formStatus === null) {
      log("States is set but cannot determine form status — running");
      return true;
    }

    var states = splitCSV(statesVal);

    for (var s = 0; s < states.length; s++) {
      if (states[s].trim().toUpperCase() === formStatus.toUpperCase()) {
        return true;
      }
    }

    return false;
  }
  // #endregion Logging & State Check

  // #region Helpers
  /**
   * Reads a formcycle global variable by querying the DOM for an element whose
   * `data-name` attribute matches the specified name, then returns its `value`
   * attribute. Returns `undefined` when the element is not found. */
  function getGlobal(name) {
    var el = document.querySelector('[data-name="' + name + '"]');

    if (el) return el.getAttribute("value");

    return undefined;
  }

  /**
   * Splits a comma-separated value string into an array of trimmed parts,
   * respecting parentheses and quotes so that commas inside `:is(.a, .b)` or
   * `[attr="val, ue"]` are not treated as separators. */
  function splitCSV(value) {
    var result = [];
    var current = "";
    var depth = 0;
    var inQuote = false;
    var quoteChar = null;

    for (var c = 0; c < value.length; c++) {
      var ch = value[c];

      if (inQuote) {
        current += ch;

        if (ch === quoteChar) inQuote = false;
      } else if (ch === "'" || ch === '"') {
        current += ch;
        inQuote = true;
        quoteChar = ch;
      } else if (ch === "(" || ch === "[" || ch === "{") {
        current += ch;
        depth++;
      } else if (ch === ")" || ch === "]" || ch === "}") {
        current += ch;
        depth--;
      } else if (ch === "," && depth === 0) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  }

  /**
   * Returns the comparable value of a form element. Checkboxes/radios return
   * `"true"`/`"false"` based on their checked state; everything else returns
   * its `value`. */
  function getFieldValue(el) {
    if (!el) return null;

    var tag = el.tagName ? el.tagName.toUpperCase() : "";
    var type = (el.type || "").toLowerCase();

    if (tag === "INPUT" && (type === "checkbox" || type === "radio")) {
      return el.checked ? "true" : "false";
    }

    return el.value == null ? "" : el.value;
  }

  /**
   * Writes a value into the target field. Checkboxes/radios get their `checked`
   * state set (value `"true"` means checked); all other elements get their
   * `value` assigned. Only when the value actually changes is a `change` event
   * dispatched afterwards so formcycle registers the new value — this also
   * prevents infinite loops if the target field is itself a source field. */
  function setFieldValue(el, value) {
    if (!el) return;

    var tag = el.tagName ? el.tagName.toUpperCase() : "";
    var type = (el.type || "").toLowerCase();
    var changed = false;

    if (tag === "INPUT" && (type === "checkbox" || type === "radio")) {
      var checked = String(value).toLowerCase() === "true";

      if (el.checked !== checked) {
        el.checked = checked;
        changed = true;
      }
    } else {
      var val = value == null ? "" : String(value);

      if (el.value !== val) {
        el.value = val;
        changed = true;
      }
    }

    if (!changed) return;

    if (typeof jQuery !== "undefined") {
      jQuery(el).trigger("change");
    } else if (typeof el.dispatchEvent === "function") {
      var evt;

      try {
        evt = new Event("change", { bubbles: true });
      } catch (e) {
        evt = document.createEvent("Event");
        evt.initEvent("change", true, false);
      }

      el.dispatchEvent(evt);
    }
  }

  /**
   * Evaluates whether the configured condition is met. Reads **SourceFields**
   * and **ExpectedValues** (paired 1:1 by index) and applies **MatchMode**
   * (`"all"` default or `"any"`). Every element matching a source selector is
   * checked against the expected value at that index. Source fields without a
   * corresponding expected value are ignored. */
  function conditionMet() {
    var sourcesCsv = getGlobal("n12h_SetBooleanOnValues_SourceFields");
    var expectedCsv = getGlobal("n12h_SetBooleanOnValues_ExpectedValues");
    var matchMode = (getGlobal("n12h_SetBooleanOnValues_MatchMode") || "all").trim().toLowerCase();

    if (!sourcesCsv) return false;

    var sources = splitCSV(sourcesCsv);
    var expected = expectedCsv ? splitCSV(expectedCsv) : [];

    var matched = 0;
    var total = 0;

    for (var i = 0; i < sources.length; i++) {
      if (i >= expected.length) continue;

      // #region Check every element matching this source selector.
      var srcEls = document.querySelectorAll(sources[i].trim());
      var wanted = expected[i];

      for (var j = 0; j < srcEls.length; j++) {
        total++;

        var actual = getFieldValue(srcEls[j]);
        var isMatch = actual != null && String(actual).trim() === String(wanted).trim();

        if (matchMode === "any") {
          if (isMatch) return true;
        } else if (isMatch) {
          matched++;
        }
      }
      // #endregion Check every element matching this source selector.
    }

    if (matchMode === "any") return false;

    return total > 0 && matched === total;
  }

  /**
   * Applies the current condition result to the target field: writes
   * **TrueValue** when the condition is met, otherwise **FalseValue**. */
  function applyValue(event) {
    if (!shouldRun()) return;

    var targetSelector = getGlobal("n12h_SetBooleanOnValues_TargetField");

    if (!targetSelector) return;

    var targetEl = document.querySelector(targetSelector);

    if (!targetEl) return;

    var trueValue = getGlobal("n12h_SetBooleanOnValues_TrueValue") || "true";
    var falseValue = getGlobal("n12h_SetBooleanOnValues_FalseValue") || "false";
    var value = conditionMet() ? trueValue : falseValue;

    setFieldValue(targetEl, value);
  }
  // #endregion Helpers

  // #region Initialization
  /**
   * Sets up a `MutationObserver` that re-runs the evaluation whenever nodes
   * are added to or removed from the form DOM. This covers repeatable
   * containers being added or removed (and any other DOM mutation) even when
   * formcycle does not fire a dedicated event. The re-scan is debounced to
   * avoid excessive calls during cloning. */
  function setupMutationObserver() {
    if (typeof MutationObserver === "undefined") return;

    var form = document.querySelector("FORM.xm-form") || document.body;
    var timer = null;

    var observer = new MutationObserver(function () {
      if (timer) return; // debounce rapid mutations into a single rescan

      timer = setTimeout(function () {
        timer = null;
        applyValue();
      }, 150);
    });

    observer.observe(form, { childList: true, subtree: true });
  }

  /**
   * Sets up the script once the DOM and the required global variables are
   * available.
   *
   * - Runs the initial evaluation.
   * - Listens for `change`/`input` on every element matching the source
   *   selectors and the optional watch selectors.
   * - Listens for `ready`/`addRow`/`removeRow` on the form so newly added or
   *   removed repeatable rows are handled correctly.
   * - Observes DOM mutations as a fallback for add/remove of repeatable
   *   containers.
   * - Re-checks after AJAX (form reload, data population). */
  function init() {
    var sourcesCsv = getGlobal("n12h_SetBooleanOnValues_SourceFields");
    var targetSelector = getGlobal("n12h_SetBooleanOnValues_TargetField");

    if (!sourcesCsv || !targetSelector) return;

    var sources = splitCSV(sourcesCsv);

    // #region Combine source selectors with watch selectors.
    // WatchSelectors: additional selectors whose changes (change/input) also
    // trigger a re-evaluation. Delegated listeners cover every current and
    // future element matching a selector.
    var watchSelectors = [];
    var watchCsv = getGlobal("n12h_SetBooleanOnValues_WatchSelectors");

    if (watchCsv) {
      watchSelectors = splitCSV(watchCsv);
    }

    var allSelectors = sources.concat(watchSelectors);
    // #endregion Combine source selectors with watch selectors.

    // #region Build the space-separated event list (e.g. "change input").
    var events = DEFAULT_EVENTS;
    var customEvents = getGlobal("n12h_SetBooleanOnValues_Events");

    if (customEvents) {
      var parts = splitCSV(customEvents);

      events = parts.join(" ");
    }
    // #endregion Build the space-separated event list (e.g. "change input").

    if (typeof jQuery !== "undefined") {
      // #region Listen for changes on every element matching a source or watch selector.
      for (var i = 0; i < allSelectors.length; i++) {
        jQuery(document).on(events, allSelectors[i].trim(), applyValue);
      }
      // #endregion Listen for changes on every element matching a source or watch selector.

      // #region Listen for form ready / repeatable rows added or removed.
      jQuery("FORM.xm-form").on("ready addRow removeRow", applyValue);
      // #endregion Listen for form ready / repeatable rows added or removed.

      // #region Re-check after AJAX (form reload, data population).
      jQuery(document).on("ajaxComplete", applyValue);
      // #endregion Re-check after AJAX (form reload, data population).
    }

    // #region Rescan when repeatable containers are added/removed (fallback).
    setupMutationObserver();
    // #endregion Rescan when repeatable containers are added/removed (fallback).

    // #region Run initial check.
    applyValue();
    // #endregion Run initial check.
  }
  // #endregion Initialization

  // #region Bootstrap
  /**
   * Attempts to initialise the script. If the required global variables are
   * readable, the listeners are attached and the initial state is evaluated.
   *
   * If globals are not yet available (formcycle may still be initialising),
   * the function retries up to {@link boot.MAX_RETRIES} times with a
   * {@link boot.RETRY_MS} delay between attempts. */
  function boot() {
    boot.MAX_RETRIES = 20;
    boot.RETRY_MS = 500;
    boot.attempt = (boot.attempt || 0) + 1;

    // #region Check if required globals are readable.
    var sourcesCsv = getGlobal("n12h_SetBooleanOnValues_SourceFields");
    var targetSelector = getGlobal("n12h_SetBooleanOnValues_TargetField");
    // #endregion Check if required globals are readable.

    if (sourcesCsv && targetSelector) init();
    else if (boot.attempt < boot.MAX_RETRIES) setTimeout(boot, boot.RETRY_MS);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  // #endregion Bootstrap
})();
