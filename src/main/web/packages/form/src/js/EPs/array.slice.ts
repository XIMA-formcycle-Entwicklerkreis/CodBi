// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { OR } from "xdbc/src/DBC/OR";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Returns a part (a **slice**) of the {@link Array } passed as the **1st** parameter.
 *
 * The part is defined by the beginning index (the **2nd** parameter, inclusive). When the optional **3rd**
 * parameter (the end index, exclusive) is also given, the slice **from** the beginning **up to** that end is
 * returned. When only the beginning is defined, the slice from the beginning **to the end** of the array is
 * returned. Negative indices count from the end of the array, exactly like
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice | Array.slice }.
 *
 * ### Config Parameter:
 * - 1st: The {@link Array } from which the part is taken.
 * - 2nd: The beginning index (inclusive). When negative, it is treated as `array.length + begin`.
 * - 3rd: The optional end index (exclusive). When negative, it is treated as `array.length + end`.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Array_Slice {
  /**
   * Implements the **Array.Slice** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't the Array to slice been provided?")
    @AE.PRE(new INSTANCE(Array), 0)
    @AE.PRE(new OR([new TYPE("number"), new TYPE("string")]), 1)
    @AE.PRE(new OR([new TYPE("number"), new TYPE("string")]), 2)
    params: Array<unknown>,
  ): Array<unknown> {
    const array = params[0] as Array<unknown>;
    const begin = Number.parseInt(String(params[1]).trim(), 10);

    if (params.length > 2 && params[2] !== undefined) {
      const end = Number.parseInt(String(params[2]).trim(), 10);
      return array.slice(begin, end);
    }

    return array.slice(begin);
  }
}

window.codbi.registerEP("Array.Slice", Array_Slice.retrieve.bind(Array_Slice)); // Initialization
