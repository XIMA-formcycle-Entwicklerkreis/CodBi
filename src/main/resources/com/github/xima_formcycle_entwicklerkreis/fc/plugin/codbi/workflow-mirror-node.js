// #region CodBi workflow Mirror node — source form + workflow path picker
//
// The properties view renders two native <select> elements and a preview container inside
// `[data-codbi-mirror-node]`. Forms and workflow paths are loaded from the existing
// `CodBi_Mirror` servlet action (`action=forms`, `action=paths`, `action=pathtree`). Selecting a
// form/path writes the values into hidden (but normally submitted) text inputs and invokes the
// node's remote command, which persists the configuration.
(() => {
  const ROOT_SELECTOR = "[data-codbi-mirror-node]";
  const FORM_SELECT_SELECTOR = "[data-codbi-mirror-form]";
  const PATH_SELECT_SELECTOR = "[data-codbi-mirror-path]";
  const PREVIEW_SELECTOR = "[data-codbi-mirror-preview]";
  const PLACEHOLDER_SELECTOR = "[data-codbi-mirror-placeholder]";
  const SYNC_SELECTOR = "[data-codbi-mirror-sync]";
  const SYNC_RESULT_SELECTOR = "[data-codbi-mirror-sync-result]";
  const NAME_INPUT_SELECTOR = 'input[id$=":actionName:actionName:input"]';
  const PLUGIN_ACTION = "CodBi_Mirror";

  const initialized = new WeakSet();
  let ajaxBound = false;
  let observerInstalled = false;

  /**
   * Reads a localized message from a `data-msg-*` attribute.
   *
   * An unresolved JSF message renders as `???key???` (FORMCYCLE's marker for a missing bundle
   * entry), so such a value is treated as MISSING and the built-in fallback is used instead. Without
   * this a translation that is missing from ONE language bundle leaked that marker into the UI.
   */
  function message(root, name, fallback) {
    const raw = String(root.getAttribute(`data-${name}`) || "").trim();
    const missing = raw === "" || (raw.startsWith("???") && raw.endsWith("???"));
    return missing ? String(fallback || "") : raw;
  }

  function baseUrl(root) {
    const contextPath = String(root.getAttribute("data-context-path") || "").replace(/\/$/, "");
    return `${contextPath}/plugin?name=${encodeURIComponent(PLUGIN_ACTION)}`;
  }

  function inputFor(root, idAttribute, classSelector) {
    const id = String(root.getAttribute(idAttribute) || "");
    if (id) {
      const byId = document.getElementById(id);
      if (byId) {
        return byId;
      }
    }
    return document.querySelector(classSelector);
  }

  function setInput(root, idAttribute, classSelector, value) {
    const input = inputFor(root, idAttribute, classSelector);
    if (input) {
      input.value = value == null ? "" : String(value);
    }
  }

  function addOption(select, value, label) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
    return option;
  }

  function invokeStore(root) {
    try {
      if (typeof window.codbiMirrorStore === "function") {
        window.codbiMirrorStore();
        return;
      }
      const formInput = inputFor(root, "data-input-form-id", ".codbi-mirror-source-form");
      if (formInput) {
        if (window.jQuery) {
          window.jQuery(formInput).trigger("change");
        } else {
          formInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    } catch (error) {
      console.error("[CodBi][MirrorNode] could not store the selection", error);
    }
  }

  function updatePlaceholder(nodeName) {
    const code = document.querySelector(PLACEHOLDER_SELECTOR);
    if (!code) {
      return;
    }
    const name = String(nodeName == null ? "" : nodeName);
    code.textContent = name.trim() ? `[%$${name}.RESULT.value%]` : "\u2014";
  }

  function syncPlaceholder() {
    const input = document.querySelector(NAME_INPUT_SELECTOR);
    const code = document.querySelector(PLACEHOLDER_SELECTOR);
    if (!code) {
      return;
    }
    updatePlaceholder(input ? input.value : code.getAttribute("data-node-name") || "");
  }

  /**
   * Renders the selected path as a small FLOWCHART: the trigger as a chip on top, then every node as a
   * rounded box connected by a darkorange arrow and indented by its tree depth — the shape of the
   * workflow designer's canvas, without needing the designer's own renderer.
   */
  function renderPreview(preview, root, data) {
    preview.textContent = "";
    if (!data || data.error || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "codbi-mirror-node__preview-empty";
      empty.textContent = message(root, "msg-preview-empty", "No workflow path selected.");
      preview.appendChild(empty);
      return;
    }
    const nodes = data.nodes;
    const title = document.createElement("div");
    title.className = "codbi-mirror-node__preview-title";

    const triggerText = data.triggerName
      ? `${data.triggerType || ""}${data.triggerType ? ": " : ""}${data.triggerName}`
      : data.triggerType || "";
    if (triggerText) {
      const chip = document.createElement("span");
      chip.className = "codbi-mirror-node__preview-trigger";
      chip.textContent = triggerText;
      chip.title = triggerText;
      title.appendChild(chip);
    }
    const pathName = document.createElement("span");
    pathName.className = "codbi-mirror-node__preview-path";
    pathName.textContent = data.pathName || "";
    title.appendChild(pathName);
    const count = document.createElement("span");
    count.className = "codbi-mirror-node__preview-count";
    count.textContent = `${nodes.length} ${message(root, "msg-node-count", "nodes")}`;
    title.appendChild(count);
    preview.appendChild(title);

    const flow = document.createElement("div");
    flow.className = "codbi-mirror-node__flow";
    nodes.forEach((node, index) => {
      const indent = `${Math.max(0, Number(node.depth) || 0) * 1.1}em`;
      if (index > 0) {
        const arrow = document.createElement("div");
        arrow.className = "codbi-mirror-node__flow-arrow";
        arrow.style.setProperty("--codbi-flow-indent", indent);
        arrow.textContent = "\u25BC";
        flow.appendChild(arrow);
      }
      const row = document.createElement("div");
      row.className = "codbi-mirror-node__flow-node";
      if (index === nodes.length - 1) {
        // The path's endpoint: tinted, so the end of the chain is visible at a glance.
        row.classList.add("codbi-mirror-node__flow-node--terminal");
      }
      row.style.setProperty("--codbi-flow-indent", indent);
      const badge = document.createElement("span");
      badge.className = "codbi-mirror-node__badge";
      badge.textContent = node.type || "?";
      const name = document.createElement("span");
      name.className = "codbi-mirror-node__node-name";
      name.textContent = node.name || "(unnamed)";
      row.appendChild(badge);
      row.appendChild(name);
      if (node.description) {
        row.title = node.description;
      }
      flow.appendChild(row);
    });
    preview.appendChild(flow);
  }

  function loadPreview(root, formKey, pathId, preview) {
    if (!preview) {
      return;
    }
    if (!formKey || !pathId) {
      renderPreview(preview, root, null);
      return;
    }
    const url =
      `${baseUrl(root)}&action=pathtree` +
      `&form=${encodeURIComponent(formKey)}` +
      `&path=${encodeURIComponent(pathId)}`;
    fetch(url, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => renderPreview(preview, root, data))
      .catch(() => {
        renderPreview(preview, root, null);
      });
  }

  function loadPaths(root, formSelect, pathSelect, preview) {
    const formKey = formSelect ? formSelect.value : "";
    if (!pathSelect) {
      return;
    }
    pathSelect.textContent = "";
    if (!formKey) {
      addOption(pathSelect, "", message(root, "msg-no-form", "No form selected."));
      renderPreview(preview, root, null);
      return;
    }
    addOption(pathSelect, "", message(root, "msg-loading", "Loading\u2026"));
    const url = `${baseUrl(root)}&action=paths&form=${encodeURIComponent(formKey)}`;
    fetch(url, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((paths) => {
        pathSelect.textContent = "";
        if (!Array.isArray(paths) || paths.length === 0) {
          addOption(pathSelect, "", message(root, "msg-no-paths", "No workflow paths."));
          renderPreview(preview, root, null);
          return;
        }
        const countLabel = message(root, "msg-node-count", "nodes");
        addOption(pathSelect, "", "\u2014");
        for (const path of paths) {
          addOption(pathSelect, String(path.id), `${path.name || "(unnamed)"} (${path.nodeCount || 0} ${countLabel})`);
        }
        const currentPath = String(root.getAttribute("data-path-value") || "");
        if (currentPath) {
          pathSelect.value = currentPath;
        }
        loadPreview(root, formKey, pathSelect.value, preview);
      })
      .catch(() => {
        pathSelect.textContent = "";
        addOption(pathSelect, "", message(root, "msg-no-paths", "No workflow paths."));
        renderPreview(preview, root, null);
      });
  }

  function loadForms(root, formSelect, pathSelect, preview) {
    if (!formSelect) {
      return;
    }
    formSelect.textContent = "";
    addOption(formSelect, "", message(root, "msg-loading", "Loading\u2026"));
    fetch(`${baseUrl(root)}&action=forms`, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((forms) => {
        formSelect.textContent = "";
        addOption(formSelect, "", "\u2014");
        for (const form of forms || []) {
          addOption(formSelect, form.key, form.name || `Form ${form.id}`);
        }
        const current = String(root.getAttribute("data-form-value") || "");
        if (current) {
          formSelect.value = current;
        }
        loadPaths(root, formSelect, pathSelect, preview);
      })
      .catch(() => {
        formSelect.textContent = "";
        addOption(formSelect, "", message(root, "msg-no-form", "No form selected."));
      });
  }

  /** Delay between a successful sync and the reload, so the sync result stays readable. */
  const RELOAD_DELAY_MS = 1200;

  /**
   * Loads THIS designer tab again — the path FORMCYCLE's own tab reload uses
   * (`Formcycle.DesignerTabbing.reloadIframe` navigates the same `data-target-url`) and the one the
   * form assistant takes after a workflow inference.
   *
   * Required after "Create nodes now": the workflow designer keeps the node tree it loaded when the
   * tab was opened, so freshly created nodes would only appear after a manual reload.
   */
  function reloadDesignerTab() {
    window.setTimeout(() => {
      try {
        const frame = window.frameElement;
        const target = frame ? String(frame.getAttribute("data-target-url") || "") : "";
        if (frame && target.trim() !== "") {
          const separator = target.indexOf("?") >= 0 ? "&" : "?";
          frame.src = `${target}${separator}codbiReload=${Date.now()}`;
          return;
        }
      } catch {
        /* cross-origin frame: fall back to reloading this document */
      }
      window.location.reload();
    }, RELOAD_DELAY_MS);
  }

  /**
   * "Create nodes now": asks the backend to materialize the configured source path's lane into this
   * reflecting path. FORMCYCLE offers no workflow-save hook to plugins, so this explicit trigger is
   * the reliable counterpart of the automatic source-save push while editing a workflow.
   *
   * A successful run reloads the designer tab, so the created/updated nodes are visible immediately.
   */
  function runSync(root, button) {
    const formKey = String(root.getAttribute("data-form-value") || "");
    const pathId = String(root.getAttribute("data-path-value") || "");
    const result = root.querySelector(SYNC_RESULT_SELECTOR);
    const label = button.textContent;
    if (!formKey || !pathId) {
      if (result) {
        result.textContent = message(root, "msg-preview-empty", "Select a form and a workflow path.");
      }
      return;
    }
    button.disabled = true;
    button.textContent = message(root, "msg-sync-running", "Synchronizing\u2026");
    const url =
      `${baseUrl(root)}&action=sync` + `&form=${encodeURIComponent(formKey)}` + `&path=${encodeURIComponent(pathId)}`;
    fetch(url, { credentials: "same-origin" })
      .then((response) => response.json())
      .then((data) => {
        if (result) {
          const prefix = message(root, "msg-sync-result", "Sync result:");
          result.textContent = `${prefix} ${(data && data.note) || ""}`.trim();
        }
        // Only reload when the backend really wrote the lane (`PUSHED:<n>/<m> reflectors …`); a
        // `SKIPPED:…` (paused, no reflector, empty source) or `PUSHED:0/…` must not throw the user
        // out of the designer.
        const pushed = /^PUSHED:(\d+)/.exec(String((data && data.note) || ""));
        if (pushed && Number(pushed[1]) > 0) {
          reloadDesignerTab();
        }
      })
      .catch((error) => {
        if (result) {
          result.textContent = String((error && error.message) || error);
        }
      })
      .finally(() => {
        button.disabled = false;
        button.textContent = label;
      });
  }

  function initRoot(root) {
    if (initialized.has(root)) {
      return;
    }
    initialized.add(root);
    const formSelect = root.querySelector(FORM_SELECT_SELECTOR);
    const pathSelect = root.querySelector(PATH_SELECT_SELECTOR);
    const preview = root.querySelector(PREVIEW_SELECTOR);

    const syncButton = root.querySelector(SYNC_SELECTOR);
    if (syncButton) {
      syncButton.addEventListener("click", () => runSync(root, syncButton));
    }

    loadForms(root, formSelect, pathSelect, preview);

    if (formSelect) {
      formSelect.addEventListener("change", () => {
        const selected = formSelect.options[formSelect.selectedIndex];
        const formName = selected ? selected.textContent : "";
        setInput(root, "data-input-form-id", ".codbi-mirror-source-form", formSelect.value);
        setInput(root, "data-input-form-name-id", ".codbi-mirror-source-form-name", formSelect.value ? formName : "");
        setInput(root, "data-input-path-id", ".codbi-mirror-path-id", "");
        setInput(root, "data-input-path-name-id", ".codbi-mirror-path-name", "");
        root.setAttribute("data-form-value", formSelect.value);
        root.setAttribute("data-path-value", "");
        invokeStore(root);
        loadPaths(root, formSelect, pathSelect, preview);
      });
    }

    if (pathSelect) {
      pathSelect.addEventListener("change", () => {
        const selected = pathSelect.options[pathSelect.selectedIndex];
        const pathName = selected ? selected.textContent : "";
        setInput(root, "data-input-path-id", ".codbi-mirror-path-id", pathSelect.value);
        setInput(root, "data-input-path-name-id", ".codbi-mirror-path-name", pathSelect.value ? pathName : "");
        root.setAttribute("data-path-value", pathSelect.value);
        invokeStore(root);
        loadPreview(root, formSelect ? formSelect.value : "", pathSelect.value, preview);
      });
    }
  }

  function init() {
    const roots = document.querySelectorAll(ROOT_SELECTOR);
    for (let i = 0; i < roots.length; i += 1) {
      initRoot(roots[i]);
    }
    syncPlaceholder();
    bindAjax();
    installObserver();
  }

  function bindAjax() {
    if (ajaxBound || !window.jQuery) {
      return;
    }
    ajaxBound = true;
    window.jQuery(document).on("pfAjaxComplete", () => {
      // The properties panel may have been re-rendered; re-run the initializer.
      window.setTimeout(init, 0);
    });
  }

  function installObserver() {
    if (observerInstalled || !window.MutationObserver || !document.documentElement) {
      return;
    }
    observerInstalled = true;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (added.nodeType === 1 && (added.matches?.(ROOT_SELECTOR) || added.querySelector?.(ROOT_SELECTOR))) {
            window.setTimeout(init, 0);
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Name changes do not re-render the properties view; keep the placeholder in sync.
  document.addEventListener(
    "input",
    (event) => {
      const target = event.target;
      if (target && typeof target.matches === "function" && target.matches(NAME_INPUT_SELECTOR)) {
        updatePlaceholder(target.value);
      }
    },
    true,
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
