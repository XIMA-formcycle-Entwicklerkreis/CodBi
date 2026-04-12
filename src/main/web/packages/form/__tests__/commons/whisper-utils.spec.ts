import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";

import { preferredMimeType } from "../../src/js/commons/whisper-utils.js";

describe("preferredMimeType", () => {
  const supported = new Set<string>();

  beforeEach(() => {
    // Provide a minimal MediaRecorder stub since jsdom doesn't include it.
    (globalThis as any).MediaRecorder = {
      isTypeSupported: (type: string) => supported.has(type),
    };
  });

  afterEach(() => {
    supported.clear();
    delete (globalThis as any).MediaRecorder;
  });

  it("returns audio/webm;codecs=opus when supported", () => {
    supported.add("audio/webm;codecs=opus");

    expect(preferredMimeType()).toBe("audio/webm;codecs=opus");
  });

  it("falls back to audio/webm when opus codec is unsupported", () => {
    supported.add("audio/webm");

    expect(preferredMimeType()).toBe("audio/webm");
  });

  it("falls back to audio/ogg;codecs=opus", () => {
    supported.add("audio/ogg;codecs=opus");

    expect(preferredMimeType()).toBe("audio/ogg;codecs=opus");
  });

  it("falls back to audio/mp4 as last resort", () => {
    supported.add("audio/mp4");

    expect(preferredMimeType()).toBe("audio/mp4");
  });

  it("returns empty string when nothing is supported", () => {
    expect(preferredMimeType()).toBe("");
  });

  it("prefers webm+opus over plain webm", () => {
    supported.add("audio/webm");
    supported.add("audio/webm;codecs=opus");

    expect(preferredMimeType()).toBe("audio/webm;codecs=opus");
  });
});
