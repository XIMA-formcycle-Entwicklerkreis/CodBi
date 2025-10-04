// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires a global variable's value.
 *
 * Placeholder Parameter:
 *  - The index to retrieve.
 *  - The {@link Array } from which to retrieve the value from.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class I {
  /**
   * Acquires the value at a certain index of an {@link Array }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if the specified global variable couldn't be found. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @REGEX.PRE(REGEX.stdExp.cssSelector)
    params: Array<string>,
  ): string {
    if (!Array.isArray(params[1])) {
      throw new CodBiError(`The second parameter of I must be an array but is of type ${typeof params[1]}.`);
    }

    return params[1][Number.parseInt(params[0])];
  }
  /**
   * States whether this {@link I } was successfully registered via {@link CodbiGlobal.registerEP } with the CodBi and
   * performs the registration upon class usage. */
  public static registered: boolean = (() => {
    return window.codbi.registerEP("I", I.retrieve);
  })();
  // #region Initialization
}
