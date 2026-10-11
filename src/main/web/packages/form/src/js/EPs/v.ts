// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { AE } from "xdbc/src/DBC/AE";
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires a global variable's value.
 *
 * Placeholder Parameter:
 *  -1st: The name of the global variable.
 *  -2nd: **REPORT** if a {@link CodBiError } shall be thrown when the global variable isn't
 *        existent. Otherwise an empty {@link string } will be acquired.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class V {
  /**
   * Acquires the value of the global variable specified by the 1st parameter.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws  A {@link CodBiError } if the specified global variable couldn't be found if the second element
   *          of **params** is set to **REPORT**. Otherwise a empty {@link string } will be returned. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't at least the the variable's CSS-Selector been specified?")
    @AE.PRE(new REGEX(/\w+/), 0)
    params: Array<string>,
  ): string {
    const name = (params[0] as string).trim();
    const target = V.findGlobalVariable(name);

    if (target === undefined) {
      if (params.length === 2 && (params[1] as string).toLowerCase() === "report") {
        throw new CodBiError(`No global variable "${params[0]}" existent.`);
      }

      return "";
    }

    return V.readVariableValue(target);
  }

  /**
   * Locates the DOM-{@link Element} backing the global variable **name**. The historical `data-name`
   * lookup is tried FIRST so already-working forms resolve to the exact same element as before; only
   * when that yields nothing do the extra fallbacks (`XVariable`/native `name`) kick in, covering
   * Formcycle variable inputs that are rendered without a `data-name` attribute.
   *
   * @param name The name of the global variable to locate (already trimmed).
   *
   * @returns The backing {@link Element } or **undefined** when the variable isn't declared. */
  private static findGlobalVariable(name: string): Element | undefined {
    // `[data-name]` first = byte-for-byte the historical query; the rest are additive fallbacks.
    const selectors = [`[data-name="${name}"]`, `input.XVariable[name="${name}"]`, `[name="${name}"]`];

    for (const selector of selectors) {
      const match = document.querySelector(selector);

      if (match) {
        return match;
      }
    }

    // Case-insensitive fallback — variable/field names may differ from the queried casing.
    const lowered = name.toLowerCase();

    for (const candidate of document.querySelectorAll("[data-name],[name]")) {
      const keys = [candidate.getAttribute("data-name"), candidate.getAttribute("name")];

      if (keys.some((key) => key?.trim().toLowerCase() === lowered)) {
        return candidate;
      }
    }

    return undefined;
  }

  /**
   * Reads the value of the given variable {@link Element }. To stay backward compatible the `value`
   * attribute is returned whenever it is present (identical to the historical behavior); only when it
   * is absent — e.g. because Formcycle initializes the declared variable input at runtime, without a
   * `value` attribute — does it fall back to the live {@link HTMLInputElement.value } property.
   *
   * @param target The {@link Element } backing the global variable.
   *
   * @returns The variable's value (never **null** / **undefined**). */
  private static readVariableValue(target: Element): string {
    const attribute = target.getAttribute("value");

    if (attribute !== null) {
      return attribute;
    }

    const control = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      return control.value ?? "";
    }

    return "";
  }
}

window.codbi.registerEP("V", V.retrieve.bind(V)); // Initialization
