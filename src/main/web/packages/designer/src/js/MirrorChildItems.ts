// #region Imports
import { Constants } from "codbi-common";
import {
  MIRROR_SOURCE_REVISION_PROPERTY,
  MIRROR_SOURCE_VERSION_PROPERTY,
  mirrorElementTree,
  mirrorFormStamp,
  type IMirrorNode,
} from "./MirrorSelect.js";
// #endregion Imports

// Unconditional marker so it is obvious in the browser console whether the CURRENT designer bundle
// (the one with the child-items feature) is loaded — a stale cache would otherwise hide the logs.
console.log("[CodBi] MirrorChildItems module loaded");

/**
 * Materializes a Mirror widget's source element as REAL child items.
 *
 * ## Why
 * The values a user enters in a mirrored field must be usable as `[%fieldName%]` placeholders in the
 * target form's workflows/mails, and the fields must appear in the placeholder dialog. Both the form
 * designer's dialog (`getValueAbleItems`) and the workflow designer's email-node dialog enumerate
 * the form's **persisted items** — rendered-only HTML is never listed. So the source element's items
 * have to become ordinary FORMCYCLE items, nested under the Mirror.
 *
 * ## How
 * The Mirror widget is an appendable container (`IXItemAppendable`); the form renderer nests child
 * items into it because the widget registers its wrapper via `renderCtx.registerParent`. Nesting is
 * expressed by the child's `properties.parentid`. We therefore copy the WHOLE subtree of the source
 * element (containers/fieldsets AND fields) as real items, preserving the hierarchy, each carrying
 * its source properties (label/options/layout) so the copy looks like the source. Field `name`s are
 * kept native so `[%name%]` resolves in workflows/mails.
 *
 * The designer's public API has no item factory, so we use the designer instance's internal
 * `_createItemFromCatalogue(className, descriptor, parentId)`. All access is defensive.
 */

/** Property bag FORMCYCLE stores per item (name, id, parentid, …). */
type TItemProperties = Record<string, unknown>;

/** Minimal structural view of a designer `Item` — only what we use. */
interface IMirrorItemLike {
  getId(): string;
  getPersist?(): { properties?: TItemProperties } | undefined;
  properties?: TItemProperties;
  remove?(): void;
  /** The item's own `<table.xm-item-container>` (jQuery). */
  getContainer?(): JQuery | undefined;
  /** The cell that holds the item's content (where this item's children belong). */
  getItemContentCell?(): JQuery | undefined;
  /** Recomputes `properties.parentid` from the closest ancestor item container. */
  refreshAndSetParentId?(): void;
  draw?(): Promise<void>;
}

/** Minimal structural view of the designer internals we rely on. */
interface IDesignerLike {
  items?: Record<string, IMirrorItemLike>;
  getSelectedMasterItem?(): IMirrorItemLike | undefined;
  getValueAbleItems?(useCached?: boolean): unknown[];
  generateUniqueItemId?(className: string): string;
  _createItemFromCatalogue?: (
    className: string,
    descriptor: { properties: TItemProperties; use_name_idx?: boolean },
    parentId?: string,
    noDraw?: boolean,
  ) => IMirrorItemLike;
  _createItem?: (
    className: string,
    forceRender?: boolean,
    properties?: TItemProperties,
    noDraw?: boolean,
    parentId?: string,
  ) => IMirrorItemLike;
}

/**
 * Marker property stored on items this module generates, so they can be found and removed again when
 * the Mirror is reconfigured — even after a designer reload.
 */
export const MIRROR_OWNER_PROPERTY = "codbi_mirror_owner";

/**
 * CSS class applied to the generated copies. The published form hides it (see `XMirror.getCssData`),
 * so the copies never duplicate the live-rendered fields at runtime.
 */
export const MIRROR_COPY_CSS_CLASS = "codbi-mirror-copy";

/** Reads the persisted properties of an item, preferring `getPersist()`. */
function propertiesOf(item: IMirrorItemLike | undefined): TItemProperties | undefined {
  if (!item) {
    return undefined;
  }
  try {
    const persisted = item.getPersist?.()?.properties;
    if (persisted) {
      return persisted;
    }
  } catch {
    /* fall through to the live properties bag */
  }
  return item.properties;
}

/** @returns the ids of the child items this module previously generated for [mirrorId]. */
function generatedChildIds(designer: IDesignerLike, mirrorId: string): string[] {
  const items = designer.items ?? {};
  const ids: string[] = [];
  for (const [id, item] of Object.entries(items)) {
    const props = propertiesOf(item);
    if (props && String(props[MIRROR_OWNER_PROPERTY] ?? "") === mirrorId) {
      ids.push(id);
    }
  }
  return ids;
}

/** Removes all child items previously generated for [mirrorId]. */
function removeGeneratedChildren(designer: IDesignerLike, mirrorId: string): void {
  for (const id of generatedChildIds(designer, mirrorId)) {
    try {
      designer.items?.[id]?.remove?.();
    } catch (x) {
      console.error("[CodBi] Mirror: could not remove generated child", id, x);
    }
  }
}

/**
 * Places a freshly created item's DOM inside the given parent item's content cell (or its own
 * appendable wrapper, for the Mirror). Mirrors the designer's own drop rule: children go into the
 * cell's `.XItem` element when one exists, otherwise directly into the cell. We must NOT call
 * `preRendered` here — that re-binds pre-rendered markup and throws "The new child element contains
 * the parent" for an already created item.
 */
function placeInsideParent(parent: IMirrorItemLike, item: IMirrorItemLike): boolean {
  try {
    const cell = parent.getItemContentCell?.();
    const container = item.getContainer?.();
    if (!cell || !container || container.length === 0) {
      console.warn("[CodBi] Mirror: no content cell/container to place the child item into");
      return false;
    }
    const parentId = parent.getId?.() ?? "";
    const appendable = parentId
      ? cell.find(`[data-xm-appendable="${parentId}"]`).first()
      : cell.find(".codbi-mirror").first();
    const target =
      appendable.length > 0
        ? appendable
        : cell.find(".codbi-mirror").first().length > 0
          ? cell.find(".codbi-mirror").first()
          : cell.find(".XItem").first().length > 0
            ? cell.find(".XItem").first()
            : cell;
    target.append(container);
    item.refreshAndSetParentId?.();
    return true;
  } catch (x) {
    console.error("[CodBi] Mirror: could not place the child item into the parent", x);
    return false;
  }
}

/** Copies a source node's properties, dropping the ones the designer assigns itself. */
function propertiesForNode(node: IMirrorNode, mirrorId: string, namePrefix: string): TItemProperties {
  const properties: TItemProperties = {};
  for (const [key, value] of Object.entries(node.properties ?? {})) {
    if (key !== "id" && key !== "parentid" && key !== "rowid") {
      properties[key] = value;
    }
  }
  if (node.name) {
    // Namespace the field name with the Mirror's name, identical to the live render — this is the
    // name the workflow placeholder dialog lists and that `[%name%]` must use.
    properties.name = `${namePrefix}${node.name}`;
  }
  properties[MIRROR_OWNER_PROPERTY] = mirrorId;
  // The generated items exist so the fields appear in the placeholder dialog. At RUNTIME the Mirror
  // renders the source LIVE and submits those inputs; the copies must therefore not duplicate them:
  // they get the hidden class (CSS in `XMirror.getCssData`) and are disabled so they never submit.
  const classes = Array.isArray(properties.cssclasses) ? [...properties.cssclasses] : [];
  if (!classes.includes(MIRROR_COPY_CSS_CLASS)) {
    classes.push(MIRROR_COPY_CSS_CLASS);
  }
  properties.cssclasses = classes;
  properties.isdisabled = "1";
  return properties;
}

/**
 * Synchronizes the Mirror widget's generated child items with the chosen source element: removes the
 * children generated on the previous configuration and, when a source element is selected, copies
 * its whole subtree (containers/fieldsets AND fields), preserving the hierarchy.
 *
 * Safe to call with an empty [element] (e.g. after the source form changed) — this only clears.
 *
 * @param designer the form designer instance (e.g. `editor.config.designer`).
 * @param form the source form key (`project-<id>`), or `""`.
 * @param element the source element reference (id or name), or `""`.
 * @param explicitMirror the Mirror item to populate; defaults to the selected item.
 */
export async function syncMirrorChildren(
  designerLike: unknown,
  form: string,
  element: string,
  explicitMirror?: IMirrorItemLike,
): Promise<void> {
  const designer = designerLike as IDesignerLike;
  if (!designer) {
    return;
  }
  lastDesigner = designer;
  const mirror = explicitMirror ?? designer.getSelectedMasterItem?.();
  const mirrorId = mirror?.getId?.();
  if (!mirrorId) {
    console.warn("[CodBi] Mirror: no Mirror item — nothing to do");
    return;
  }

  const removed = generatedChildIds(designer, mirrorId);
  removeGeneratedChildren(designer, mirrorId);
  console.log("[CodBi] Mirror: sync mirror=%s form=%s element=%s removed=%d", mirrorId, form, element, removed.length);

  if (!form || !element) {
    return;
  }

  const tree = await mirrorElementTree(form, element);
  console.log("[CodBi] Mirror: subtree nodes=%d version=%s", tree.items.length, tree.version);
  if (tree.items.length === 0) {
    return;
  }

  const createFromCatalogue = designer._createItemFromCatalogue?.bind(designer);
  const create = designer._createItem?.bind(designer);
  if (!createFromCatalogue && !create) {
    console.warn(
      "[CodBi] Mirror: the designer exposes no item factory (_createItemFromCatalogue / _createItem) — the linked elements are not materialized.",
    );
    return;
  }

  // The Mirror's own NAME is the namespace for the mirrored field names (must match the live
  // render's name prefix so `[%namespacedName%]` resolves).
  const mirrorName = String(propertiesOf(mirror)?.name ?? "") || mirrorId;
  const namePrefix = `${mirrorName}_`;

  // Source ref -> created item, so children can be nested under their copied parent.
  const itemByRef = new Map<string, IMirrorItemLike>();
  let created = 0;
  for (const node of tree.items) {
    const className = node.className || "XTextField";
    const properties = propertiesForNode(node, mirrorId, namePrefix);
    const parentItem = (node.parentRef ? itemByRef.get(node.parentRef) : undefined) ?? mirror;
    const parentId = parentItem?.getId?.() ?? mirrorId;
    try {
      const item = createFromCatalogue
        ? createFromCatalogue(className, { properties }, parentId)
        : create?.(className, false, properties, false, parentId);
      if (!item) {
        console.error("[CodBi] Mirror: the item factory returned no item for", node.ref, className);
        continue;
      }
      // The factory draws asynchronously; wait so we move the FINAL container.
      try {
        await item.draw?.();
      } catch (x) {
        console.warn("[CodBi] Mirror: draw() failed for", node.ref, x);
      }
      const placed = placeInsideParent(parentItem, item);
      itemByRef.set(node.ref, item);
      created += 1;
      console.log(
        "[CodBi] Mirror: created %s (%s) id=%s parent=%s placed=%s",
        node.name || node.ref,
        className,
        item.getId?.(),
        parentId,
        placed,
      );
    } catch (x) {
      console.error("[CodBi] Mirror: could not create node", node.ref, className, x);
    }
  }

  // Remember which source version these copies came from, so a later change can be detected.
  try {
    const props = (propertiesOf(mirror) ?? mirror.properties ?? {}) as TItemProperties;
    props[MIRROR_SOURCE_VERSION_PROPERTY] = tree.version;
    props[MIRROR_SOURCE_REVISION_PROPERTY] = tree.revision;
  } catch {
    /* ignore */
  }

  console.log("[CodBi] Mirror: materialized %d/%d node(s) into %s", created, tree.items.length, mirrorId);
  try {
    // Drop the designer's cached value-able items so the placeholder dialog sees the new fields.
    designer.getValueAbleItems?.(false);
  } catch {
    /* ignore */
  }
}

/**
 * Re-synchronizes the Mirror if its source form changed since the Mirror's child items were last
 * generated (their copied items would otherwise be stale). Intended to run when the Mirror's
 * properties are opened.
 */
export async function refreshMirrorIfStale(designerLike: unknown): Promise<void> {
  const designer = designerLike as IDesignerLike;
  if (!designer) {
    return;
  }
  const mirror = designer.getSelectedMasterItem?.();
  const props = propertiesOf(mirror);
  const form = String(props?.[String(Constants["mirror.property.form"])] ?? "");
  const element = String(props?.[String(Constants["mirror.property.element"])] ?? "");
  console.log("[CodBi] Mirror: staleness check mirrorId=%s form=%s element=%s", mirror?.getId?.(), form, element);
  if (!props || !form || !element) {
    return;
  }
  const storedVersion = Number(props[MIRROR_SOURCE_VERSION_PROPERTY] ?? 0);
  const storedRevision = Number(props[MIRROR_SOURCE_REVISION_PROPERTY] ?? 0);
  const stamp = await mirrorFormStamp(form);
  console.log(
    "[CodBi] Mirror: staleness version %s->%s revision %s->%s",
    storedVersion,
    stamp.version,
    storedRevision,
    stamp.revision,
  );
  const revisionChanged = stamp.revision !== 0 && stamp.revision !== storedRevision;
  const versionChanged = stamp.version !== 0 && stamp.version !== storedVersion;
  if (revisionChanged || versionChanged) {
    await syncMirrorChildren(designer, form, element, mirror);
  }
}

/**
 * Re-synchronizes EVERY Mirror of the current form whose source changed, so the copied fields match
 * the current source form. Intended to run when a form is loaded into the designer
 * (`designer-form-loaded`): the copies are otherwise only refreshed when the source element is
 * re-picked.
 *
 * @param designerLike the form designer instance.
 */
export async function refreshAllMirrors(designerLike: unknown): Promise<void> {
  const designer = designerLike as IDesignerLike;
  if (!designer) {
    return;
  }
  const items = Object.values(designer.items ?? {});
  console.log("[CodBi] Mirror: form loaded — checking %d item(s)", items.length);
  for (const item of items) {
    const props = propertiesOf(item);
    if (!props) {
      continue;
    }
    const form = String(props[String(Constants["mirror.property.form"])] ?? "");
    const element = String(props[String(Constants["mirror.property.element"])] ?? "");
    if (!form || !element) {
      continue;
    }
    const storedRevision = Number(props[MIRROR_SOURCE_REVISION_PROPERTY] ?? 0);
    const stamp = await mirrorFormStamp(form);
    console.log("[CodBi] Mirror: %s revision stored=%s current=%s", item.getId?.(), storedRevision, stamp.revision);
    if (stamp.revision !== 0 && stamp.revision !== storedRevision) {
      await syncMirrorChildren(designer, form, element, item);
    }
  }
}

// #region Debug hook

/** The designer captured by the most recent [syncMirrorChildren] call (for the debug hook). */
let lastDesigner: IDesignerLike | null = null;

/** Concise computed-style/geometry summary of an element, for the debug hook. */
function describeElement(el: Element | null | undefined): Record<string, unknown> | null {
  if (!el) {
    return null;
  }
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName,
    cls: (el as HTMLElement).className,
    display: cs.display,
    visibility: cs.visibility,
    opacity: cs.opacity,
    position: cs.position,
    height: cs.height,
    overflow: cs.overflow,
    rectW: Math.round(rect.width),
    rectH: Math.round(rect.height),
  };
}

/**
 * TEMPORARY diagnostic hook. Run `__codbiMirrorDebug()` in the browser console after selecting a
 * source element. It reaches into the designer's (shadow-rooted/iframe) canvas via the designer API,
 * which `document.querySelector` cannot.
 */
const mirrorDebugFn = () => {
  const d = lastDesigner;
  if (!d) {
    return "no designer captured yet — select a source element for the Mirror first";
  }
  const mirror = d.getSelectedMasterItem?.();
  const cell = mirror?.getItemContentCell?.();
  const cellEl = cell?.[0] ?? null;
  const containerEl = mirror?.getContainer?.()?.[0] ?? null;
  const childTable = cellEl?.querySelector("table.xm-item-container") ?? null;
  return {
    mirrorId: mirror?.getId?.(),
    cellExists: Boolean(cellEl),
    cellInDocument: cellEl?.isConnected ?? false,
    cellStyle: describeElement(cellEl),
    childTableCount: cellEl?.querySelectorAll("table.xm-item-container").length ?? 0,
    childStyle: describeElement(childTable),
    childChildCount: childTable?.children.length ?? -1,
    wrapper: describeElement(cellEl?.querySelector(".codbi-mirror")),
    mirrorContainerStyle: describeElement(containerEl),
    cellHtml: cellEl?.outerHTML?.slice(0, 3000) ?? "",
    mirrorHtml: containerEl?.outerHTML?.slice(0, 3000) ?? "",
  };
};

// The plugin runs in the designer frame; the DevTools console usually evaluates in the TOP frame.
// Assign the hook to both so `__codbiMirrorDebug()` works wherever the user types it (when
// same-origin; cross-origin access to `top` is ignored).
(window as unknown as Record<string, unknown>).__codbiMirrorDebug = mirrorDebugFn;
try {
  const topWindow = window.top as unknown as Record<string, unknown> | null;
  if (topWindow && topWindow !== (window as unknown as Record<string, unknown>)) {
    topWindow.__codbiMirrorDebug = mirrorDebugFn;
    console.log("[CodBi] Mirror: debug hook installed on window.top");
  }
} catch {
  /* cross-origin top — ignore */
}

// #endregion Debug hook
