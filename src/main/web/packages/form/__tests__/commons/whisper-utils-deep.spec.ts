import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { convertToWav } from "../../src/js/commons/whisper-utils.js";

describe("convertToWav", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };

    // Polyfill Blob.arrayBuffer for jsdom
    if (!Blob.prototype.arrayBuffer) {
      Blob.prototype.arrayBuffer = function () {
        return new Promise<ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as ArrayBuffer);
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(this);
        });
      };
    }

    // Mock AudioContext
    (globalThis as any).AudioContext = class {
      sampleRate = 44100;
      async decodeAudioData(_buffer: ArrayBuffer) {
        return {
          length: 100,
          sampleRate: 44100,
          numberOfChannels: 2,
          getChannelData: (ch: number) => {
            const data = new Float32Array(100);
            data.fill(ch === 0 ? 0.5 : -0.3);
            return data;
          },
        };
      }
      async close() {}
    };
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    delete (globalThis as any).AudioContext;
  });

  it("converts stereo audio blob to WAV", async () => {
    const inputBlob = new Blob([new ArrayBuffer(100)], { type: "audio/webm" });
    const result = await convertToWav(inputBlob);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("audio/wav");
    expect(result.size).toBeGreaterThan(44); // WAV header is 44 bytes
  });

  it("produces valid WAV header", async () => {
    const inputBlob = new Blob([new ArrayBuffer(100)], { type: "audio/webm" });
    const result = await convertToWav(inputBlob);
    const buffer = await result.arrayBuffer();
    const view = new DataView(buffer);

    // RIFF header
    expect(String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))).toBe("RIFF");
    // WAVE format
    expect(String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11))).toBe("WAVE");
    // PCM format (1)
    expect(view.getUint16(20, true)).toBe(1);
    // Mono (1 channel)
    expect(view.getUint16(22, true)).toBe(1);
    // Sample rate 44100
    expect(view.getUint32(24, true)).toBe(44100);
    // 16 bits per sample
    expect(view.getUint16(34, true)).toBe(16);
  });

  it("handles mono audio input", async () => {
    (globalThis as any).AudioContext = class {
      sampleRate = 16000;
      async decodeAudioData(_buffer: ArrayBuffer) {
        return {
          length: 50,
          sampleRate: 16000,
          numberOfChannels: 1,
          getChannelData: () => {
            const data = new Float32Array(50);
            data.fill(0.25);
            return data;
          },
        };
      }
      async close() {}
    };

    const inputBlob = new Blob([new ArrayBuffer(50)], { type: "audio/ogg" });
    const result = await convertToWav(inputBlob);

    expect(result.type).toBe("audio/wav");
    // 44 header + 50 samples * 2 bytes = 144
    expect(result.size).toBe(144);
  });

  it("clamps sample values to [-1, 1]", async () => {
    (globalThis as any).AudioContext = class {
      sampleRate = 8000;
      async decodeAudioData(_buffer: ArrayBuffer) {
        return {
          length: 4,
          sampleRate: 8000,
          numberOfChannels: 1,
          getChannelData: () => new Float32Array([2.0, -2.0, 0.0, 0.5]),
        };
      }
      async close() {}
    };

    const inputBlob = new Blob([new ArrayBuffer(10)], { type: "audio/webm" });
    const result = await convertToWav(inputBlob);
    const buffer = await result.arrayBuffer();
    const view = new DataView(buffer);

    // Clamped +2.0 → 1.0 → 0x7FFF
    expect(view.getInt16(44, true)).toBe(0x7fff);
    // Clamped -2.0 → -1.0 → -0x8000
    expect(view.getInt16(46, true)).toBe(-0x8000);
  });
});
