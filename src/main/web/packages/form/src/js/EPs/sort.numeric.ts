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
 * Sorts the {@link Array } passed as the **1st** parameter **ascending** by a **numeric** property, whose
 * name is passed as the **2nd** parameter, and returns the **whole** sorted {@link Array }.
 *
 * Unlike the {@link Sorted } Element-Placeholder the comparison is **numeric**, not lexicographical, so
 * values such as `2` and `10` are ordered correctly. Entries whose sort property is missing or not numeric
 * are treated as `0` for the comparison. The input array itself is not mutated (a sorted copy is returned).
 *
 * ### Config Parameter:
 * - 1st: The {@link Array } of objects to sort.
 * - 2nd: The name of the numeric property to sort by (ascending), e.g. `sortierreihenfolge`.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Sort_Numeric {
  /**
   * Implements the **Sort.Numeric** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't at least the Array to sort been provided?")
    @AE.PRE(new INSTANCE(Array), 0)
    @AE.PRE(new TYPE("string"), 1)
    @AE.PRE(new REGEX(REGEX.stdExp.property), 1)
    params: Array<unknown>,
  ): Array<unknown> {
    const sorted = [...(params[0] as [])];

    if (params.length > 1) {
      const property = params[1] as string;

      sorted.sort((a, b) => {
        const valueA = Number((a as Record<string, unknown>)[property]) || 0;
        const valueB = Number((b as Record<string, unknown>)[property]) || 0;

        return valueA - valueB;
      });
    }

    return sorted;
  }
}

window.codbi.registerEP("Sort.Numeric", Sort_Numeric.retrieve.bind(Sort_Numeric)); // Initialization
