// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires the value of the URL-parameter whose name is
 * specified by the 1st parameter.
 *
 * Placeholder Parameter:
 *  -1st: The name of the URL-parameter to read.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class URLParameter {
  /**
   * Acquires the value of the URL-parameter specified by the 1st parameter.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @returns The URL-parameter's value or an empty {@link string } if the URL doesn't contain
   *          a parameter with the specified name. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't the URL-parameter's name been specified?")
    @AE.PRE(new REGEX(/[\w.-]+/), 0)
    params: Array<string>,
  ): string {
    const parameterName = (params[0] as string).trim();

    return new URLSearchParams(window.location.search).get(parameterName) ?? "";
  }
}

window.codbi.registerEP("URLParameter", URLParameter.retrieve.bind(URLParameter)); // Initialization
