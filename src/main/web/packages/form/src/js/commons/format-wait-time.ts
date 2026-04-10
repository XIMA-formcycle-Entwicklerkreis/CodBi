/**
 * Formats an estimated wait time in milliseconds into a human-readable
 * short string for display in queue badges.
 *
 * @param ms  Estimated wait in milliseconds, or `null`/`undefined` if unknown.
 * @returns   A formatted string like `"(~12s)"` or `"(~2m)"`, or empty string
 *            when the value is absent or zero.
 */
export function formatWaitTime(ms: number | null | undefined): string {
  if (ms == null || ms <= 0) {
    return "";
  }
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `(~${totalSeconds}s)`;
  }
  const minutes = Math.round(totalSeconds / 60);
  return `(~${minutes}m)`;
}
