// #region Imports
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
  public static retrieve(params: Array<unknown>): Array<unknown> {
    return params.length === 1
      ? removeDuplicates(params[0] as [])
      : removeDuplicates(params[0] as [], params[1] as string);
  }
  // #region Initialization
  /**
   * States whether this {@link Unique } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Unique", Unique.retrieve);
  })();
  // #region Initialization
}
