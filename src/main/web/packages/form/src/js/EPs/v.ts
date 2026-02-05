// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
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
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
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
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the the variable's CSS-Selector been specified?")
    @REGEX.PRE(/\w+/)
    params: Array<string>,
  ): string {
    const result: string | undefined | null = document
      .querySelector(`[ data-name = "${(params[0] as string).trim()}"]`)
      ?.getAttribute("value");

    if (result === undefined || result === null) {
      if (params.length === 2 && (params[1] as string).toLowerCase() === "report") {
        throw new CodBiError(`No global variable "${params[0]}" existent.`);
      }

      return "";
    }

    return result;
  }
}

window.codbi.registerEP("V", V.retrieve.bind(V)); // Initialization
