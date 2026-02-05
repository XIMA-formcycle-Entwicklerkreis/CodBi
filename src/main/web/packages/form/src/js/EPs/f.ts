// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * Finds the objects within an {@link Array } that have a specific **property** with a specific **value**.
 * If a single object is found, no {@link Array } will be returned, if no object is found an empty {@Array }.
 *
 * Config Parameter:
 * - 1st: The **name** of the property to look for.
 * - 2nd: The **value** the property to look for has to have.
 * - 3rd: The {@link Array } of objects to scan.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class F {
  /**
   * Implements the {@link F } Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  @INSTANCE.POST(Array)
  public static retrieve(
    @GREATER.PRE(3, true, false, "length", "Haven't the name, the value and the pool to search been specified?")
    @AE.PRE(new TYPE("string"), 0)
    @AE.PRE(new DEFINED(), 1)
    @AE.PRE(new INSTANCE(Array), 2)
    params: Array<unknown>,
  ): Array<unknown> | unknown {
    const result = [];

    for (const candidate of params[2] as []) {
      if (candidate[params[0] as string] === params[1]) {
        result.push(candidate);
      }
    }

    return result;
  }
}

window.codbi.registerEP("F", F.retrieve.bind(F)); // Initialization
