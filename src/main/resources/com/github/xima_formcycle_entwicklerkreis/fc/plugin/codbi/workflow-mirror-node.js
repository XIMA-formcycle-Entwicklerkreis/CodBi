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

  function logDebug(...args) {
    console.info("[CodBi][MirrorNode]", ...args);
  }

  function message(root, name, fallback) {
    return String(root.getAttribute(`data-${name}`) || fallback || "");
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

  function renderPreview(preview, root, data) {
    preview.textContent = "";
    if (!data || data.error || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      const empty = document.createElement("div");
      empty.className = "codbi-mirror-node__preview-empty";
      empty.textContent = message(root, "msg-preview-empty", "No workflow path selected.");
      preview.appendChild(empty);
      return;
    }
    const title = document.createElement("div");
    title.className = "codbi-mirror-node__preview-title";
    const trigger = data.triggerName
      ? `${data.triggerType || ""}${data.triggerType ? ": " : ""}${data.triggerName}`
      : data.triggerType || "";
    title.textContent = trigger ? `${trigger} \u2014 ${data.pathName || ""}` : data.pathName || "";
    preview.appendChild(title);

    for (const node of data.nodes) {
      const row = document.createElement("div");
      row.className = "codbi-mirror-node__preview-node";
      row.style.paddingLeft = `${Math.max(0, Number(node.depth) || 0) * 1.1}em`;
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
      preview.appendChild(row);
    }
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
      .catch((error) => {
        logDebug("pathtree failed", error);
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
      .catch((error) => {
        logDebug("paths failed", error);
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
      .catch((error) => {
        logDebug("forms failed", error);
        formSelect.textContent = "";
        addOption(formSelect, "", message(root, "msg-no-form", "No form selected."));
      });
  }

  /**
   * "Create nodes now": asks the backend to materialize the configured source path's lane into this
   * reflecting path. FORMCYCLE offers no workflow-save hook to plugins, so this explicit trigger is
   * the reliable counterpart of the automatic source-save push while editing a workflow.
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
        logDebug("sync", data);
        if (result) {
          const prefix = message(root, "msg-sync-result", "Sync result:");
          result.textContent = `${prefix} ${(data && data.note) || ""}`.trim();
        }
      })
      .catch((error) => {
        logDebug("sync failed", error);
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
