import { describe, expect, it, jest, beforeAll } from "@jest/globals";

import { acquireWakeLock, releaseWakeLock } from "../../src/js/commons/wake-lock.js";

/**
 * Tests run in sequence because wake-lock uses module‑scoped refCount
 * and activeLock variables that persist across calls.
 */
describe("wake-lock", () => {
  const mockRelease = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const mockRequest = jest.fn<() => Promise<{ release: () => Promise<void> }>>().mockResolvedValue({
    release: mockRelease,
  });

  beforeAll(() => {
    Object.defineProperty(navigator, "wakeLock", {
      value: { request: mockRequest },
      writable: true,
      configurable: true,
    });
  });

  it("acquires a screen wake lock on first call", async () => {
    await acquireWakeLock();

    expect(mockRequest).toHaveBeenCalledWith("screen");
  });

  it("does not re-request wake lock on second acquire", async () => {
    mockRequest.mockClear();

    await acquireWakeLock();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("does not release sentinel while refCount > 0", async () => {
    // refCount is 2, release once → refCount becomes 1
    await releaseWakeLock();

    expect(mockRelease).not.toHaveBeenCalled();
  });

  it("releases sentinel when refCount reaches 0", async () => {
    // refCount is 1, release → refCount becomes 0
    await releaseWakeLock();

    expect(mockRelease).toHaveBeenCalled();
  });

  it("does nothing when release is called at refCount 0", async () => {
    mockRelease.mockClear();

    await releaseWakeLock();

    expect(mockRelease).not.toHaveBeenCalled();
  });
});
