// #region Imports
import { instance } from "@de-xima/fc-form-designer";
// #endregion Imports

/**
 * Marker property stored on the item this module creates for a Functionality widget, so it can be
 * found and removed again when the contained element TYPE is changed — even after a designer reload.
 * Its value is the owning Functionality widget's item id.
 */
export const FUNCTIONALITY_CHILD_PROPERTY = "codbi_func_child";

/** Property bag FORMCYCLE stores per item. */
type TItemProperties = Record<string, unknown>;

/** Minimal structural view of a designer item. */
interface IFuncItemLike {
  getId?(): string;
  className?: string;
  getPersist?(): { properties?: TItemProperties } | undefined;
  properties?: TItemProperties;
  remove?(): void;
  getContainer?(): JQuery | undefined;
  getItemContentCell?(): JQuery | undefined;
  refreshAndSetParentId?(): void;
  draw?(): Promise<void>;
}

/** Minimal structural view of the designer internals we rely on. */
interface IFuncDesignerLike {
  items?: Record<string, IFuncItemLike>;
  getSelectedMasterItem?(): IFuncItemLike | undefined;
  _createItemFromCatalogue?: (
    className: string,
    descriptor: { properties: TItemProperties; use_name_idx?: boolean },
    parentId?: string,
    noDraw?: boolean,
  ) => IFuncItemLike;
}

/** Reads the persisted properties of an item, preferring `getPersist()`. */
function propertiesOf(item: IFuncItemLike | undefined): TItemProperties | undefined {
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

/** @returns the ids of the child items this module previously created for [widgetId]. */
function childIdsOf(designer: IFuncDesignerLike, widgetId: string): string[] {
  const items = designer.items ?? {};
  const ids: string[] = [];
  for (const [id, item] of Object.entries(items)) {
    const props = propertiesOf(item);
    if (!props) {
      continue;
    }
    // Primary: our own marker property. Fallback: the designer's own `parentid` (reliable even if
    // the marker property was dropped when the item was (re)created).
    if (String(props[FUNCTIONALITY_CHILD_PROPERTY] ?? "") === widgetId || String(props.parentid ?? "") === widgetId) {
      ids.push(id);
    }
  }
  return ids;
}

/** Removes every child item this module previously created for [widgetId]. */
function removeChildrenOf(designer: IFuncDesignerLike, widgetId: string): void {
  for (const id of childIdsOf(designer, widgetId)) {
    try {
      designer.items?.[id]?.remove?.();
    } catch (x) {
      console.error("[CodBi] Functionality: could not remove child", id, x);
    }
  }
}

/**
 * Places a freshly created item's DOM inside the Functionality widget's content cell (its appendable
 * wrapper). Mirrors the designer's own drop rule.
 */
function placeInsideParent(parent: IFuncItemLike, item: IFuncItemLike): boolean {
  try {
    const cell = parent.getItemContentCell?.();
    const container = item.getContainer?.();
    if (!cell || !container || container.length === 0) {
      console.warn("[CodBi] Functionality: no content cell/container to place the child into");
      return false;
    }
    const parentId = parent.getId?.() ?? "";
    const appendable = parentId ? cell.find(`[data-xm-appendable="${parentId}"]`).first() : undefined;
    const wrapper =
      appendable && appendable.length > 0
        ? appendable
        : cell.find(".codbi-functionality").first().length > 0
          ? cell.find(".codbi-functionality").first()
          : cell.find(".XItem").first().length > 0
            ? cell.find(".XItem").first()
            : cell;
    wrapper.append(container);
    item.refreshAndSetParentId?.();
    return true;
  } catch (x) {
    console.error("[CodBi] Functionality: could not place the child into the parent", x);
    return false;
  }
}

/**
 * (Re)creates the Functionality widget's contained element: removes the previously created child and
 * creates a NEW element of the given FORMCYCLE widget class name (the chosen "type") nested under
 * the widget.
 *
 * @param designerLike the form designer instance.
 * @param className    the FORMCYCLE widget class name to create (e.g. `XTextArea`), or `""` to clear.
 * @param explicitWidget the Functionality widget to populate; defaults to the selected item.
 */
export async function syncFunctionalityChild(
  designerLike: unknown,
  className: string,
  explicitWidget?: unknown,
): Promise<void> {
  const designer = designerLike as IFuncDesignerLike;
  if (!designer) {
    return;
  }

  const widget = (explicitWidget as IFuncItemLike | undefined) ?? designer.getSelectedMasterItem?.();
  const widgetId = widget?.getId?.();
  if (!widgetId) {
    console.warn("[CodBi] Functionality: no widget item — nothing to do");
    return;
  }

  removeChildrenOf(designer, widgetId);

  if (!className) {
    return;
  }

  const createFromCatalogue = designer._createItemFromCatalogue?.bind(designer);
  if (!createFromCatalogue) {
    console.warn(
      "[CodBi] Functionality: the designer exposes no item factory (_createItemFromCatalogue) — the contained element is not materialized.",
    );
    return;
  }

  const properties: TItemProperties = {};
  properties[FUNCTIONALITY_CHILD_PROPERTY] = widgetId;

  try {
    const item = createFromCatalogue(className, { properties, use_name_idx: true }, widgetId);

    if (!item) {
      console.error("[CodBi] Functionality: the item factory returned no item for", className);
      return;
    }

    // The factory draws asynchronously; wait so we move the FINAL container.
    try {
      await item.draw?.();
    } catch (x) {
      console.warn("[CodBi] Functionality: draw() failed for", className, x);
    }

    placeInsideParent(widget, item);
  } catch (x) {
    console.error("[CodBi] Functionality: could not create the contained element", className, x);
  }
}

/** Convenience wrapper using the live designer instance (for use from the config editor). */
export async function syncSelectedFunctionalityChild(className: string): Promise<void> {
  await syncFunctionalityChild(instance(), className);
}

/** Finds the contained element item this module created for [widgetId] (or `undefined`). */
export function findFunctionalityChildItem(designerLike: unknown, widgetId: string): unknown {
  const designer = designerLike as IFuncDesignerLike;
  for (const item of Object.values(designer?.items ?? {})) {
    if (String(propertiesOf(item)?.[FUNCTIONALITY_CHILD_PROPERTY] ?? "") === widgetId) {
      return item;
    }
  }
  return undefined;
}

/**
 * Resolves the contained element item of the currently SELECTED Functionality widget (or
 * `undefined`). Used by the config editor to write parameter attributes into the CONTAINED
 * element's attribute table.
 */
export function containedElementItem(): unknown {
  const designer = instance() as IFuncDesignerLike;
  const widgetId = designer?.getSelectedMasterItem?.()?.getId?.();
  return widgetId ? findFunctionalityChildItem(designer, widgetId) : undefined;
}
