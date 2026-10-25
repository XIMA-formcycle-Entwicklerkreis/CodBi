import { describe, expect, it } from "@jest/globals";
import { announceCodbiBanner } from "../src/js/banner.js";

/**
 * Collects printed banners so the assertions can count them.
 *
 * @returns An object with the printer and the recorded messages.
 */
function recordingPrinter(): { print: (message: string, ...styles: string[]) => void; printed: string[] } {
  const printed: string[] = [];

  return {
    print: (message) => {
      printed.push(message);
    },
    printed,
  };
}

/**
 * Builds a fake `Window`/frame whose only meaningful member is the shared top window.
 *
 * @param top - The top window object the frame should resolve to.
 * @returns The fake window, cast to `Window`.
 */
function frameWith(top: unknown): Window {
  return { top } as unknown as Window;
}

describe("announceCodbiBanner", () => {
  it("prints the banner once for a top-level page and stays silent afterwards", () => {
    const topWindow: Record<string, unknown> = {};
    const target = frameWith(topWindow);
    const { print, printed } = recordingPrinter();

    expect(announceCodbiBanner(target, print)).toBe(true);
    expect(announceCodbiBanner(target, print)).toBe(false);

    expect(printed).toHaveLength(1);
    expect(printed[0]).toContain("Code Library v1");
  });

  it("prints only once although EVERY designer preview iframe loads the bundle", () => {
    const topWindow: Record<string, unknown> = {};
    const previewFrames = [frameWith(topWindow), frameWith(topWindow), frameWith(topWindow)];
    const { print, printed } = recordingPrinter();

    const results = previewFrames.map((frame) => announceCodbiBanner(frame, print));

    expect(results).toEqual([true, false, false]);
    expect(printed).toHaveLength(1);
  });

  it("stays silent inside a preview iframe when the page already printed the banner", () => {
    const topWindow: Record<string, unknown> = {};
    const { print, printed } = recordingPrinter();

    // The surrounding page (top-level document) loads the bundle first.
    expect(announceCodbiBanner(frameWith(topWindow), print)).toBe(true);
    // Then the designer mounts element previews which load the very same bundle.
    expect(announceCodbiBanner(frameWith(topWindow), print)).toBe(false);
    expect(announceCodbiBanner(frameWith(topWindow), print)).toBe(false);

    expect(printed).toHaveLength(1);
  });

  it("falls back to the own document when the top window is cross-origin", () => {
    const crossOriginTop = new Proxy(
      {},
      {
        get: () => {
          throw new Error("SecurityError");
        },
        set: () => {
          throw new Error("SecurityError");
        },
      },
    );
    const frame = frameWith(crossOriginTop);
    const { print, printed } = recordingPrinter();

    expect(announceCodbiBanner(frame, print)).toBe(true);
    expect(announceCodbiBanner(frame, print)).toBe(false);

    expect(printed).toHaveLength(1);
  });

  it("prints once when the top window cannot even be resolved", () => {
    const frame = {
      get top(): unknown {
        throw new Error("SecurityError");
      },
    } as unknown as Window;
    const { print, printed } = recordingPrinter();

    // The unresolved top window is skipped and the own document marker de-duplicates.
    expect(announceCodbiBanner(frame, print)).toBe(true);
    expect(announceCodbiBanner(frame, print)).toBe(false);
    expect(printed).toHaveLength(1);
  });
});
