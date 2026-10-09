# CodBi Mirror — Option 1: Mirror as an appendable container of real field items

Status: **implemented** (backend + designer). Verified build: `mvnw.cmd -o -q -DskipTests compile`
(Kotlin + web bundle). Pending: live end-to-end verification in a running FORMCYCLE instance.

## Implementation summary

- `XMirror` implements `IXItemAppendable`; `renderItem` now emits only a container, appends it and
  calls `renderCtx.registerParent(wrapper)` (the `XContainer` mechanism). The live source-HTML
  rendering and the id/name namespacing of that path were removed.
- `MirrorFormAccess.valueAbleFields(userContext, formKey, elementRef)` lists the source element's
  value-able descendants (and the element itself when value-able).
- `MirrorServletAction` `action=fields&form=&element=` returns them as `[{id,name,label,className}]`.
- Designer: new `packages/designer/src/js/MirrorChildItems.ts` — `syncMirrorChildren(designer, form,
  element)` removes the previously generated children (tracked via the `codbi_mirror_owner` property)
  and creates one real child item per field through the designer's internal
  `_createItemFromCatalogue(className, {properties:{name}}, mirrorId)`. Wired into
  `MirrorElementSelect` (on element change) and `MirrorFormSelect` (clear on form change).
- `MirrorSelect.ts` gains `mirrorElementFields(form, element)`.

## Goal

Make the values a user enters in a mirrored field usable as `[%fieldName%]` placeholders
in the **target** form's workflows/mails, and make those fields appear in the
placeholder-selection dialog. The Mirror must become a container that owns real copies of
the source element's value-able fields.

## Verified facts (evidence-backed)

1. **Value collection is name-based and open.** `GenericSaveFormData.handleSingleElement`
   creates a `FormFieldMetaData(name, EFormFieldTyp.UNKNOWN, null)` for **any** posted
   parameter, and `DefaultFormValueReplacer` resolves `[%name%]` via `getFieldValues(name)`.
   => A real input that submits under `name` is resolvable; no hidden materialization needed
   for resolution.

2. **Placeholders are name-based `[%name%]`.** The designer's token regex
   `/\[%[^\]]+%\]/g` and the rename refactor helper
   (`form-designer.min.js` @ 428775) rewrite `[%oldName%] -> [%newName%]` and CSS selectors
   `[name=oldName]`. So the field **name** is the currency.

3. **The placeholder dialog lists real designer Items only.** `registerValueableItem(sel)`
   appends to the internal selector array `Ze = ["table.xm-item-container[removed!=true][data-cn=XTextField]", ...]`;
   `_refreshValueAbleItems()` then finds those nodes and maps each through
   `wt(node) = jQuery .prop("item")` (a real `Item`), reading `properties.name`/`properties.id`.
   Server-rendered inner inputs (no designer Item) are skipped. => A hand-rolled Mirror
   sub-field cannot be listed; a **real child item** can.

4. **Nesting is native and flat.** Persist holds a flat `items` array; nesting is expressed by
   `properties.parentid` (`refreshAndSetParentId()` sets it from the closest
   `.xm-item-container` ancestor).

5. **Containers render children via `renderCtx.registerParent(wrapper)`.** FORMCYCLE's own
   `XContainer.renderItem()` creates a `Div`, `container.appendChild(wrapper)`, then
   `renderCtx.registerParent(wrapper)`; the renderer then nests child items into that wrapper.
   `XMirror.renderItem` already calls `registerParent(wrapper)`.

6. **`isAppendable` is derived from the marker interface.** `XItemsDescriptor.getItemDescription()`
   emits `"isAppendable": (<widget> instanceof IXItemAppendable)`. The designer reads
   descriptors from `config.xitemdesc.widgets` and uses `Ke[className].prototype.isAppendable`
   to decide drop-target/drop-source behaviour and which element can host children.

## Decision (Option 1)

The copied child items **are** the real, visible fields. The Mirror becomes a plain
appendable container; the live source-HTML rendering is dropped. Children show as normal
nested fields in the designer, render + submit + list in the dialog at runtime.
No double submission.

## Implemented so far (backend)

- `XMirror : IXItemWidget, IXItemAppendable` — makes the widget appendable (designer) and a
  container (renderer). `super<IXItemWidget>.renderItemPreview(...)` disambiguates the now
  ambiguous `super`.
- `MirrorFormAccess.valueAbleFields(userContext, formKey, elementRef): List<MirrorField>` —
  depth-first list of the value-able descendants (and the element itself when value-able),
  each with `id`, `name`, `label`, `className`. Reuses `childrenIndex`/`itemJsonByRef`.
- `MirrorServletAction` `action=fields&form=<key>&element=<ref>` — returns those fields as
  JSON `[{id,name,label,className}]`.

Both compile (`mvnw.cmd -o -q -DskipTests compile`).

## TODO — designer integration (next)

The designer's public `IFormDesigner` API exposes **no** item-creation method
(`_createItem`, `_dropItem`, `_insertItem` are private). The plugin must therefore use the
designer instance obtained via `instance()` and either:

- **A (pragmatic, recommended):** cast to access the private factory and the drop pipeline,
  e.g. `d._createItem(className)` -> `Item`, set `properties.name` to the native name, then
  `d.dropItem({ isCreate:true, isMove:false, isDelete:false, target:<mirror content cell>,
  dir:"top", defaulttgt:<mirror content cell>, item })`, finally `item.refreshAndSetParentId()`.
  Determine `<mirror content cell>` via the selected Mirror item's `getItemContentCell()`.
  Wrap all private access in a typed adapter with defensive try/catch.

- **B (structural):** contribute an "element template" through the templates mechanism so the
  copy is inserted through a supported path. Investigate `createTemplate()` /
  `IFormTemplateData` (`persistUri`, `templateId`) and the clipboard importer before choosing.

Steps:

1. Extend `register-custom-mirror-properties.ts` (or the mirror dropdown code) so that on a
   source-element change it:
   - fetches `action=fields&form=&element=` for the selected source element,
   - removes previously generated child items of this Mirror (track their ids),
   - creates one child item per returned field with `properties.name` = native name and
     `properties.parentid` = the Mirror's id, of `className` matching the source field.
2. Drop the live source-HTML rendering from `XMirror.renderItem` (Option 1): keep only the
   wrapper + `registerParent` (+ attributes). Keep a small unconfigured placeholder/hint.
   Remove the now-unused `MirrorFormAccess.renderElementNode`/`appendDescendants` preview path
   (or keep it solely for the unconfigured designer hint).
3. Register the Mirror container so it can host children (already achieved via
   `IXItemAppendable`); ensure the CSS makes an empty Mirror/container legible in the canvas.
4. Optional: `registerValueableItem` for the Mirror container itself is **not** required for
   the children (standard field widgets are already valuable items).

## Runtime verification

- `[%nativeName%]` resolves in a workflow mail.
- Exactly one submitting input per native name (no duplicates).
- Round-trip: reconfigure the source element -> old children removed, new children created,
  placeholders referencing removed names surface as unresolved.

## Edge cases to cover

- Two Mirrors referencing the same source element (id collisions -> ids are generated per
  child item; `name` collides -> decide namespacing policy and surface the effective name).
- Two different sources exposing the same field name.
- Nested value-able descendants (already returned by `valueAbleFields`).
- Required/validation attributes on copied fields.
- Repeatable containers (`dynamic*` properties).
- Source field renamed/deleted after linking (children become stale; detect and warn).
- Name collision with a field already present in the target form.

## Tests

- Kotlin: `MirrorFormAccess.valueAbleFields` (nested, self-value-able, missing element),
  servlet `action=fields` JSON shape.
- Frontend: creation/refresh of child items on source change; removal of stale children.

## Docs

- Update the Mirror widget user documentation with the new "the mirror owns real copies"
  semantics and the placeholder usage.

## Build / deploy

- `scripts/Safe Build Deploy.ps1` (or `mvnw.cmd -Pdev -DskipTests=true "-DfcDeployUrl=..."
  fc-deploy:deploy`), then verify in the designer dialog and a workflow mail.
