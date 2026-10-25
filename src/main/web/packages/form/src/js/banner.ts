// #region Banner
/**
 * The CodBi console banner.
 *
 * The form bundle is loaded ONCE PER DOCUMENT: in a normal form page that is the page itself, but the
 * designer renders every element preview in its OWN iframe, each of which loads the form bundle. A
 * plain `console.log` at import time therefore printed the banner once per preview iframe, flooding
 * the console.
 *
 * The "already announced" flag is deliberately stored ON A WINDOW OBJECT instead of in a module
 * variable: every preview iframe has its own module scope, so a module variable would not suppress
 * anything. `window.top` is shared by all SAME-ORIGIN preview frames, which is exactly the scope in
 * which the banner should appear once.
 */
const BANNER_MARKER = "__codbiBannerAnnounced";

const BANNER_ART =
  "%c   ___         _  ___  _ \n" +
  "  / __|___   _| || _ )(_)\n" +
  " | (_ / _ \\/ _` || _ \\| |\n" +
  "  \\___\\___/\\__,_||___/|_|\n" +
  "%c           Code Library v1\n" +
  "         for XIMA FORMCYCLE\n";

const BANNER_ART_STYLE = "color:#4A90D9;font-weight:bold;font-size:14px;font-family:monospace;line-height:1.3;";
const BANNER_NOTE_STYLE = "color:#8896A7;font-size:11px;font-family:monospace;line-height:1.3;";

export type TBannerPrinter = (message: string, ...styles: string[]) => void;

const printToConsole: TBannerPrinter = (message, ...styles) => {
  console.log(message, ...styles);
};

/**
 * Reads the marker from a window that may be cross-origin (property access then throws).
 *
 * @param win - The window to inspect, optionally `undefined` when the top window is unavailable.
 * @returns `true` only when the marker is definitely set on that window.
 */
function isMarked(win: unknown): boolean {
  if (win === undefined || win === null) {
    return false;
  }

  try {
    return (win as Record<string, unknown>)[BANNER_MARKER] === true;
  } catch {
    // Cross-origin window → its properties are not readable.
    return false;
  }
}

/**
 * Sets the marker on a window that may be cross-origin (property assignment then throws).
 *
 * @param win - The window to mark, optionally `undefined` when the top window is unavailable.
 */
function mark(win: unknown): void {
  if (win === undefined || win === null) {
    return;
  }

  try {
    (win as Record<string, unknown>)[BANNER_MARKER] = true;
  } catch {
    // Cross-origin window → nothing to share, the own document marker still applies.
  }
}

/**
 * Resolves the top window of a document without throwing for cross-origin embeds.
 *
 * @param target - The window whose top window shall be resolved.
 * @returns The top window, or `undefined` when it cannot be reached.
 */
function topWindowOf(target: Window): Window | undefined {
  try {
    return target.top ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Prints the CodBi banner, but at most ONCE per top-level page.
 *
 * @param target - The window that loads the bundle (the document's own window).
 * @param print - The printer to use, injectable for tests.
 * @returns `true` when the banner has been printed by this call.
 */
export function announceCodbiBanner(target: Window = window, print: TBannerPrinter = printToConsole): boolean {
  const top = topWindowOf(target);
  const announced = isMarked(top) || isMarked(target);

  mark(top);
  mark(target);

  if (announced) {
    return false;
  }

  print(BANNER_ART, BANNER_ART_STYLE, BANNER_NOTE_STYLE);

  return true;
}
// #endregion
