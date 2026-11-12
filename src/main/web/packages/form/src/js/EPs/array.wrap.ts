// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
// #endregion XDBC
// #endregion Imports
/**
 * Wraps the value passed as the **1st** parameter into a single-element {@link Array }, e.g. an object
 * becomes `[ object ]`. If the value already is an {@link Array } it is returned **as is**.
 *
 * This is useful to turn a single EP result (such as the element acquired by the {@link I }
 * Element-Placeholder) back into an array-compatible shape.
 *
 * ### Config Parameter:
 * - 1st: The value to wrap into an {@link Array }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Array_Wrap {
  /**
   * Implements the **Array.Wrap** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't the value to wrap been provided?")
    params: Array<unknown>,
  ): Array<unknown> {
    return Array.isArray(params[0]) ? (params[0] as Array<unknown>) : [params[0]];
  }
}

window.codbi.registerEP("Array.Wrap", Array_Wrap.retrieve.bind(Array_Wrap)); // Initialization
