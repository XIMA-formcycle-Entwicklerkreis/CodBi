// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Joins the properties of multiple {@link object }s into one.
 * Properties will get overridden by the subsequent ones.
 *
 * Config Parameter:
 *  The {@link object }s to join.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class Data_Join {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE([new TYPE("object")])
    params: Array<unknown>,
  ): Array<unknown> {
    const result: { [key: string]: unknown } = {};

    for (const toProcess of params) {
      for (const key in toProcess as { [key: string]: unknown }) {
        result[key] = (toProcess as { [key: string]: unknown })[key];
      }
    }

    return [result];
  }
  // #region Initialization
  /**
   * States whether this {@link Data_Join } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Data.Join", Data_Join.retrieve);
  })();
  // #region Initialization
}
