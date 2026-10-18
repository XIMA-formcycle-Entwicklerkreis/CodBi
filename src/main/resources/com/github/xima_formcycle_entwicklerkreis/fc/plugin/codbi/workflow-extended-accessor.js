// #region CodBi Extended Accessor workflow node — form element tree + hover preview
//
// The workflow properties view renders a plain container with
// `data-codbi-accessor-tree`. This script loads the current form's element hierarchy from the
// existing `CodBi_Mirror` servlet action (`action=elements`) and renders it as a collapsible,
// filterable tree. Hovering an element fetches the same designer preview the Mirror widget uses
// (`action=preview`, styled with `action=css` / `action=wrapper`) and shows it in a floating iframe
// card. Selecting an element writes its technical name into the hidden but normally submitted
// text input and triggers its PrimeFaces change handler, which persists the node configuration.
(() => {
  const ROOT_SELECTOR = "[data-codbi-accessor-tree]";
  const PLACEHOLDER_SELECTOR = "[data-codbi-accessor-placeholder]";
  const COPY_BUTTON_SELECTOR = "[data-codbi-accessor-copy]";
  // Client id of the action-name input rendered by the shared `xi:newWorkflowActionBase`
  // composite: `<naming container>:<composite id>:actionName:actionName:input`.
  const NAME_INPUT_SELECTOR = 'input[id$=":actionName:actionName:input"]';
  const PLACEHOLDER_SUFFIX = ".RESULT.value";
  const PLUGIN_ACTION = "CodBi_Mirror";
  const PREVIEW_GAP = 12;
  const HIDE_DELAY = 220;
  const initialized = new WeakSet();
  const cssCache = new Map();
  const wrapperCache = new Map();
  const previewCache = new Map();
  let nameListenerBound = false;

  /** Diagnostic logging; keep enabled while tracking down persistence problems. */
  function logDebug(...args) {
    console.info("[CodBi][ExtendedAccessor]", ...args);
  }

  function init() {
    const roots = document.querySelectorAll(ROOT_SELECTOR);
    const fieldInput = document.querySelector(".codbi-accessor-field-name");
    logDebug(
      "init roots=",
      roots.length,
      "fieldInput=",
      fieldInput ? fieldInput.id : "<none>",
      "fieldValue=",
      fieldInput ? fieldInput.value : "<none>",
    );
    for (let i = 0; i < roots.length; i += 1) {
      initRoot(roots[i]);
    }
    bindNameListener();
    bindAjaxLogging();
    syncPlaceholder();
    initCopyButtons();
  }

  let refreshScheduled = false;

  /**
   * Re-runs the whole initializer after the properties panel was replaced. PrimeFaces does not always
   * emit an event that is late enough for the re-inserted panel, so a debounced DOM observer is used
   * as the reliable fallback. It only schedules when a NEW tree root appears, which avoids reacting
   * to the tree's own row rendering.
   */
  function scheduleInit() {
    if (refreshScheduled) {
      return;
    }
    refreshScheduled = true;
    const run = () => {
      refreshScheduled = false;
      init();
    };
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(run);
    } else {
      window.setTimeout(run, 16);
    }
  }

  function installTreeObserver() {
    if (!window.MutationObserver || !document.documentElement) {
      return;
    }
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (added.nodeType !== 1) {
            continue;
          }
          if (added.matches?.(ROOT_SELECTOR) || added.querySelector?.(ROOT_SELECTOR)) {
            scheduleInit();
            return;
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  let ajaxLoggingBound = false;

  function bindAjaxLogging() {
    if (ajaxLoggingBound || !window.jQuery) {
      return;
    }
    ajaxLoggingBound = true;
    window.jQuery(document).on("pfAjaxSend", () => {
      const input = document.querySelector(".codbi-accessor-field-name");
      logDebug("pfAjaxSend fieldName=", input ? input.value : "<no input>");
    });
    window.jQuery(document).on("pfAjaxComplete", () => {
      const input = document.querySelector(".codbi-accessor-field-name");
      const root = document.querySelector(ROOT_SELECTOR);
      logDebug(
        "pfAjaxComplete fieldName=",
        input ? input.value : "<no input>",
        "treeDataValue=",
        root ? root.getAttribute("data-value") : "<no root>",
      );
    });
  }

  function contextBase(root) {
    const contextPath = String(root.getAttribute("data-context-path") || "").replace(/\/$/, "");
    return `${contextPath}/plugin?name=${encodeURIComponent(PLUGIN_ACTION)}`;
  }

  function formKey(root) {
    const projectId = String(root.getAttribute("data-project-id") || "").trim();
    return projectId ? `project-${projectId}` : "";
  }

  function inputFor(root) {
    const id = String(root.getAttribute("data-input-id") || "");
    let input = id ? document.getElementById(id) : null;
    if (!input) {
      const className = String(root.getAttribute("data-input-class") || "");
      if (className) {
        input = document.querySelector(`.${className}`);
      }
    }
    if (!input) {
      input = document.querySelector('input[name$=":fieldName"]');
    }
    if (!input) {
      input = document.querySelector('input[id$=":fieldName"]');
    }
    return input;
  }

  /** Immediate visual feedback in the "Selection" panel, independent of the server round-trip. */
  function updateSummary(value) {
    const panel = document.querySelector('[id$="elementPreview"]') || document.querySelector(".codbi-accessor-preview");
    if (!panel) {
      return;
    }
    const code = panel.querySelector(".codbi-accessor-preview__value");
    if (code) {
      code.textContent = value || "\u2014";
    }
  }

  function message(root, name, fallback) {
    return String(root.getAttribute(`data-${name}`) || fallback || "");
  }

  /** Builds the workflow placeholder for the current node name. */
  function placeholderText(name) {
    // Keep the exact configured name (including any spaces) — the workflow placeholder is matched
    // against the persisted node name verbatim. Only use trimming to detect an empty name.
    const raw = String(name || "");
    // Workflow-node results use `[%<node name>.RESULT...%]` WITHOUT a `$`. A `$` prefix denotes a
    // different placeholder type and would never resolve against the node result.
    return raw.trim() ? `[%${raw}${PLACEHOLDER_SUFFIX}%]` : "";
  }

  /** Writes the placeholder derived from `name` into the "Selection" panel. */
  function updatePlaceholder(name) {
    const codes = document.querySelectorAll(PLACEHOLDER_SELECTOR);
    for (let i = 0; i < codes.length; i += 1) {
      const code = codes[i];
      code.textContent = placeholderText(name) || "\u2014";
    }
  }

  function actionNameInput() {
    return document.querySelector(NAME_INPUT_SELECTOR);
  }

  /**
   * Keeps the placeholder in sync with the action-name input. The properties view is not re-rendered
   * when the base action name changes, so the server-rendered placeholder would otherwise stay stale.
   */
  function syncPlaceholder() {
    const code = document.querySelector(PLACEHOLDER_SELECTOR);
    if (!code) {
      return;
    }
    const input = actionNameInput();
    if (input) {
      updatePlaceholder(input.value);
      return;
    }
    updatePlaceholder(code.getAttribute("data-node-name") || "");
  }

  function bindNameListener() {
    if (nameListenerBound) {
      return;
    }
    nameListenerBound = true;
    const handler = (event) => {
      const target = event.target;
      if (!target || typeof target.matches !== "function" || !target.matches(NAME_INPUT_SELECTOR)) {
        return;
      }
      updatePlaceholder(target.value);
    };
    document.addEventListener("input", handler, true);
    document.addEventListener("change", handler, true);
  }

  /** Current placeholder text, used by the copy button. Empty for the "no node name" dash. */
  function currentPlaceholderText() {
    const code = document.querySelector(PLACEHOLDER_SELECTOR);
    const text = code ? String(code.textContent || "").trim() : "";
    return text === "\u2014" ? "" : text;
  }

  function fallbackCopy(text) {
    return new Promise((resolve, reject) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      document.body.removeChild(area);
      if (copied) {
        resolve();
      } else {
        reject(new Error("copy failed"));
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    }
    return fallbackCopy(text);
  }

  function flashCopied(button) {
    const label = button.getAttribute("data-title") || "";
    const copied = button.getAttribute("data-copied") || label;
    button.classList.add("codbi-accessor-copy--copied");
    button.title = copied;
    button.setAttribute("aria-label", copied);
    window.clearTimeout(button.codbiCopyTimer);
    button.codbiCopyTimer = window.setTimeout(() => {
      button.classList.remove("codbi-accessor-copy--copied");
      button.title = label;
      button.setAttribute("aria-label", label);
    }, 1600);
  }

  function initCopyButtons() {
    const buttons = document.querySelectorAll(COPY_BUTTON_SELECTOR);
    for (let i = 0; i < buttons.length; i += 1) {
      const button = buttons[i];
      if (button.dataset.codbiCopyBound === "true") {
        continue;
      }
      button.dataset.codbiCopyBound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const text = currentPlaceholderText();
        if (!text) {
          return;
        }
        copyText(text).then(
          () => flashCopied(button),
          (error) => console.error("[CodBi] Extended Accessor: could not copy the placeholder", error),
        );
      });
    }
  }

  function fetchJson(url) {
    return fetch(url, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : []))
      .catch(() => []);
  }

  function fetchText(url) {
    return fetch(url, { credentials: "same-origin" })
      .then((response) => (response.ok ? response.text() : ""))
      .catch(() => "");
  }

  function initRoot(root) {
    // Re-render when the properties panel reuses the same root but has cleared its content.
    if (initialized.has(root) && root.querySelector(".codbi-accessor-tree__list")) {
      return;
    }
    initialized.add(root);
    const key = formKey(root);
    const base = contextBase(root);
    logDebug(
      "initRoot formKey=",
      key,
      "dataValue=",
      root.getAttribute("data-value"),
      "inputId=",
      root.getAttribute("data-input-id"),
      "inputClass=",
      root.getAttribute("data-input-class"),
    );
    if (!key) {
      logDebug("initRoot has no form key; tree cannot load");
      root.replaceChildren(textNode("codbi-accessor-tree__empty", message(root, "no-form", "")));
      return;
    }
    root.classList.add("codbi-accessor-tree--loading");
    root.replaceChildren(textNode("codbi-accessor-tree__empty", message(root, "loading", "")));
    fetchJson(`${base}&action=elements&form=${encodeURIComponent(key)}`).then((options) => {
      root.classList.remove("codbi-accessor-tree--loading");
      const nodes = buildTree(Array.isArray(options) ? options : []);
      logDebug("tree loaded elements=", nodes.length);
      if (nodes.length === 0) {
        root.replaceChildren(textNode("codbi-accessor-tree__empty", message(root, "no-results", "")));
        return;
      }
      renderTree(root, base, key, nodes);
    });
  }

  function textNode(className, text) {
    const node = document.createElement("div");
    node.className = className;
    node.textContent = text;
    return node;
  }

  /** Labels are rich text (e.g. `<p>Name</p>`); the tree shows a clean plain-text label. */
  function stripTags(value) {
    return String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildTree(options) {
    const byId = new Map();
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i] || {};
      const id = String(option.id || option.name || "");
      if (!id || byId.has(id)) {
        continue;
      }
      const label = stripTags(option.label) || String(option.name || id);
      byId.set(id, {
        id: id,
        name: String(option.name || id),
        label: label,
        className: String(option.className || ""),
        parentId: String(option.parentid || ""),
        helpText: String(option.helptext || ""),
        children: [],
      });
    }
    const roots = [];
    for (const node of byId.values()) {
      const parent = node.parentId && byId.get(node.parentId);
      if (parent && parent !== node) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  function renderTree(root, base, key, nodes) {
    // Containers start folded, mirroring the Mirror widget's element selector.
    const collapsed = new Set();
    function collectContainers(items) {
      for (const node of items) {
        if (node.children.length > 0) {
          collapsed.add(node.id);
          collectContainers(node.children);
        }
      }
    }
    collectContainers(nodes);

    // A persisted selection may be nested inside folded containers. Expand exactly the path to it
    // so reselecting the workflow node always shows the configured element instead of an apparently
    // empty/collapsed tree.
    const selectedValue = String(root.getAttribute("data-value") || "");
    function expandPathTo(items, value, ancestors) {
      for (const node of items) {
        if (node.name === value || node.id === value) {
          for (const id of ancestors) {
            collapsed.delete(id);
          }
          return true;
        }
        if (node.children.length > 0) {
          ancestors.push(node.id);
          if (expandPathTo(node.children, value, ancestors)) {
            return true;
          }
          ancestors.pop();
        }
      }
      return false;
    }
    if (selectedValue) {
      const expanded = expandPathTo(nodes, selectedValue, []);
      logDebug("tree selected path expanded=", expanded, "selected=", selectedValue);
    }

    const list = document.createElement("div");
    list.className = "codbi-accessor-tree__list";
    list.setAttribute("role", "tree");
    const filter = document.createElement("input");
    filter.type = "search";
    filter.className = "codbi-accessor-tree__filter";
    filter.placeholder = message(root, "filter-placeholder", "");
    const toolbar = document.createElement("div");
    toolbar.className = "codbi-accessor-tree__toolbar";
    toolbar.appendChild(filter);
    root.replaceChildren(toolbar, list);

    function matches(node, query) {
      if (!query) {
        return true;
      }
      const own = `${node.label} ${node.name} ${node.className}`.toLowerCase();
      if (own.indexOf(query) !== -1) {
        return true;
      }
      for (let i = 0; i < node.children.length; i += 1) {
        if (matches(node.children[i], query)) {
          return true;
        }
      }
      return false;
    }

    function redraw() {
      const query = filter.value.trim().toLowerCase();
      list.replaceChildren();
      function walk(items, depth) {
        for (let i = 0; i < items.length; i += 1) {
          const node = items[i];
          if (!matches(node, query)) {
            continue;
          }
          list.appendChild(rowFor(node, depth, query));
          const expanded = query.length > 0 || !collapsed.has(node.id);
          if (expanded) {
            walk(node.children, depth + 1);
          }
        }
      }
      walk(nodes, 0);
      markSelected();
    }

    function rowFor(node, depth, query) {
      const row = document.createElement("div");
      row.className = "codbi-accessor-tree__item";
      row.style.paddingLeft = `${8 + depth * 16}px`;
      row.dataset.id = node.id;
      row.dataset.name = node.name;
      row.dataset.label = node.label;
      row.dataset.className = node.className;
      row.tabIndex = 0;
      row.setAttribute("role", "treeitem");
      if (node.children.length > 0) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "codbi-accessor-tree__toggle";
        toggle.setAttribute("aria-label", node.label);
        toggle.textContent = collapsed.has(node.id) && query.length === 0 ? "\u25B8" : "\u25BE";
        toggle.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          if (collapsed.has(node.id)) {
            collapsed.delete(node.id);
          } else {
            collapsed.add(node.id);
          }
          redraw();
        });
        row.appendChild(toggle);
      } else {
        const spacer = document.createElement("span");
        spacer.className = "codbi-accessor-tree__spacer";
        row.appendChild(spacer);
      }
      const label = document.createElement("span");
      label.className = "codbi-accessor-tree__label";
      label.textContent = node.label;
      row.appendChild(label);
      if (node.name && node.name !== node.label) {
        const name = document.createElement("code");
        name.className = "codbi-accessor-tree__name";
        name.textContent = node.name;
        name.addEventListener("mouseenter", (event) => {
          event.stopPropagation();
          hidePreview();
          showHelp(node, name);
        });
        name.addEventListener("mouseleave", () => {
          hideHelp();
          if (hoveredRow === row) {
            showPreview(row, node, base, key);
          }
        });
        row.appendChild(name);
      }
      if (node.className) {
        const type = document.createElement("span");
        type.className = "codbi-accessor-tree__type";
        type.textContent = node.className;
        row.appendChild(type);
      }
      row.addEventListener("click", () => {
        choose(node);
      });
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose(node);
        }
      });
      row.addEventListener("mouseenter", () => {
        hoveredRow = row;
        cancelHide();
        showPreview(row, node, base, key);
      });
      row.addEventListener("mouseleave", () => {
        if (hoveredRow === row) {
          hoveredRow = null;
        }
        scheduleHide();
      });
      return row;
    }

    function choose(node) {
      const value = node.name || node.id;
      root.setAttribute("data-value", value);
      markSelected();
      updateSummary(value);

      // Write the selected technical name into the hidden (but rendered) text input and trigger a
      // regular PrimeFaces change event. Its `p:ajax` persists the node configuration exactly like
      // the shared xi:inputText controls. The value is also part of the next normal form submit.
      const input = inputFor(root);
      logDebug(
        "choose value=",
        value,
        "input=",
        input ? `${input.tagName}#${input.id}[name=${input.name}]` : "<not found>",
      );
      if (!input) {
        return;
      }
      const previous = input.value;
      input.value = value;
      logDebug("input value changed from=", previous, "to=", input.value);
      try {
        if (typeof window.codbiAccessorSelectField === "function") {
          window.codbiAccessorSelectField();
          logDebug("invoked codbiAccessorSelectField remote command");
        } else {
          logDebug("remote command missing; falling back to change event");
          if (window.jQuery) {
            window.jQuery(input).trigger("change");
          } else {
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        }
      } catch (error) {
        console.error("[CodBi] Extended Accessor: could not store the selected element", error);
      }
    }

    function markSelected() {
      const value = String(root.getAttribute("data-value") || "");
      const rows = list.querySelectorAll(".codbi-accessor-tree__item");
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const active = row.dataset.name === value;
        row.classList.toggle("codbi-accessor-tree__item--selected", active);
        row.setAttribute("aria-selected", active ? "true" : "false");
      }
    }

    filter.addEventListener("input", redraw);
    redraw();
    markSelected();
    logDebug(
      "tree rows rendered=",
      list.querySelectorAll(".codbi-accessor-tree__item").length,
      "selectedRows=",
      list.querySelectorAll(".codbi-accessor-tree__item--selected").length,
    );
    const selectedRow = list.querySelector(".codbi-accessor-tree__item--selected");
    if (selectedRow) {
      try {
        selectedRow.scrollIntoView({ block: "nearest" });
      } catch {
        /* older engines */
      }
    }
  }

  function showPreview(row, node, base, key) {
    cancelHide();
    previewToken += 1;
    const token = previewToken;
    const card = ensurePreviewCard();
    card.querySelector(".codbi-accessor-preview-card__name").textContent = node.label || node.name;
    card.querySelector(".codbi-accessor-preview-card__type").textContent = node.className || "";
    const body = card.querySelector(".codbi-accessor-preview-card__body");
    const fallback = textNode("codbi-accessor-preview-card__fallback", node.className || node.label || node.name);
    body.replaceChildren(fallback);
    card.hidden = false;
    positionPreview(card, row);

    const form = encodeURIComponent(key);
    Promise.all([
      cachedText(`${base}&action=css&form=${form}`, key, cssCache),
      cachedText(`${base}&action=wrapper&form=${form}`, key, wrapperCache),
    ]).then((values) => {
      if (token !== previewToken) {
        return;
      }
      const css = values[0] || "";
      const wrapper = values[1] || "xm-form";
      const element = encodeURIComponent(node.id);
      const elementKey = encodeURIComponent(node.name || "");
      const cacheKey = `${key}::${node.id}::${elementKey}`;
      cachedText(
        `${base}&action=preview&form=${form}&element=${element}&elementkey=${elementKey}`,
        cacheKey,
        previewCache,
      ).then((html) => {
        if (token !== previewToken) {
          return;
        }
        if (!html) {
          return;
        }
        const safe = html.replace(/<script[\s\S]*?<\/script>/gi, "");
        const modern = /(?:^|\s)modern(?:\s|$)/.test(wrapper);
        const bodyClass = `body xm-body${modern ? " modern" : ""}`;
        const frame = document.createElement("iframe");
        frame.className = "codbi-accessor-preview-card__frame";
        frame.setAttribute("sandbox", "allow-same-origin allow-forms");
        frame.setAttribute("title", node.label || node.name);
        frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base href="${document.baseURI}"><style>${css}</style><style>html,body{margin:0;padding:10px;background:#fff}</style></head><body class=\"${bodyClass}"><form class="${wrapper}" action="#" onsubmit="return false">${safe}</form></body></html>`;
        frame.addEventListener("load", () => {
          try {
            const doc = frame.contentDocument;
            if (doc?.body) {
              frame.style.height = `${Math.max(120, doc.body.scrollHeight + 24)}px`;
            }
          } catch (error) {
            /* cross-origin is not expected for srcdoc, but keep a sane height */
          }
          positionPreview(card, row);
        });
        body.replaceChildren(frame);
        positionPreview(card, row);
      });
    });
  }

  function cachedText(url, key, cache) {
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key));
    }
    return fetchText(url).then((value) => {
      cache.set(key, value);
      return value;
    });
  }

  let previewToken = 0;
  let hideTimer = 0;
  let previewCard = null;
  let hoveredRow = null;
  let cardHovered = false;
  let helpCard = null;

  function ensurePreviewCard() {
    if (previewCard) {
      return previewCard;
    }
    previewCard = document.createElement("div");
    previewCard.className = "codbi-accessor-preview-card";
    previewCard.hidden = true;
    previewCard.innerHTML =
      '<div class="codbi-accessor-preview-card__head">' +
      '<span class="codbi-accessor-preview-card__name"></span>' +
      '<span class="codbi-accessor-preview-card__type"></span>' +
      "</div>" +
      '<div class="codbi-accessor-preview-card__body"></div>';
    previewCard.addEventListener("mouseenter", () => {
      cardHovered = true;
      cancelHide();
    });
    previewCard.addEventListener("mouseleave", () => {
      cardHovered = false;
      scheduleHide();
    });
    document.body.appendChild(previewCard);
    return previewCard;
  }

  function hidePreview() {
    cancelHide();
    if (previewCard) {
      previewCard.hidden = true;
    }
  }

  function ensureHelpCard() {
    if (helpCard) {
      return helpCard;
    }
    helpCard = document.createElement("div");
    helpCard.className = "codbi-accessor-help-card";
    helpCard.hidden = true;
    helpCard.innerHTML = '<div class="codbi-accessor-help-card__body"></div>';
    document.body.appendChild(helpCard);
    return helpCard;
  }

  /** Shows the rendered help HTML of the hovered element's name badge. */
  function showHelp(node, anchor) {
    const help = String(node.helpText || "").replace(/<script[\s\S]*?<\/script>/gi, "");
    if (!help.trim()) {
      hideHelp();
      return;
    }
    const card = ensureHelpCard();
    const body = card.querySelector(".codbi-accessor-help-card__body");
    const frame = document.createElement("iframe");
    frame.className = "codbi-accessor-help-card__frame";
    frame.setAttribute("sandbox", "allow-same-origin");
    frame.setAttribute("title", node.label || node.name);
    frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base href="${document.baseURI}"><style>html,body{margin:0;padding:8px;background:#fff;color:#111827;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:13px;line-height:1.45}img{max-width:100%;height:auto}a{color:#2563eb}p:first-child{margin-top:0}p:last-child{margin-bottom:0}</style></head><body>${help}</body></html>`;
    frame.addEventListener("load", () => {
      try {
        const doc = frame.contentDocument;
        if (doc?.body) {
          frame.style.height = `${Math.max(40, doc.body.scrollHeight + 18)}px`;
          positionHelp(card, anchor);
        }
      } catch (error) {
        /* keep the default height */
      }
    });
    body.replaceChildren(frame);
    card.hidden = false;
    positionHelp(card, anchor);
  }

  function hideHelp() {
    if (helpCard) {
      helpCard.hidden = true;
    }
  }

  function positionHelp(card, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = card.offsetWidth || 300;
    const height = card.offsetHeight || 120;
    const margin = 8;
    let left = rect.left;
    if (left + width > window.innerWidth - margin) {
      left = rect.right - width;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    let top = rect.bottom + 6;
    if (top + height > window.innerHeight - margin) {
      top = rect.top - height - 6;
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function positionPreview(card, row) {
    const rect = row.getBoundingClientRect();
    const width = card.offsetWidth || 380;
    const height = card.offsetHeight || 320;
    const margin = 8;
    let left = rect.right + PREVIEW_GAP;
    if (left + width > window.innerWidth - margin) {
      left = rect.left - width - PREVIEW_GAP;
    }
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    let top = rect.top;
    top = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  }

  function cancelHide() {
    if (hideTimer) {
      window.clearTimeout(hideTimer);
      hideTimer = 0;
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = window.setTimeout(() => {
      hideTimer = 0;
      if (!hoveredRow && !cardHovered && previewCard) {
        previewCard.hidden = true;
      }
    }, HIDE_DELAY);
  }

  // Expose an explicit refresh hook for the XHTML bootstrap when the cached script is reused.
  window.codbiExtendedAccessorRefresh = init;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  // PrimeFaces replaces the properties panel on ajax updates; re-initialize any new tree root.
  if (window.jQuery) {
    window.jQuery(document).on("pfAjaxComplete", init);
  }
  installTreeObserver();
})();
