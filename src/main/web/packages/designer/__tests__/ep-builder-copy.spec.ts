// Tests for the "copy result" button of the EP builder's retrieval result panel (EPBuilder.ts).
//
// Requested: "I need a copy button for the textbox showing the result of an ep retrieved by the ep
// builder." The result text is produced at runtime by the form and is often a JSON payload the user
// wants to reuse, so the button must copy exactly what the panel currently shows — including a value
// that changed while the panel stayed mounted — and must confirm the copy.

import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { createResultCopyButton, formatResult, formatResultText } from "../src/js/EPBuilder.js";
import { i18n } from "../src/js/i18n.js";

import { resetTestState, TestState } from "./test-state.js";

/** Installs a `navigator.clipboard` stub and returns its `writeText` mock. */
function installClipboard(outcome: "resolve" | "reject" = "resolve"): jest.Mock<(text: string) => Promise<void>> {
  const writeText = jest.fn<(text: string) => Promise<void>>(() =>
    outcome === "resolve" ? Promise.resolve() : Promise.reject(new Error("denied")),
  );

  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

  return writeText;
}

beforeEach(() => {
  TestState.language = "en";
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  resetTestState();
});

describe("EP builder result copy button", () => {
  it("starts with the copy icon and the copy tooltip", () => {
    installClipboard();

    const button = createResultCopyButton(document, () => "{}");

    expect(button.className).toContain("codbi-epb__resultcopy");
    expect(button.title).toBe(i18n("epBuilder.copyResult"));
    expect(button.getAttribute("aria-label")).toBe(i18n("epBuilder.copyResult"));
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("copies the displayed result and confirms the copy briefly", async () => {
    const writeText = installClipboard();

    const button = createResultCopyButton(document, () => '{"id":1,"bezeichnung":"Bauen"}');

    button.click();
    await jest.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith('{"id":1,"bezeichnung":"Bauen"}');
    expect(button.classList.contains("codbi-epb__resultcopy--done")).toBe(true);
    expect(button.textContent).toBe("✓");
    expect(button.title).toBe(i18n("epBuilder.copied"));

    await jest.advanceTimersByTimeAsync(1300);

    expect(button.classList.contains("codbi-epb__resultcopy--done")).toBe(false);
    expect(button.querySelector("svg")).not.toBeNull();
  });

  it("copies the value that is current when the button is clicked", async () => {
    const writeText = installClipboard();
    let text = "first";
    const button = createResultCopyButton(document, () => text);

    text = "second";
    button.click();
    await jest.advanceTimersByTimeAsync(0);

    expect(writeText).toHaveBeenCalledWith("second");
  });

  it("can start disabled and then never copies", async () => {
    const writeText = installClipboard();

    const button = createResultCopyButton(document, () => "Retrieving...", true);

    expect(button.disabled).toBe(true);
    button.click();
    await jest.advanceTimersByTimeAsync(0);

    expect(writeText).not.toHaveBeenCalled();
  });

  it("keeps the panel preview short but makes the COMPLETE result copyable", () => {
    // The real `/leistungen` payload is far larger than the panel can render; the panel shows a
    // preview ending in "…" while the copy button must yield the untouched text.
    const services = Array.from({ length: 400 }, (_, index) => ({
      id: index,
      bezeichnung: { leittext: "Bezeichnung", value: `Leistung ${index}` },
    }));

    const preview = formatResult(services);
    const full = formatResultText(services);

    expect(preview.length).toBeLessThan(full.length);
    expect(preview.endsWith("…")).toBe(true);
    expect(full).not.toContain("…");
    expect(JSON.parse(full)).toHaveLength(400);
  });

  it("keeps the icon and reports a failed copy", async () => {
    installClipboard("reject");

    const button = createResultCopyButton(document, () => "payload");

    button.click();
    await jest.advanceTimersByTimeAsync(0);

    expect(button.title).toBe(i18n("epBuilder.copyFailed"));
    expect(button.getAttribute("aria-label")).toBe(i18n("epBuilder.copyFailed"));
    expect(button.classList.contains("codbi-epb__resultcopy--done")).toBe(false);
    expect(button.querySelector("svg")).not.toBeNull();
  });
});
