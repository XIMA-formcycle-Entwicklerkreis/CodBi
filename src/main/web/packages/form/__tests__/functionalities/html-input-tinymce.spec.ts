import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

import { TestState, resetTestState } from "../test-state.js";

/**
 * The HTML.Input.TinyMCE functionality loads the real TinyMCE distribution from a resource-URL. In tests we
 * therefore provide a fake global `window.tinymce` whose `init` only captures the `setup` callback, so that
 * {@link functionality} short-circuits the loading step and lets us invoke the editor's setup manually.
 */
describe("HTML_Input_TinyMCE.functionality", () => {
  let HTML_Input_TinyMCE: any;
  let runSetup: (editor: any) => void;
  let mockEditor: any;
  let content: string;

  beforeEach(async () => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    TestState.xUtilCallbacks.clear();

    content = "<p>Hello <b>World</b></p>";
    mockEditor = {
      getContent: () => content,
      insertContent: jest.fn(),
      notificationManager: { open: jest.fn() },
      ui: { registry: { addButton: jest.fn() } },
      on: jest.fn(),
    };

    // Fake the TinyMCE distribution; `init` captures the editor's `setup` callback for manual invocation.
    (window as unknown as { tinymce: { init: (config: any) => void } }).tinymce = {
      init: (config: any) => {
        runSetup = config.setup;
      },
    };

    HTML_Input_TinyMCE = (await import("../../src/js/Functionalities/html.input.tinymce.js")).HTML_Input_TinyMCE;
  });

  afterEach(() => {
    delete (window as unknown as { tinymce?: unknown }).tinymce;
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
    resetTestState();
  });

  const flushMicrotasks = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

  it("does not register a print handler when RenderToPdf is not enabled", async () => {
    const textarea = document.createElement("textarea");

    HTML_Input_TinyMCE.functionality({ plugins: "", toolbar: "" } as never, textarea);
    await flushMicrotasks();

    expect(TestState.xUtilCallbacks.has("print")).toBe(false);
  });

  it("registers a print handler when RenderToPdf=true", async () => {
    const textarea = document.createElement("textarea");

    HTML_Input_TinyMCE.functionality({ plugins: "", toolbar: "", rendertopdf: "true" } as never, textarea);
    await flushMicrotasks();

    expect(runSetup).toBeDefined();
    runSetup(mockEditor);

    expect(TestState.xUtilCallbacks.has("print")).toBe(true);
  });

  it("replaces the document body with the editor's plain-text content on print", async () => {
    const textarea = document.createElement("textarea");

    HTML_Input_TinyMCE.functionality({ plugins: "", toolbar: "", rendertopdf: "true" } as never, textarea);
    await flushMicrotasks();
    runSetup(mockEditor);

    document.body.innerHTML = "<h1>Full Form</h1><p>original form content</p>";

    // Trigger the registered xutil "print" event (equivalent of $.xutil.on('print', ...)).
    for (const cb of [...(TestState.xUtilCallbacks.get("print") ?? [])]) {
      cb({} as never);
    }

    // HTML markup (<p>, <b>) is stripped — the body now only holds the plain text of the editor content,
    // wrapped in a <div> tagged with the "CodBi_TinyMCE_RenderToPdf" CSS-Class.
    expect(document.body.innerHTML).toBe('<div class="CodBi_TinyMCE_RenderToPdf">Hello World</div>');
  });

  it("accepts a native boolean value for RenderToPdf", async () => {
    const textarea = document.createElement("textarea");

    HTML_Input_TinyMCE.functionality({ plugins: "", toolbar: "", rendertopdf: true } as never, textarea);
    await flushMicrotasks();
    runSetup(mockEditor);

    document.body.innerHTML = "<p>ignored</p>";
    for (const cb of [...(TestState.xUtilCallbacks.get("print") ?? [])]) {
      cb({} as never);
    }

    expect(document.body.innerHTML).toBe('<div class="CodBi_TinyMCE_RenderToPdf">Hello World</div>');
  });
});
