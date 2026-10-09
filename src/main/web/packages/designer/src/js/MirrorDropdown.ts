import type { IMirrorOption } from "./MirrorSelect.js";

/** Horizontal gap between the hovered item and the floating preview card. */
const PREVIEW_GAP = 10;
/** Safety margin kept between the preview card and the viewport edge. */
const VIEWPORT_MARGIN = 8;
/** Horizontal indentation applied per hierarchy level in tree mode (px). */
const TREE_INDENT = 16;
/** Delay before the preview closes after the pointer leaves the item/preview (ms). */
const HIDE_DELAY = 260;
/** localStorage key remembering whether the Mirror preview should be shown large (maximized). */
const PREVIEW_MAX_KEY = "codbi-mirror-preview-maximized";

/** Expand icon (corner brackets pointing outward). */
const MAX_ICON =
  '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
/** Restore icon (corner brackets pointing inward). */
const RESTORE_ICON =
  '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Optional behaviour for a {@link MirrorDropdown}. */
export interface IMirrorDropdownConfig {
  /** Render the options as a hierarchy using each option's `depth`/`hasChildren`. */
  tree?: boolean;
  /** Show a text box above the options that narrows the list while typing. */
  filter?: boolean;
  /** Placeholder shown in the filter box. */
  filterPlaceholder?: string;
  /** Text shown when the filter matches nothing. */
  filterEmptyText?: string;
  /** Title/aria-label of the preview's enlarge button. */
  maximizeLabel?: string;
  /** Title/aria-label of the preview's restore button. */
  restoreLabel?: string;
}

/**
 * A small, self-contained dropdown used by both Mirror property editors.
 *
 * Renders a button (showing the current selection, ellipsised so long values never overflow) plus an
 * absolutely positioned option list. Optional per-option previews are shown as a floating card in a
 * `document.body` PORTAL (position: fixed) so the editor/panel can never clip them. The preview is
 * interactive: it stays open while the pointer is over it (short hover-out delay), can be enlarged,
 * scrolls vertically and lets the user operate the mirrored element. In `tree` mode the options are
 * indented by their `depth` and containers can be collapsed; in `filter` mode a text box narrows the
 * options (matches keep their ancestor context).
 */
export class MirrorDropdown {
  /** All currently instantiated dropdowns — used to ensure only one is open at a time. */
  private static readonly instances = new Set<MirrorDropdown>();

  /** Root element to be returned from the editor's `getElement()`. */
  readonly root: HTMLDivElement;

  private readonly button: HTMLButtonElement;
  private readonly buttonLabel: HTMLSpanElement;
  private readonly list: HTMLDivElement;
  private readonly items: HTMLDivElement;
  private readonly preview: HTMLDivElement;
  private readonly previewName: HTMLSpanElement;
  private readonly previewType: HTMLSpanElement;
  private readonly previewMax: HTMLButtonElement;
  private readonly previewBody: HTMLDivElement;
  private readonly filterInput?: HTMLInputElement;
  private readonly config: IMirrorDropdownConfig;
  private options: IMirrorOption[] = [];
  private value = "";
  private isOpen = false;
  private query = "";
  private maximized = false;
  private hideTimer: number | undefined;
  private lastAnchor: HTMLElement | undefined;
  /** Values of collapsed container options (tree mode). */
  private readonly collapsed = new Set<string>();

  /**
   * @param onSelect Called when the user picks an option.
   * @param previewFor Optional builder returning the BODY node for an option's hover preview.
   * @param config Optional tree/filter/preview behaviour.
   */
  constructor(
    private readonly onSelect: (value: string, option: IMirrorOption | undefined) => void,
    private readonly previewFor?: (option: IMirrorOption) => Node | null | undefined,
    config: IMirrorDropdownConfig = {},
  ) {
    this.config = config;
    this.root = document.createElement("div");
    this.root.className = "codbi-mirror-dd";

    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "codbi-mirror-dd__button";
    this.buttonLabel = document.createElement("span");
    this.buttonLabel.className = "codbi-mirror-dd__button-label";
    this.button.appendChild(this.buttonLabel);
    this.root.appendChild(this.button);

    this.list = document.createElement("div");
    this.list.className = "codbi-mirror-dd__list";
    this.list.hidden = true;

    if (config.filter) {
      const filter = document.createElement("input");
      filter.type = "search";
      filter.className = "codbi-mirror-dd__filter";
      filter.placeholder = config.filterPlaceholder ?? "";
      filter.setAttribute("aria-label", config.filterPlaceholder ?? "Filter");
      filter.addEventListener("click", (event) => event.stopPropagation());
      filter.addEventListener("keydown", (event) => event.stopPropagation());
      filter.addEventListener("input", () => {
        this.query = filter.value.trim().toLowerCase();
        this.renderItems();
      });
      this.list.appendChild(filter);
      this.filterInput = filter;
    }

    this.items = document.createElement("div");
    this.items.className = "codbi-mirror-dd__items";
    this.list.appendChild(this.items);
    this.root.appendChild(this.list);
    MirrorDropdown.instances.add(this);

    // The preview lives in a body-level portal (fixed) so no ancestor can clip it. It is interactive
    // (enlarge button, scrollable content, usable element), so pointer events stay enabled.
    this.preview = document.createElement("div");
    this.preview.className = "codbi-mirror-dd__preview codbi-mirror-dd__preview--floating";
    this.preview.hidden = true;

    const head = document.createElement("div");
    head.className = "codbi-mirror-dd__preview-head";
    this.previewName = document.createElement("span");
    this.previewName.className = "codbi-mirror-preview__name";
    head.appendChild(this.previewName);
    this.previewType = document.createElement("span");
    this.previewType.className = "codbi-mirror-preview__type";
    this.previewType.hidden = true;
    head.appendChild(this.previewType);
    this.previewMax = document.createElement("button");
    this.previewMax.type = "button";
    this.previewMax.className = "codbi-mirror-preview__max";
    this.previewMax.hidden = !this.previewFor;
    this.previewMax.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggleMaximize();
    });
    head.appendChild(this.previewMax);
    this.preview.appendChild(head);

    this.previewBody = document.createElement("div");
    this.previewBody.className = "codbi-mirror-dd__preview-body";
    this.preview.appendChild(this.previewBody);

    // Clicking/scrolling inside the preview must not close the dropdown, and hovering it keeps it open.
    this.preview.addEventListener("click", (event) => event.stopPropagation());
    this.preview.addEventListener("mouseenter", () => this.cancelHide());
    this.preview.addEventListener("mouseleave", () => this.scheduleHide());
    document.body.appendChild(this.preview);

    // Only the element selector (which has a preview) remembers whether the user wants it large.
    if (this.previewFor) {
      this.restoreSavedMaximized();
    }

    this.button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggle();
    });
    document.addEventListener("click", () => this.close());
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.close();
      }
    });
    this.items.addEventListener("scroll", () => {
      this.cancelHide();
      this.hidePreview();
    });
    window.addEventListener("resize", () => this.positionPreview());
  }

  /** Replaces the whole option list. */
  setOptions(options: readonly IMirrorOption[]): void {
    this.options = [...options];
    // Start with the tree fully folded (every container collapsed) so a large form hierarchy is
    // not overwhelming. The user can expand nodes as needed.
    this.collapseAll();
    this.renderItems();
    this.renderButton();
  }

  /** Sets the current value (label shown on the button). */
  setValue(value: unknown): void {
    this.value = value == null ? "" : String(value);
    this.renderButton();
    this.markSelected();
  }

  /** @returns the current value ("" when nothing is selected). */
  getValue(): string {
    return this.value;
  }

  private selectedOption(): IMirrorOption | undefined {
    return this.options.find((option) => option.value === this.value);
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      // Only ONE Mirror dropdown may be open at a time.
      for (const other of MirrorDropdown.instances) {
        if (other !== this) {
          other.close();
        }
      }
      this.isOpen = true;
      this.list.hidden = false;
      this.button.setAttribute("aria-expanded", "true");
      if (this.filterInput) {
        this.query = "";
        this.filterInput.value = "";
        this.renderItems();
        this.filterInput.focus();
      }
    }
  }

  private close(): void {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.list.hidden = true;
    this.cancelHide();
    this.hidePreview();
    this.button.setAttribute("aria-expanded", "false");
  }

  private renderButton(): void {
    const option = this.selectedOption();
    const text = option?.text ?? "";
    this.buttonLabel.textContent = text;
    this.button.title = text;
    this.button.disabled = this.options.length === 0;
  }

  /**
   * Index of the enclosing container for each option (nearest preceding option with a smaller
   * `depth`), or -1 for roots. Relies on the options being in depth-first order.
   */
  private parentIndexes(): number[] {
    const parents: number[] = [];
    const stack: number[] = [];
    for (let i = 0; i < this.options.length; i++) {
      const depth = this.options[i].depth ?? 0;
      while (stack.length > depth) {
        stack.pop();
      }
      parents[i] = stack.length > 0 ? stack[stack.length - 1] : -1;
      stack.push(i);
    }
    return parents;
  }

  private hasChildren(index: number, childCount: number[]): boolean {
    if (this.options[index].hasChildren !== undefined) {
      return this.options[index].hasChildren === true;
    }
    return childCount[index] > 0;
  }

  /** Folds the tree: adds every container option's value to the `collapsed` set. */
  private collapseAll(): void {
    this.collapsed.clear();
    const parents = this.parentIndexes();
    const childCount = new Array<number>(this.options.length).fill(0);
    for (const parent of parents) {
      if (parent >= 0) {
        childCount[parent]++;
      }
    }
    for (let i = 0; i < this.options.length; i++) {
      if (this.hasChildren(i, childCount)) {
        this.collapsed.add(this.options[i].value);
      }
    }
  }

  /** Rebuilds the option list items (applying tree indentation/collapse and the active filter). */
  private renderItems(): void {
    this.items.innerHTML = "";
    if (this.options.length === 0) {
      this.appendEmpty(this.config.filterEmptyText ?? "\u2013");
      return;
    }

    const parents = this.config.tree ? this.parentIndexes() : this.options.map(() => -1);
    const childCount = new Array<number>(this.options.length).fill(0);
    for (const parent of parents) {
      if (parent >= 0) {
        childCount[parent]++;
      }
    }

    const visible = this.visibleIndexes(parents);
    if (visible.length === 0) {
      this.appendEmpty(this.config.filterEmptyText ?? "\u2013");
      return;
    }

    for (const index of visible) {
      const option = this.options[index];
      const item = document.createElement("div");
      item.className = "codbi-mirror-dd__item";
      item.dataset.value = option.value;
      item.setAttribute("role", "option");
      item.title = option.text;
      const depth = this.config.tree ? (option.depth ?? 0) : 0;
      item.style.paddingLeft = `${8 + depth * TREE_INDENT}px`;
      if (option.value === this.value) {
        item.setAttribute("aria-selected", "true");
      }

      if (this.config.tree) {
        const kids = this.hasChildren(index, childCount);
        const twisty = document.createElement("span");
        twisty.className = "codbi-mirror-dd__twisty";
        if (kids) {
          twisty.textContent = this.collapsed.has(option.value) ? "\u25B8" : "\u25BE";
          twisty.setAttribute("role", "button");
          twisty.addEventListener("click", (event) => {
            event.stopPropagation();
            if (this.collapsed.has(option.value)) {
              this.collapsed.delete(option.value);
            } else {
              this.collapsed.add(option.value);
            }
            this.renderItems();
          });
        } else {
          twisty.classList.add("codbi-mirror-dd__twisty--leaf");
        }
        item.appendChild(twisty);
      }

      const label = document.createElement("span");
      label.className = "codbi-mirror-dd__label";
      label.textContent = option.text;
      item.appendChild(label);

      if (option.className) {
        const type = document.createElement("span");
        type.className = "codbi-mirror-dd__type";
        type.textContent = option.className;
        item.appendChild(type);
      }

      item.addEventListener("click", (event) => {
        event.stopPropagation();
        this.value = option.value;
        this.renderButton();
        this.markSelected();
        this.close();
        this.onSelect(option.value, option);
      });
      item.addEventListener("mouseenter", () => this.showPreview(option, item));
      item.addEventListener("mouseleave", () => this.scheduleHide());

      this.items.appendChild(item);
    }
  }

  /**
   * Indices of the options to show. Without a query, descendants of collapsed containers are hidden;
   * with a query, matching options plus their ancestors and direct descendants are shown (expanded).
   */
  private visibleIndexes(parents: number[]): number[] {
    if (!this.query) {
      const visible: number[] = [];
      for (let i = 0; i < this.options.length; i++) {
        let hidden = false;
        for (let p = parents[i]; p >= 0; p = parents[p]) {
          if (this.collapsed.has(this.options[p].value)) {
            hidden = true;
            break;
          }
        }
        if (!hidden) {
          visible.push(i);
        }
      }
      return visible;
    }

    const relevant = new Array<boolean>(this.options.length).fill(false);
    for (let i = 0; i < this.options.length; i++) {
      if (!this.matches(this.options[i])) {
        continue;
      }
      relevant[i] = true;
      for (let p = parents[i]; p >= 0; p = parents[p]) {
        relevant[p] = true;
      }
      const depth = this.options[i].depth ?? 0;
      for (let j = i + 1; j < this.options.length && (this.options[j].depth ?? 0) > depth; j++) {
        relevant[j] = true;
      }
    }
    const visible: number[] = [];
    for (let i = 0; i < this.options.length; i++) {
      if (relevant[i]) {
        visible.push(i);
      }
    }
    return visible;
  }

  /** Whether an option matches the current filter query (name, label, class or rendered text). */
  private matches(option: IMirrorOption): boolean {
    const haystack = [option.text, option.name, option.className, option.label]
      .filter((part): part is string => typeof part === "string")
      .join(" ")
      .toLowerCase();
    return haystack.includes(this.query);
  }

  private appendEmpty(text: string): void {
    const empty = document.createElement("div");
    empty.className = "codbi-mirror-dd__empty";
    empty.textContent = text;
    this.items.appendChild(empty);
  }

  private markSelected(): void {
    for (const item of Array.from(this.items.children)) {
      const element = item as HTMLElement;
      if (element.dataset.value === this.value) {
        element.setAttribute("aria-selected", "true");
      } else {
        element.removeAttribute("aria-selected");
      }
    }
  }

  private cancelHide(): void {
    if (this.hideTimer !== undefined) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }
  }

  /** Hides the preview after a short delay, giving the pointer time to reach the preview. */
  private scheduleHide(): void {
    this.cancelHide();
    this.hideTimer = window.setTimeout(() => {
      this.hideTimer = undefined;
      this.hidePreview();
    }, HIDE_DELAY);
  }

  private hidePreview(): void {
    this.preview.hidden = true;
  }

  private toggleMaximize(): void {
    this.maximized = !this.maximized;
    this.preview.classList.toggle("codbi-mirror-dd__preview--max", this.maximized);
    this.previewMax.setAttribute("aria-pressed", String(this.maximized));
    this.previewMax.innerHTML = this.maximized ? RESTORE_ICON : MAX_ICON;
    this.previewMax.title = this.maximized
      ? (this.config.restoreLabel ?? "Restore")
      : (this.config.maximizeLabel ?? "Enlarge");
    this.previewMax.setAttribute("aria-label", this.previewMax.title);
    // Remember the user's choice so the preview reopens the same size after reload/form edits.
    if (this.previewFor) {
      try {
        localStorage.setItem(PREVIEW_MAX_KEY, String(this.maximized));
      } catch {
        // Storage can be unavailable (private mode, quota) — the choice simply won't persist.
      }
    }
    // Re-size/reposition after the size change: maximized fills the canvas, floating re-clamps.
    this.positionPreview();
  }

  /**
   * Applies the persisted "show preview large" choice. Called for element selectors only, so the
   * choice is remembered per-browser across reloads instead of every preview reopening small.
   */
  private restoreSavedMaximized(): void {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(PREVIEW_MAX_KEY);
    } catch {
      // Storage unavailable — fall back to the default (small).
    }
    if (saved !== "true") {
      return;
    }
    this.maximized = true;
    this.preview.classList.add("codbi-mirror-dd__preview--max");
    this.previewMax.setAttribute("aria-pressed", "true");
    this.previewMax.innerHTML = RESTORE_ICON;
    this.previewMax.title = this.config.restoreLabel ?? "Restore";
    this.previewMax.setAttribute("aria-label", this.previewMax.title);
  }

  /** Shows the preview for `option` anchored to the hovered `anchor` item. */
  private showPreview(option: IMirrorOption, anchor: HTMLElement): void {
    const body = this.previewFor?.(option) ?? null;
    if (!body) {
      this.hidePreview();
      return;
    }
    this.cancelHide();
    this.lastAnchor = anchor;

    // The caption shows the element NAME in black plus its TYPE in a darkorange box (like the
    // form-assistant change log).
    this.previewName.textContent = option.label ?? option.name ?? option.text;
    if (option.className) {
      this.previewType.textContent = option.className;
      this.previewType.hidden = false;
    } else {
      this.previewType.hidden = true;
    }
    this.previewBody.replaceChildren(body);
    // The rendered element lives in a (possibly async) iframe; re-fit/position once it finishes
    // loading so a wider element widens the floating preview instead of being cut off, and a taller
    // element grows the iframe so the preview-body can scroll it.
    for (const frame of Array.from(this.previewBody.querySelectorAll("iframe"))) {
      frame.addEventListener("load", () => {
        this.fitFrameHeight();
        this.positionPreview();
      });
    }
    this.preview.hidden = false;
    this.positionPreview();
  }

  /**
   * Width that fits the preview's (non-maximized) content without overflowing the window. Reads the
   * widest of the preview body and any same-origin preview iframe's document, then clamps it between
   * a sensible minimum and the available viewport width so it is never clipped.
   */
  private fitFloatingWidth(): number {
    const min = 320;
    const max = Math.max(min, window.innerWidth - 2 * VIEWPORT_MARGIN);
    let contentWidth = this.previewBody.scrollWidth;
    for (const frame of Array.from(this.previewBody.querySelectorAll("iframe"))) {
      try {
        const doc = frame.contentDocument;
        if (doc) {
          contentWidth = Math.max(contentWidth, doc.body.scrollWidth);
        }
      } catch {
        /* cross-origin or not yet loaded — ignore */
      }
    }
    return Math.max(min, Math.min(contentWidth, max));
  }

  /**
   * Sizes each preview iframe to the full height of its (same-origin) content, so the preview-body
   * (`overflow: auto`) is the scroll container. A fixed-height iframe (340px, or 100% when enlarged)
   * would clip a taller element and show no usable scrollbar — especially when the mirrored element's
   * own CSS suppresses scrolling inside its document. Growing the frame to its content lets the body
   * scroll the whole element instead, which works in both the floating and the enlarged state.
   */
  private fitFrameHeight(): void {
    const bodyClient = this.previewBody.clientHeight;
    for (const frame of Array.from(this.previewBody.querySelectorAll("iframe"))) {
      try {
        const doc = frame.contentDocument;
        if (doc?.body) {
          const contentHeight = doc.body.scrollHeight;
          // Never shrink below the visible body (nothing to scroll), but grow to reveal all content.
          frame.style.height = `${Math.max(bodyClient, contentHeight)}px`;
        }
      } catch {
        /* cross-origin, not yet loaded, or detached — keep the current height */
      }
    }
  }

  /** Positions the floating preview next to the last anchor, preferring the left side, clamped. */
  private positionPreview(): void {
    const anchor = this.lastAnchor;
    if (!anchor || this.preview.hidden) {
      return;
    }
    // Grow each iframe to the full height of its content so the preview-body (overflow:auto) is the
    // thing that scrolls. A fixed-height iframe would otherwise clip the element with no scrollbar.
    this.fitFrameHeight();
    if (this.maximized) {
      this.positionMaximized();
      return;
    }
    // Floating (non-maximized): drop the maximized height and size the width to fit the content
    // (clamped to the window so it is never cut off). The exact height is left to the stylesheet.
    this.preview.style.height = "";
    this.preview.style.width = `${this.fitFloatingWidth()}px`;
    const rect = anchor.getBoundingClientRect();
    const width = this.preview.offsetWidth;
    const height = this.preview.offsetHeight;
    let left = rect.left - width - PREVIEW_GAP;
    if (left < VIEWPORT_MARGIN) {
      left = rect.right + PREVIEW_GAP;
    }
    left = Math.min(left, window.innerWidth - width - VIEWPORT_MARGIN);
    let top = rect.top;
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, window.innerHeight - height - VIEWPORT_MARGIN));

    this.preview.style.left = `${left}px`;
    this.preview.style.top = `${top}px`;
  }

  /** The fixed right-hand "element properties" panel that hosts the Mirror dropdowns. */
  private propertiesPanel(): HTMLElement | null {
    const candidates = ["#tabsRight", '[id$=":tabsRight"]', '[id*=":tabsRight"]'];
    for (const selector of candidates) {
      const el = document.querySelector<HTMLElement>(selector);
      // `fixed`-positioned elements always report `offsetParent === null`, so test visibility via size.
      if (el && (el.getBoundingClientRect().width > 0 || el.getBoundingClientRect().height > 0)) {
        return el;
      }
    }
    return null;
  }

  /**
   * When maximized the preview fills the designer canvas: it spans from the left edge of the
   * viewport to the LEFT edge of the element-properties panel (so it never overlaps the Mirror
   * widget's config) and uses nearly the full available height. The content scrolls vertically
   * inside the {@link #previewBody} scroll area.
   */
  private positionMaximized(): void {
    const margin = VIEWPORT_MARGIN;
    const panel = this.propertiesPanel();
    const rect = panel ? panel.getBoundingClientRect() : null;

    const left = margin;
    const top = rect ? Math.max(margin, rect.top + margin) : margin;
    const right = rect ? Math.max(left + 2 * margin, rect.left - margin) : window.innerWidth - margin;
    const bottom = rect
      ? Math.min(window.innerHeight - margin, Math.max(top + 2 * margin, rect.bottom - margin))
      : window.innerHeight - margin;

    this.preview.style.left = `${left}px`;
    this.preview.style.top = `${top}px`;
    this.preview.style.width = `${Math.max(0, right - left)}px`;
    this.preview.style.height = `${Math.max(0, bottom - top)}px`;
  }
}
