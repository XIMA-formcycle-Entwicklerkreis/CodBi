import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

/**
 * Tests for the Media.MultipleUpload functionality: drag & drop area, styled upload button and the
 * overlapping-card preview of the selected files.
 */
describe("Media.MultipleUpload", () => {
  let Media_MultipleUpload: any;

  beforeEach(async () => {
    document.body.innerHTML = "";
    const mod = await import("../../src/js/Functionalities/media.multipleupload.js");

    Media_MultipleUpload = mod.Media_MultipleUpload;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  /** Mounts a Formcycle-like upload field: a label that wraps the file input. */
  function mountUpload(): { container: HTMLDivElement; label: HTMLLabelElement; input: HTMLInputElement } {
    const container = document.createElement("div");
    const label = document.createElement("label");
    const input = document.createElement("input");

    input.type = "file";
    input.setAttribute("maxlength", "20");
    label.textContent = "Upload file";
    label.appendChild(input);
    container.appendChild(label);
    document.body.appendChild(container);

    return { container, label, input };
  }

  function selectFiles(input: HTMLInputElement, files: File[]): void {
    Object.defineProperty(input, "files", {
      configurable: true,
      value: files,
      writable: true,
    });
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  it("gives every control button a darkorange border but leaves the choose-files CTA borderless", () => {
    const { input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);

    const css = Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");

    // Every control button of the widget (maximize, remove all, show all, previous/next, remove single,
    // the per-card trash and the lightbox close) carries the CodBi accent border.
    expect(css).toMatch(/\.CodBi_MultiUpload__btn\s*{[^}]*border:\s*1px solid darkorange/);
    expect(css).toMatch(/\.CodBi_MultiUpload__card-remove\s*{[^}]*border:\s*1px solid darkorange/);
    expect(css).toMatch(/\.CodBi_MultiUpload__dialog-close\s*{[^}]*border:\s*1px solid darkorange/);
    // The "choose files" call-to-action stays borderless.
    expect(css).toMatch(/\.CodBi_MultiUpload__label\s*{[^}]*border:\s*none/);
  });

  it("wraps the field in a drag & drop area and enables multiple selection", () => {
    const { container, label, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);

    const wrapper = container.querySelector(".CodBi_MultiUpload");

    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector(".CodBi_MultiUpload__dropzone")).not.toBeNull();
    expect(input.hasAttribute("multiple")).toBe(true);
    expect(input.hasAttribute("maxlength")).toBe(false);
    expect(label.classList.contains("CodBi_MultiUpload__label")).toBe(true);
    // The original caption of the upload button must be preserved.
    expect(label.querySelector(".CodBi_MultiUpload__label-text")?.textContent).toBe("Upload file");
  });

  it("creates its own upload button when no label wraps the input", () => {
    const container = document.createElement("div");
    const input = document.createElement("input");

    input.type = "file";
    container.appendChild(input);
    document.body.appendChild(container);

    Media_MultipleUpload.functionality({}, input);

    const button = container.querySelector(".CodBi_MultiUpload__label");

    expect(button).not.toBeNull();
    expect(button?.tagName).toBe("BUTTON");
    expect(button?.textContent).toContain("Choose files");
  });

  it("is idempotent — a second call does not add another widget", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);
    Media_MultipleUpload.functionality({}, input);

    expect(container.querySelectorAll(".CodBi_MultiUpload")).toHaveLength(1);
  });

  it("renders one overlapping preview card per selected file", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);
    selectFiles(input, [
      new File(["a"], "first.txt", { type: "text/plain" }),
      new File(["bb"], "second.pdf", { type: "application/pdf" }),
    ]);

    const preview = container.querySelector<HTMLElement>(".CodBi_MultiUpload__preview");

    expect(preview?.hidden).toBe(false);
    expect(container.querySelectorAll(".CodBi_MultiUpload__card")).toHaveLength(2);
    expect(container.querySelector(".CodBi_MultiUpload__count")?.textContent).toBe("2 files selected");
    expect(container.querySelectorAll(".CodBi_MultiUpload__card-remove")).toHaveLength(2);
  });

  it("hides the preview again when no files are selected", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);
    selectFiles(input, [new File(["a"], "first.txt", { type: "text/plain" })]);
    expect(container.querySelector<HTMLElement>(".CodBi_MultiUpload__preview")?.hidden).toBe(false);

    selectFiles(input, []);
    expect(container.querySelector<HTMLElement>(".CodBi_MultiUpload__preview")?.hidden).toBe(true);
  });

  it("reports too many files using the configured messages", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({ maximum: "1", prefixtoomany: "Max: ", postfixtoomany: " files!" }, input);
    selectFiles(input, [
      new File(["a"], "first.txt", { type: "text/plain" }),
      new File(["b"], "second.txt", { type: "text/plain" }),
    ]);

    const error = container.querySelector<HTMLElement>(".CodBi_MultiUpload__error");

    expect(error?.hidden).toBe(false);
    expect(error?.textContent).toBe("Max: 1 files!");
  });

  it("highlights the dropzone while files are dragged over it", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);

    const dropzone = container.querySelector<HTMLElement>(".CodBi_MultiUpload__dropzone")!;
    const dragEvent = new Event("dragenter");

    Object.defineProperty(dragEvent, "dataTransfer", { configurable: true, value: { files: [] } });
    dropzone.dispatchEvent(dragEvent);

    expect(dropzone.classList.contains("CodBi_MultiUpload__dropzone--dragover")).toBe(true);
  });

  it("drops files into the input via a synthetic DataTransfer", () => {
    class FakeDataTransfer {
      public items = {
        add: (file: File) => {
          this.filesArray.push(file);
        },
      };
      public filesArray: File[] = [];
      public get files(): File[] {
        return this.filesArray;
      }
    }

    const original = (globalThis as any).DataTransfer;

    (globalThis as any).DataTransfer = FakeDataTransfer;

    try {
      const { container, input } = mountUpload();

      // jsdom's native `files` setter only accepts a real FileList — shadow it so the synthetic
      // DataTransfer's plain list can be assigned (mirrors a browser's FileList assignment).
      Object.defineProperty(input, "files", { configurable: true, value: [], writable: true });

      Media_MultipleUpload.functionality({}, input);

      const dropzone = container.querySelector<HTMLElement>(".CodBi_MultiUpload__dropzone")!;
      const file = new File(["a"], "dropped.txt", { type: "text/plain" });
      const dropEvent = new Event("drop");

      Object.defineProperty(dropEvent, "dataTransfer", { configurable: true, value: { files: [file] } });
      dropzone.dispatchEvent(dropEvent);

      expect(input.files).toHaveLength(1);
      expect(input.files?.[0].name).toBe("dropped.txt");
      expect(container.querySelectorAll(".CodBi_MultiUpload__card")).toHaveLength(1);
    } finally {
      (globalThis as any).DataTransfer = original;
    }
  });

  it("shows the preview as part of the single dropzone panel", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);
    selectFiles(input, [new File(["a"], "first.txt", { type: "text/plain" })]);

    expect(container.querySelector(".CodBi_MultiUpload__dropzone .CodBi_MultiUpload__preview")).not.toBeNull();
  });

  it("maximizes exactly the clicked file and the button shows the full grid", () => {
    const { container, input } = mountUpload();

    Media_MultipleUpload.functionality({}, input);
    selectFiles(input, [
      new File(["a"], "first.txt", { type: "text/plain" }),
      new File(["b"], "second.pdf", { type: "application/pdf" }),
    ]);

    const cards = container.querySelectorAll<HTMLElement>(".CodBi_MultiUpload__card");

    cards[1].click();

    expect(document.querySelector(".CodBi_MultiUpload__overlay")).not.toBeNull();
    expect(document.querySelector(".CodBi_MultiUpload__single-name")?.textContent).toBe("second.pdf");
    expect(document.querySelector(".CodBi_MultiUpload__grid")).toBeNull();

    document.querySelector<HTMLElement>(".CodBi_MultiUpload__dialog-close")?.click();
    expect(document.querySelector(".CodBi_MultiUpload__overlay")).toBeNull();

    container.querySelector<HTMLElement>(".CodBi_MultiUpload__btn--maximize")?.click();

    expect(document.querySelectorAll(".CodBi_MultiUpload__grid .CodBi_MultiUpload__card")).toHaveLength(2);

    document.querySelector<HTMLElement>(".CodBi_MultiUpload__dialog-close")?.click();
  });

  it("keeps the maximized preview open while files are removed inside it", () => {
    class FakeDataTransfer {
      public items = {
        add: (file: File) => {
          this.filesArray.push(file);
        },
      };
      public filesArray: File[] = [];
      public get files(): File[] {
        return this.filesArray;
      }
    }

    const original = (globalThis as any).DataTransfer;

    (globalThis as any).DataTransfer = FakeDataTransfer;

    try {
      const { container, input } = mountUpload();

      Object.defineProperty(input, "files", { configurable: true, value: [], writable: true });

      Media_MultipleUpload.functionality({}, input);
      selectFiles(input, [
        new File(["a"], "first.txt", { type: "text/plain" }),
        new File(["b"], "second.pdf", { type: "application/pdf" }),
      ]);

      // Open the single-file lightbox on the first file, then remove it from inside the modal.
      container.querySelectorAll<HTMLElement>(".CodBi_MultiUpload__card")[0].click();
      expect(document.querySelector(".CodBi_MultiUpload__single-name")?.textContent).toBe("first.txt");

      document.querySelector<HTMLElement>(".CodBi_MultiUpload__overlay .CodBi_MultiUpload__btn--danger")?.click();

      // The modal stays open and now shows the remaining file.
      expect(document.querySelector(".CodBi_MultiUpload__overlay")).not.toBeNull();
      expect(document.querySelector(".CodBi_MultiUpload__single-name")?.textContent).toBe("second.pdf");

      // Removing the last file closes it.
      document.querySelector<HTMLElement>(".CodBi_MultiUpload__overlay .CodBi_MultiUpload__btn--danger")?.click();
      expect(document.querySelector(".CodBi_MultiUpload__overlay")).toBeNull();
    } finally {
      (globalThis as any).DataTransfer = original;
    }
  });

  it("removes the CodBi loading spinner so it cannot keep spinning", () => {
    const { label, input } = mountUpload();

    input.setAttribute("data-name", "uploadFieldA");

    const loader = document.createElement("div");

    loader.className = "cCodBiLoader";
    loader.setAttribute("cbFOR", "uploadFieldA");
    label.appendChild(loader);

    Media_MultipleUpload.functionality({}, input);

    expect(document.querySelector(".cCodBiLoader")).toBeNull();
  });
});
