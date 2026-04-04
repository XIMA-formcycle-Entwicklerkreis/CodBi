// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_REGEX.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_REGEX {
  /**
   * Registers the "HTML.Input.REGEX"-Functionality which require the value of {@link HTMLInputElement } to comply
   * to the provided {@link RegExp } - "expression".
   *
   * Config Parameter:
   *  - Expression:       The {@link RegExp } - {@link string } the value of "toProcess" has to comply to.
   *                      Use **°** instead of **^** to mark the beginning of the input string or a negation (*optional*).
   *  - KeyExpression:    The {@link RegExp } - {@link string } the individual keystrokes have to comply to.
   *  - Flags:            The {@link RegExp } - flags {@link string } used to create the "expression" (defaults to "g").
   *  - KeyFlags:         The {@link RegExp } - flags {@link string } used to create the "keyexpression" (defaults to "g").
   *  - ErrorPrefix:      The first part of the error message {@link string } displayed prior to the "expression".
   *  - ErrorPostfix:     The final part of the error message {@link string } displayed after  to the "expression".
   *  - ExposeExpression: Will expose the "expression" within the errormessage if set to **TRUE** (case insensitive). */

  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "expression :: flags :: keyexpression :: keyflags :: errorprefix :: errorpostfix")
    @TYPE.PRE("string | boolean", "exposeexpression")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "text"/> that is tagged with this functionality?',
    )
    @EQ.PRE("text", false, "type")
    toProcess: Element,
  ): void {
    // #region Normalize Parameter.
    if (toLoad.expression) {
      toLoad.expression = (toLoad.expression as string).replace(/°/, "^");
    }
    toLoad.exposeexpression = toLoad.exposeexpression
      ? typeof toLoad.exposeexpression === "string"
        ? toLoad.exposeexpression.toLowerCase() === "true"
        : toLoad.exposeexpression
      : false;
    // #endregion Normalize Parameter.
    const $ = getJQuery();
    // #region Live validation
    toProcess.addEventListener("keyup", (event) => {
      if ((event as KeyboardEvent).key === undefined) {
        return;
      }

      if ((event as KeyboardEvent).key.length === 1) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
    });

    toProcess.addEventListener("keydown", (event) => {
      if ((event as KeyboardEvent).key === undefined) {
        return;
      }

      if (
        toLoad.keyexpression &&
        ((event as KeyboardEvent).key.length === 1 || (event as KeyboardEvent).key === "Dead")
      ) {
        if (
          (event as KeyboardEvent).key === "Dead" ||
          !new RegExp(toLoad.keyexpression as string, toLoad.keyflags ? (toLoad.keyflags as string) : "i").test(
            (event as KeyboardEvent).key,
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        }
      }
    });

    if (toLoad.keyexpression) {
      const keyRegex = new RegExp(toLoad.keyexpression as string, toLoad.keyflags ? (toLoad.keyflags as string) : "i");
      toProcess.addEventListener("input", () => {
        const input = toProcess as HTMLInputElement;
        const cleaned = Array.from(input.value)
          .filter((ch) => keyRegex.test(ch))
          .join("");
        if (cleaned !== input.value) {
          const pos = input.selectionStart - (input.value.length - cleaned.length);
          input.value = cleaned;
          input.setSelectionRange(pos, pos);
        }
      });
    }
    // #region Live validation
    // #region Invalidate Field
    if (toLoad.expression) {
      toProcess.addEventListener("change", (event) => {
        if (
          !new RegExp(toLoad.expression as string, toLoad.flags ? (toLoad.flags as string) : "g").test(
            (toProcess as HTMLInputElement).value,
          )
        ) {
          $(toProcess).error(
            `${toLoad.errorprefix ? toLoad.errorprefix : "Text does not comply to "}${toLoad.exposeexpression ? toLoad.expression : "a certain restriction"}${toLoad.errorpostfix ? ` ${toLoad.errorpostfix}` : "."}`,
          );
        } else {
          $(toProcess).error("");
        }
      });
    }
    // #endregion Invalidate Field
  }
}

window.codbi.registerFunctionality("HTML.Input.REGEX", HTML_Input_REGEX.functionality.bind(HTML_Input_REGEX)); // Initialization
