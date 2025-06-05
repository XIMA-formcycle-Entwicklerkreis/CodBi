import type {
  IBaseEditor,
  IEditorMap,
  IFormDesigner,
  TDependEvalFn,
  TEditorCfg,
  TEditorPropertyType,
} from "@de-xima/fc-form-designer";
import type { BaseEditor } from "@de-xima/fc-form-designer/dist/declarations/src/designer/view/property/baseEditor.js";

import { TestState } from "../../__tests__/test-state.js";
import $ from "jquery";

type Module = typeof import("@de-xima/fc-form-designer");

export const getLanguage: Module["getLanguage"] = () => TestState.language;

export const registerCustomFormProperty: Module["registerCustomFormProperty"] = (propertyDescriptor, location) =>
  TestState.customFormProperties.push([propertyDescriptor, location]);

export const registerCustomFormCategory: Module["registerCustomFormCategory"] = (category, location) =>
  TestState.customFormCategories.push([category, location]);

class BaseEditorMock<K extends keyof IEditorMap> implements IBaseEditor<K> {
  protected _idx: number = 0;
  afterAdd: () => void = () => {};
  appearance: string = "";
  config: TEditorCfg<IEditorMap[K]["descriptor"]>;
  className: string = "";
  depends: string = "";
  dependsEval: TDependEvalFn<K> = () => true;
  fcPlaceholderType: string | undefined = undefined;
  property: string = "";
  designer: IFormDesigner;
  i18n: Record<string, string> = {};
  constructor(config: TEditorCfg<IEditorMap[K]["descriptor"]>, i18nScope: string, appearance?: string) {
    this.config = config;
    this.designer = config.designer;
  }
  getPropertyRow(): JQuery {
    return $(`<div class="property-row"></div>`);
  }
  getPanelBox(): JQuery {
    return $(`<div class="property-panel-box"></div>`);
  }
  getEditorPanel(): JQuery {
    return $(`<div class="editor-panel"></div>`);
  }
  getPropertyType(): TEditorPropertyType | undefined {
    return undefined;
  }
  hide(): void {}
  show(): void {}
  setValueTo(value: IEditorMap[K]["value"]): void {}
  getElement(): JQuery {
    return $(`<div class="editor-element"></div>`);
  }
  getValue(): IEditorMap[K]["value"] {
    return {} as IEditorMap[K]["value"];
  }
  setValue(value: unknown): void {}
  protected getIdx(): number {
    return this._idx;
  }
  protected setIdx(): void {}
}

export const Editors: Partial<Module["Editors"]> = {
  BaseEditor: BaseEditorMock as unknown as typeof BaseEditor,
};
