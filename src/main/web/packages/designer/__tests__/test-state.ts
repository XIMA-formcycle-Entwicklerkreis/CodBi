type Module = typeof import("@de-xima/fc-form-designer");

export interface TestState {
  customFormCategories: Parameters<Module["registerCustomFormCategory"]>[];

  customFormProperties: Parameters<Module["registerCustomFormProperty"]>[];

  customTranslations: Parameters<Module["registerCustomTranslations"]>[];

  language: string;
}

export let TestState: TestState = createDefaultTestState();

export function createDefaultTestState(): TestState {
  return {
    customFormCategories: [],
    customFormProperties: [],
    customTranslations: [],
    language: "en",
  };
}

export function resetTestState(): void {
  TestState = createDefaultTestState();
}
