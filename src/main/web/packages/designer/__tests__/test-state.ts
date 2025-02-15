type Module = typeof import("@de-xima/fc-form-designer");

/**
 * Global state when running tests, for features that require global state.
 * For example, the current language of the form designer is stored here.
 */
export interface TestState {
  /**
   * Custom form categories that were registered during tests.
   */
  customFormCategories: Parameters<Module["registerCustomFormCategory"]>[];

  /**
   * Custom form properties that were registered during tests.
   */
  customFormProperties: Parameters<Module["registerCustomFormProperty"]>[];

  /**
   * The current language of the form designer (mocked for tests).
   */
  language: string;
}

/**
 * Global state when running tests, for features that require global state.
 * For example, the current language of the form designer is stored here.
 */
export let TestState: TestState = createDefaultTestState();

export function createDefaultTestState(): TestState {
  return {
    customFormCategories: [],
    customFormProperties: [],
    language: "en",
  };
}

/**
 * Resets {@link TestState} to its default values.
 */
export function resetTestState(): void {
  TestState = createDefaultTestState();
}
