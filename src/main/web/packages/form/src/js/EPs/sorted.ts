// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * An Elementplaceholder sorts the {@link Array } passed as the **1st** parameter in
 * alphabetical (lexicographical) order.
 *
 * ### Config Parameter:
 * - 1st: The {@link Array } to sort.
 * - 2nd: The optional name of a property to use to sort elements of the given {@link Array }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Sorted {
  /**
   * Implements the **Sorted** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the the Array to sort been provided?")
    @AE.PRE(new INSTANCE(Array), 0)
    @AE.PRE(new TYPE("string"), 1)
    @AE.PRE(new REGEX(REGEX.stdExp.property), 1)
    params: Array<unknown>,
  ): Array<unknown> {
    if (params.length > 1) {
      (params[0] as []).sort((a, b) => {
        const nameA = (a[params[1] as string] as string).toUpperCase();
        const nameB = (b[params[1] as string] as string).toUpperCase();

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });

      return params[0] as Array<unknown>;
    }

    return (params as string[]).sort();
  }
}

window.codbi.registerEP("Sorted", Sorted.retrieve.bind(Sorted)); // Initialization
