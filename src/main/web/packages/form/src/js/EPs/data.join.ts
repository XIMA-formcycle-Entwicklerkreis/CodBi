// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
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
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class Data_Join {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Weren't the objects to join specified?")
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
}

window.codbi.registerEP("Data.Join", Data_Join.retrieve.bind(Data_Join)); // Initialization
