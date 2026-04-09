/** Thin wrapper around the Screen Wake Lock API.
 *  Prevents the screen from turning off during long-running operations
 *  (Whisper transcription, LLaMA inference). Degrades gracefully — no-op
 *  on browsers that don't support the API. */

let activeLock: WakeLockSentinel | null = null;
let refCount = 0;

/** Request a screen wake lock.  Multiple callers may overlap; the lock
 *  is only released when every caller has called {@link releaseWakeLock}. */
export async function acquireWakeLock(): Promise<void> {
  refCount++;

  if (activeLock) {
    return;
  }

  try {
    // biome-ignore lint/suspicious/noExplicitAny: WakeLock API not in all TS libs.
    activeLock = await (navigator as any).wakeLock?.request("screen");
  } catch {
    // Silently ignore — permission denied, low battery, or unsupported.
  }
}

/** Release one reference.  The underlying sentinel is released when the
 *  ref-count reaches zero. */
export async function releaseWakeLock(): Promise<void> {
  refCount = Math.max(0, refCount - 1);

  if (refCount === 0 && activeLock) {
    try {
      await activeLock.release();
    } catch {
      // Already released or invalid.
    }

    activeLock = null;
  }
}
