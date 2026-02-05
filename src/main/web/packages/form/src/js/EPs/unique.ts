// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
import { removeDuplicates } from "../Functionalities/ldap.autocomplete";
// #endregion Imports
/**
 * An Elementplaceholder filters the {@link Array } passed as the **1st** parameter from duplicates.
 * If the optional **2nd** parameter is specified the elements will be filtered according to a certain
 * property.
 *
 * Config Parameter:
 * - 1st: The {@link Array } to filter.
 * - 2nd: The optional name of a property to use to filter out elements of the given {@link Array }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Unique {
  /**
   * Transforms the {@link Array } passed as the **1st** parameter into one that has no duplicates.
   * If the optional **2nd** parameter is specified the elements will be filtered according to a certain
   * property.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the Array to filter been provided?")
    @AE.PRE(new INSTANCE(Array), 0)
    @AE.PRE(new TYPE("string"), 1)
    @AE.PRE(new REGEX(REGEX.stdExp.property), 1)
    params: Array<unknown>,
  ): Array<unknown> {
    return params.length === 1
      ? removeDuplicates(params[0] as [])
      : removeDuplicates(params[0] as [], params[1] as string);
  }
}

window.codbi.registerEP("Unique", Unique.retrieve.bind(Unique)); // Initialization
