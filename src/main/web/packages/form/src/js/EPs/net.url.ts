// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the content of a URL.
 *
 * ### Config Parameter:
 *  1. The URL to retrieve from.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class NET_URL {
  /**
   * Uses {@link resolvePath } to retrieve the {@link Object } at the path specified in "params"[ 1 ] out of the
   * {@link Object } in "param[ 0 ]".
   *
   * @param params    The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't a URL been specified?")
    @AE.PRE(new REGEX(REGEX.stdExp.url))
    params: Array<unknown>,
  ): Promise<Array<unknown>> {
    return new Promise((resolve) => {
      const $ = getJQuery();
      // #region Retrieve the content the specified URL points to.
      $.get(params[0] as string).done((data) => {
        resolve([data]);
      });
      // #endregion Retrieve the content the specified URL points to.
    });
  }
}

window.codbi.registerEP("Net.URL", NET_URL.retrieve.bind(NET_URL)); // Initialization
