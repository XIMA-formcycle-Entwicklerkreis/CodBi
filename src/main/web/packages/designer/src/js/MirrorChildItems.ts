// #region Imports
import { Constants } from "codbi-common";
import {
  MIRROR_SOURCE_REVISION_PROPERTY,
  MIRROR_SOURCE_VERSION_PROPERTY,
  mirrorElementOptions,
  mirrorElementTree,
  mirrorFormOptions,
  mirrorFormStamp,
  normalizeMirrorFormName,
  type IMirrorNode,
  type IMirrorOption,
} from "./MirrorSelect.js";
// #endregion Imports

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
  getSelectedItemsData?(): IMirrorItemLike[];
  getSelectedItems?(): JQuery;
  getItem?(el: unknown): IMirrorItemLike | undefined;
  getValueAbleItems?(useCached?: boolean): unknown[];
  generateUniqueItemId?(className: string): string;
  /** The designer's persist differ — nudged after a direct property write. */
  getPersistDiffer?(): { checkForChanges?(): void } | undefined;
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

/** Mirror properties holding the source form/element references and their cached names. */
const MIRROR_FORM_PROPERTY = String(Constants["mirror.property.form"]);
const MIRROR_FORM_NAME_PROPERTY = String(Constants["mirror.property.form_name"]);
const MIRROR_ELEMENT_PROPERTY = String(Constants["mirror.property.element"]);
const MIRROR_ELEMENT_KEY_PROPERTY = String(Constants["mirror.property.element_key"]);

/**
 * The item currently being edited. Some designer entry points only expose the selection through
 * `getSelectedItems()` + `getItem()`, so do not rely on `getSelectedMasterItem()` alone — that was
 * why the Mirror form editor could fail to repair its reference even though it knew the old value.
 */
function selectedMirrorItem(designer: IDesignerLike | undefined): IMirrorItemLike | undefined {
  if (!designer) {
    return undefined;
  }
  try {
    const master = designer.getSelectedMasterItem?.();
    if (master) {
      return master;
    }
  } catch {
    /* try the other access paths */
  }
  try {
    const first = designer.getSelectedItemsData?.()?.[0];
    if (first) {
      return first;
    }
  } catch {
    /* try the other access paths */
  }
  try {
    const selected = designer.getSelectedItems?.();
    return selected ? designer.getItem?.(selected) : undefined;
  } catch {
    return undefined;
  }
}

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

/**
 * @returns every writable property bag of an item — the persisted one (`getPersist().properties`)
 * and the live one (`item.properties`) when they are distinct objects.
 */
function writablePropertyBags(item: IMirrorItemLike): TItemProperties[] {
  const bags: TItemProperties[] = [];
  let persisted: TItemProperties | undefined;
  try {
    persisted = item.getPersist?.()?.properties;
  } catch {
    persisted = undefined;
  }
  if (persisted) {
    bags.push(persisted);
  }
  if (item.properties && item.properties !== persisted) {
    bags.push(item.properties);
  }
  return bags;
}

/** Nudges the designer's persist differ so a direct property write is synced to the server. */
function notifyDesignerChanged(designer: IDesignerLike): void {
  try {
    designer.getPersistDiffer?.()?.checkForChanges?.();
  } catch {
    /* ignore */
  }
}

/**
 * Writes the source-form reference into the Mirror's property bags:
 * `codbi_mirror_form` receives the `project-<id>` key, `codbi_mirror_form_name` its title. The title
 * is the second half of the strict validity check: if the form at that id is later renamed, the
 * Mirror must become invalid instead of silently mirroring the renamed form.
 */
function writeMirrorFormReference(designer: IDesignerLike, mirror: IMirrorItemLike, option: IMirrorOption): void {
  const bags = writablePropertyBags(mirror);
  if (bags.length === 0) {
    return;
  }
  for (const props of bags) {
    props[MIRROR_FORM_PROPERTY] = option.value;
    props[MIRROR_FORM_NAME_PROPERTY] = option.text;
  }
  notifyDesignerChanged(designer);
  console.info(`[CodBi] Mirror: source form reference "${option.text}" -> "${option.value}".`);
}

/**
 * Writes ONLY the stored project id (`codbi_mirror_form`), leaving the cached title untouched.
 * Used when a form carrying the stored title was found under a NEW id (re-import): the stored title
 * must keep validating the link, so only the id is corrected.
 */
function writeMirrorFormKey(designer: IDesignerLike, mirror: IMirrorItemLike, key: string): void {
  const bags = writablePropertyBags(mirror);
  if (bags.length === 0) {
    return;
  }
  for (const props of bags) {
    props[MIRROR_FORM_PROPERTY] = key;
  }
  notifyDesignerChanged(designer);
}

/**
 * Remembers the chosen source form on the SELECTED Mirror: writes `codbi_mirror_form` and the
 * cached `codbi_mirror_form_name`. Both are required to validate the link later.
 */
export function rememberMirrorFormReference(designerLike: unknown, option: IMirrorOption): void {
  const designer = designerLike as IDesignerLike;
  const mirror = selectedMirrorItem(designer);
  if (mirror) {
    writeMirrorFormReference(designer, mirror, option);
  }
}

/** @returns the newest option whose title matches [name] (optionally excluding [excludeKey]). */
function newestOptionByName(options: IMirrorOption[], name: string, excludeKey?: string): IMirrorOption | undefined {
  const wanted = normalizeMirrorFormName(name);
  if (!wanted) {
    return undefined;
  }
  let best: IMirrorOption | undefined;
  for (const option of options) {
    if (option.value === excludeKey || normalizeMirrorFormName(option.text) !== wanted) {
      continue;
    }
    const id = Number(/^project-(\d+)$/.exec(option.value.trim())?.[1] ?? 0);
    const bestId = best ? Number(/^project-(\d+)$/.exec(best.value.trim())?.[1] ?? 0) : -1;
    if (!best || id > bestId) {
      best = option;
    }
  }
  return best;
}

/**
 * Applies the same rule as the backend to the form options:
 * 1. the stored key still exists and its title matches → keep it;
 * 2. otherwise, if a form carries the STORED title → use that form and rewrite ONLY the stored id;
 * 3. otherwise → leave the reference untouched (invalid; the designer hint explains why).
 */
function resolveMirrorFormReference(
  designer: IDesignerLike,
  mirror: IMirrorItemLike,
  options: IMirrorOption[],
  storedKey: string,
  storedName: string,
): { key: string; rebound: boolean } {
  const byKey = storedKey ? options.find((option) => option.value === storedKey) : undefined;
  if (byKey) {
    const wanted = normalizeMirrorFormName(storedName);
    if (!wanted || normalizeMirrorFormName(byKey.text) === wanted) {
      return { key: storedKey, rebound: false };
    }
    const byName = newestOptionByName(options, storedName, storedKey);
    if (byName) {
      writeMirrorFormKey(designer, mirror, byName.value);
      console.info(
        `[CodBi] Mirror: re-bound source form from stale key "${storedKey}" to "${byName.value}" by stored title "${storedName}".`,
      );
      return { key: byName.value, rebound: true };
    }
    return { key: storedKey, rebound: false };
  }
  if (!storedName) {
    return { key: storedKey, rebound: false };
  }
  const byName = newestOptionByName(options, storedName);
  if (!byName) {
    return { key: storedKey, rebound: false };
  }
  writeMirrorFormKey(designer, mirror, byName.value);
  console.info(
    `[CodBi] Mirror: re-bound source form from deleted key "${storedKey}" to "${byName.value}" by stored title "${storedName}".`,
  );
  return { key: byName.value, rebound: true };
}

/**
 * Selected-item wrapper for {@link resolveMirrorFormReference}: returns the (possibly corrected)
 * project key so the form editor can immediately show the form and reload the element dropdown.
 */
export function resolveSelectedMirrorForm(
  designerLike: unknown,
  options: IMirrorOption[],
  storedKey: string,
  storedName: string,
): string {
  const designer = designerLike as IDesignerLike;
  const mirror = selectedMirrorItem(designer);
  if (!mirror) {
    return storedKey;
  }
  return resolveMirrorFormReference(designer, mirror, options, storedKey, storedName).key;
}

/**
 * Recovers the source element's technical NAME from the Mirror's generated child items. The ROOT
 * copied item (its `parentid` is the Mirror id) carries the namespaced name `<mirrorName>_<name>`;
 * stripping the prefix yields the source element's designer name (e.g. `txt6`). This also works
 * after the source form/element was deleted, because the copies live in the TARGET form.
 */
function elementNameFromChildren(designer: IDesignerLike, mirror: IMirrorItemLike): string {
  const mirrorId = mirror.getId?.() ?? "";
  if (!mirrorId) {
    return "";
  }
  const mirrorName = String(propertiesOf(mirror)?.name ?? "") || mirrorId;
  const prefix = `${mirrorName}_`;
  for (const item of Object.values(designer.items ?? {})) {
    const props = propertiesOf(item);
    if (!props) {
      continue;
    }
    if (String(props[MIRROR_OWNER_PROPERTY] ?? "") !== mirrorId) {
      continue;
    }
    if (String(props.parentid ?? "") !== mirrorId) {
      continue;
    }
    const name = String(props.name ?? "").trim();
    if (!name) {
      continue;
    }
    return name.startsWith(prefix) ? name.slice(prefix.length) : name;
  }
  return "";
}

/** Writes ONLY the cached element technical name (`codbi_mirror_element_key`). */
function writeMirrorElementKey(designer: IDesignerLike, mirror: IMirrorItemLike, key: string): void {
  const bags = writablePropertyBags(mirror);
  if (bags.length === 0) {
    return;
  }
  for (const props of bags) {
    props[MIRROR_ELEMENT_KEY_PROPERTY] = key;
  }
  notifyDesignerChanged(designer);
}

/** Writes the element reference (id + technical name) into the Mirror's property bags. */
function writeMirrorElementReference(designer: IDesignerLike, mirror: IMirrorItemLike, option: IMirrorOption): void {
  const bags = writablePropertyBags(mirror);
  if (bags.length === 0) {
    return;
  }
  const key = option.name || option.text || option.value;
  for (const props of bags) {
    props[MIRROR_ELEMENT_PROPERTY] = option.value;
    props[MIRROR_ELEMENT_KEY_PROPERTY] = key;
  }
  notifyDesignerChanged(designer);
}

/** Remembers the chosen element on the SELECTED Mirror (id + technical name). */
export function rememberMirrorElementReference(designerLike: unknown, option: IMirrorOption): void {
  const designer = designerLike as IDesignerLike;
  const mirror = selectedMirrorItem(designer);
  if (mirror) {
    writeMirrorElementReference(designer, mirror, option);
  }
}

/** @returns the element option whose technical name equals [name] (id excluded when given). */
function elementOptionByName(options: IMirrorOption[], name: string, excludeId?: string): IMirrorOption | undefined {
  const wanted = name.trim();
  if (!wanted) {
    return undefined;
  }
  return options.find((option) => option.value !== excludeId && (option.name || option.text) === wanted);
}

/**
 * Applies the element id/name reconciliation:
 * 1. the stored element id still exists and its technical name matches → keep it;
 * 2. otherwise, an element carrying the STORED technical name → use it and rewrite the id;
 * 3. otherwise → if the id still exists, accept its current name (renamed element); if neither
 *    exists, leave the reference untouched (the designer hint reports the missing element).
 */
function resolveMirrorElementReference(
  designer: IDesignerLike,
  mirror: IMirrorItemLike,
  options: IMirrorOption[],
  storedId: string,
  storedKey: string,
): { id: string; rebound: boolean } {
  const byId = storedId ? options.find((option) => option.value === storedId) : undefined;
  if (byId) {
    const actualKey = byId.name || byId.text || byId.value;
    if (!storedKey || storedKey === actualKey) {
      if (!storedKey) {
        writeMirrorElementKey(designer, mirror, actualKey);
      }
      return { id: storedId, rebound: false };
    }
    const byName = elementOptionByName(options, storedKey, storedId);
    if (byName) {
      writeMirrorElementReference(designer, mirror, byName);
      console.info(
        `[CodBi] Mirror: re-bound element from stale id "${storedId}" to "${byName.value}" by stored name "${storedKey}".`,
      );
      return { id: byName.value, rebound: true };
    }
    // The element was renamed but not replaced: keep the id and update the cached name.
    writeMirrorElementKey(designer, mirror, actualKey);
    return { id: storedId, rebound: false };
  }
  if (!storedKey) {
    return { id: storedId, rebound: false };
  }
  const byName = elementOptionByName(options, storedKey);
  if (!byName) {
    return { id: storedId, rebound: false };
  }
  writeMirrorElementReference(designer, mirror, byName);
  console.info(
    `[CodBi] Mirror: re-bound element from deleted id "${storedId}" to "${byName.value}" by stored name "${storedKey}".`,
  );
  return { id: byName.value, rebound: true };
}

/** Selected-item wrapper for the element reconciliation; returns the (possibly new) element id. */
export function resolveSelectedMirrorElement(
  designerLike: unknown,
  options: IMirrorOption[],
  storedId: string,
  storedKey: string,
): string {
  const designer = designerLike as IDesignerLike;
  const mirror = selectedMirrorItem(designer);
  if (!mirror) {
    return storedId;
  }
  return resolveMirrorElementReference(designer, mirror, options, storedId, storedKey).id;
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
  elementKey?: string,
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

  removeGeneratedChildren(designer, mirrorId);

  if (!form || !element) {
    return;
  }

  const tree = await mirrorElementTree(form, element, elementKey);
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
      placeInsideParent(parentItem, item);
      itemByRef.set(node.ref, item);
      created += 1;
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
  const mirror = selectedMirrorItem(designer);
  const props = propertiesOf(mirror);
  const form = String(props?.[MIRROR_FORM_PROPERTY] ?? "");
  const formName = String(props?.[MIRROR_FORM_NAME_PROPERTY] ?? "");
  const element = String(props?.[MIRROR_ELEMENT_PROPERTY] ?? "");
  const elementKey = String(props?.[MIRROR_ELEMENT_KEY_PROPERTY] ?? "");
  if (!props || !form || !element) {
    return;
  }
  const options = await mirrorFormOptions();
  const { key: formKey, rebound } = resolveMirrorFormReference(designer, mirror, options, form, formName);
  let elementRef = element;
  let elementRebound = false;
  if (options.some((option) => option.value === formKey)) {
    const elementOptions = await mirrorElementOptions(formKey);
    const resolvedElement = resolveMirrorElementReference(designer, mirror, elementOptions, element, elementKey);
    elementRef = resolvedElement.id;
    elementRebound = resolvedElement.rebound;
  }
  const finalElementKey = String(propertiesOf(mirror)?.[MIRROR_ELEMENT_KEY_PROPERTY] ?? elementKey);
  const storedVersion = Number(props[MIRROR_SOURCE_VERSION_PROPERTY] ?? 0);
  const storedRevision = Number(props[MIRROR_SOURCE_REVISION_PROPERTY] ?? 0);
  const stamp = await mirrorFormStamp(formKey);
  const revisionChanged = stamp.revision !== 0 && stamp.revision !== storedRevision;
  const versionChanged = stamp.version !== 0 && stamp.version !== storedVersion;
  if (rebound || elementRebound || revisionChanged || versionChanged) {
    await syncMirrorChildren(designer, formKey, elementRef, mirror, finalElementKey);
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
  // Fetch the form list ONCE. Element lists are cached per source form within this pass.
  const options = await mirrorFormOptions();
  const elementOptionsByForm = new Map<string, IMirrorOption[]>();
  const elementOptionsFor = async (formKey: string): Promise<IMirrorOption[]> => {
    const cached = elementOptionsByForm.get(formKey);
    if (cached) {
      return cached;
    }
    const loaded = await mirrorElementOptions(formKey);
    elementOptionsByForm.set(formKey, loaded);
    return loaded;
  };
  const items = Object.values(designer.items ?? {});
  for (const item of items) {
    const props = propertiesOf(item);
    if (!props) {
      continue;
    }
    const form = String(props[MIRROR_FORM_PROPERTY] ?? "");
    const formName = String(props[MIRROR_FORM_NAME_PROPERTY] ?? "");
    const element = String(props[MIRROR_ELEMENT_PROPERTY] ?? "");
    let elementKey = String(props[MIRROR_ELEMENT_KEY_PROPERTY] ?? "");
    if (!form || !element) {
      continue;
    }
    // Older/newly imported Mirrors may not have the element name cached. Recover it from the
    // generated child items BEFORE trying to resolve the (possibly already deleted) source element.
    if (!elementKey) {
      const derived = elementNameFromChildren(designer, item);
      if (derived) {
        writeMirrorElementKey(designer, item, derived);
        elementKey = derived;
        // Re-render the widget so the server-side designer hint immediately shows the recovered name.
        try {
          await item.draw?.();
        } catch {
          /* redraw is best effort */
        }
      }
    }
    // If the stored id is stale/mismatched but a form with the STORED title exists (the normal
    // re-import case), rewrite ONLY the stored id. Never overwrite the stored title.
    const { key: formKey, rebound } = resolveMirrorFormReference(designer, item, options, form, formName);
    // Backfill the title for older Mirrors that never stored it. A MISMATCHED title is left
    // untouched: that is exactly the invalid state the designer hint reports.
    if (!formName) {
      const option = options.find((entry) => entry.value === formKey);
      if (option) {
        writeMirrorFormReference(designer, item, option);
      }
    }
    // Reconcile the element by its TECHNICAL name when its internal id changed (element deleted
    // and recreated with the same designer name).
    let elementRef = element;
    let elementRebound = false;
    if (options.some((option) => option.value === formKey)) {
      const elementOptions = await elementOptionsFor(formKey);
      const resolvedElement = resolveMirrorElementReference(designer, item, elementOptions, element, elementKey);
      elementRef = resolvedElement.id;
      elementRebound = resolvedElement.rebound;
    }
    const finalElementKey = String(propertiesOf(item)?.[MIRROR_ELEMENT_KEY_PROPERTY] ?? elementKey);
    const storedRevision = Number(props[MIRROR_SOURCE_REVISION_PROPERTY] ?? 0);
    const stamp = await mirrorFormStamp(formKey);
    if (rebound || elementRebound || (stamp.revision !== 0 && stamp.revision !== storedRevision)) {
      await syncMirrorChildren(designer, formKey, elementRef, item, finalElementKey);
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
  }
} catch {
  /* cross-origin top — ignore */
}

// #endregion Debug hook
