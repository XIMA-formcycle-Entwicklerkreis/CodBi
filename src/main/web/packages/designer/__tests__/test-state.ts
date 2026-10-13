type Module = typeof import("@de-xima/fc-form-designer");

export interface TestState {
  customFormCategories: Parameters<Module["registerCustomFormCategory"]>[];

  customFormProperties: Parameters<Module["registerCustomFormProperty"]>[];

  customTranslations: Parameters<Module["registerCustomTranslations"]>[];

  /** Captures the element-level `registerCustomProperty` calls. */
  customProperties: Parameters<Module["registerCustomProperty"]>[];

  /** Captures the element-level `registerCustomCategory` calls. */
  customCategories: Parameters<Module["registerCustomCategory"]>[];

  /** Captures the `registerLocalizableProperty` calls. */
  localizableProperties: Parameters<Module["registerLocalizableProperty"]>[];

  /** Captures the `registerCustomEditor` calls (loosely typed due to the generic editor). */
  customEditors: Array<[name: string, editor: unknown]>;

  language: string;
}

export let TestState: TestState = createDefaultTestState();

export function createDefaultTestState(): TestState {
  return {
    customFormCategories: [],
    customFormProperties: [],
    customTranslations: [],
    customProperties: [],
    customCategories: [],
    localizableProperties: [],
    customEditors: [],
    language: "en",
  };
}

export function resetTestState(): void {
  TestState = createDefaultTestState();
}
